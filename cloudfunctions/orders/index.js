const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-8gbfcrr39555713f'
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const { OPENID, APPID, UNIONID } = wxContext

  console.log('订单云函数调用:', { 
    action, 
    openid: OPENID, 
    appid: APPID,
    openidLength: OPENID ? OPENID.length : 0,
    timestamp: new Date().toISOString()
  })

  // 验证用户身份
  if (!OPENID) {
    console.error('OPENID 获取失败:', wxContext)
    return {
      code: -1,
      message: '用户身份验证失败，无法获取 OPENID'
    }
  }

  // 验证用户是否存在
  try {
    const userResult = await db.collection('users').where({
      openid: OPENID
    }).get()
    
    console.log(`用户验证结果: openid=${OPENID}, 查询到用户数=${userResult.data.length}`)
    
    if (userResult.data.length === 0) {
      console.error(`用户不存在: openid=${OPENID}`)
      return {
        code: -1,
        message: '用户不存在，请重新登录'
      }
    }
    
    // 输出用户基本信息（不包含敏感数据）
    const user = userResult.data[0]
    console.log(`当前用户: id=${user._id}, openid=${user.openid}, nickname=${user.nickName}`)
    
  } catch (error) {
    console.error('验证用户存在性失败:', error)
    return {
      code: -1,
      message: '身份验证错误: ' + error.message
    }
  }

  try {
    switch (action) {
      case 'createOrder':
        return await createOrder(event, OPENID)
      case 'getOrders':
        return await getOrders(event, OPENID)
      case 'updateOrderStatus':
        return await updateOrderStatus(event, OPENID)
      case 'cancelOrder':
        return await cancelOrder(event, OPENID)
      case 'payOrder':
        return await payOrder(event, OPENID)
      case 'getOrderDetail':
        return await getOrderDetail(event, OPENID)
      case 'shipOrder':
        return await shipOrder(event, OPENID)
      default:
        return {
          code: -1,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('订单云函数执行错误:', error)
    return {
      code: -1,
      message: '服务器错误: ' + error.message
    }
  }
}

// 创建订单
async function createOrder(event, openid) {
  const { items, totalPrice, deliveryAddress, orderType = 'cart' } = event
  
  if (!items || items.length === 0) {
    return { code: -1, message: '订单商品不能为空' }
  }
  
  if (!deliveryAddress) {
    return { code: -1, message: '收货地址不能为空' }
  }

  // 获取用户信息
  const userResult = await db.collection('users').where({
    openid: openid
  }).get()
  
  if (userResult.data.length === 0) {
    return { code: -1, message: '用户不存在' }
  }
  
  const user = userResult.data[0]

  // 验证库存并准备订单商品数据
  const orderItems = []
  let calculatedTotal = 0
  
  // 按商家分组处理
  const merchantGroups = {}
  
  for (const item of items) {
    // 获取商品最新信息
    const bookResult = await db.collection('books').doc(item.bookId).get()
    if (!bookResult.data) {
      return { code: -1, message: `商品 ${item.title} 不存在` }
    }
    
    const book = bookResult.data
    
    // 检查库存
    if (book.stock < item.quantity) {
      return { code: -1, message: `商品 ${book.title} 库存不足` }
    }
    
    // 检查价格是否一致
    if (book.price !== item.price) {
      return { code: -1, message: `商品 ${book.title} 价格已变更，请重新下单` }
    }
    
    calculatedTotal += book.price * item.quantity
    
    // 按商家分组
    const merchantId = book.merchantId
    if (!merchantGroups[merchantId]) {
      merchantGroups[merchantId] = {
        merchantId: merchantId,
        merchantName: book.merchantName || '商家',
        items: [],
        totalPrice: 0
      }
    }
    
    merchantGroups[merchantId].items.push({
      bookId: book._id,
      title: book.title,
      price: book.price,
      quantity: item.quantity,
      images: book.images || ['📚'],
      icon: book.icon || '📚'
    })
    
    merchantGroups[merchantId].totalPrice += book.price * item.quantity
  }
  
  // 验证总价
  if (Math.abs(calculatedTotal - totalPrice) > 0.01) {
    return { code: -1, message: '订单总价不匹配，请重新下单' }
  }

  const now = new Date()
  const expireTime = new Date(now.getTime() + 60 * 60 * 1000) // 1小时后过期
  
  // 为每个商家创建一个订单
  const createdOrders = []
  
  for (const merchantId in merchantGroups) {
    const group = merchantGroups[merchantId]
    
    const orderData = {
      orderNo: generateOrderNo(),
      userId: openid,
      userName: user.nickname || '用户',
      userPhone: user.phone || '',
      merchantId: group.merchantId,
      merchantName: group.merchantName,
      items: group.items,
      totalPrice: group.totalPrice,
      totalQuantity: group.items.reduce((sum, item) => sum + item.quantity, 0),
      deliveryAddress: deliveryAddress,
      status: 'pending', // pending-待支付, paid-已支付待发货, shipping-待收货, completed-已完成, cancelled-已取消
      statusText: '待支付',
      orderType: orderType, // cart-购物车下单, direct-立即购买
      createTime: now,
      expireTime: expireTime,
      updateTime: now
    }
    
    // 插入订单
    const orderResult = await db.collection('orders').add({
      data: orderData
    })
    
    if (!orderResult._id) {
      return { code: -1, message: '创建订单失败' }
    }
    
    createdOrders.push({
      ...orderData,
      _id: orderResult._id
    })
  }

  // 如果是从购物车下单，清空选中的购物车商品
  if (orderType === 'cart') {
    try {
      for (const item of items) {
        await db.collection('cart').where({
          userId: openid,
          bookId: item.bookId
        }).remove()
      }
    } catch (error) {
      console.log('清空购物车失败，但订单已创建:', error)
    }
  }

  return {
    code: 0,
    message: '订单创建成功',
    data: createdOrders
  }
}

// 获取订单列表
async function getOrders(event, openid) {
  const { status = 'all', page = 1, limit = 20 } = event
  
  console.log('获取订单列表请求参数:', { status, page, limit, openid })
  
  // 确保 openid 有效
  if (!openid) {
    console.error('openid 为空')
    return { code: -1, message: 'openid 无效' }
  }
  
  try {
    // 构建查询条件 - 严格按照当前用户筛选
    const whereCondition = { userId: openid }
    
    // 根据状态筛选
    if (status !== 'all') {
      whereCondition.status = status
    }
    
    console.log('查询条件:', whereCondition)
    
    // 执行查询
    const result = await db.collection('orders')
      .where(whereCondition)
      .orderBy('createTime', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get()
    
    console.log(`查询结果统计: 共找到 ${result.data.length} 条订单`)
    
    // 验证查询结果的数据完整性
    result.data.forEach((order, index) => {
      console.log(`订单 ${index}: userId=${order.userId}, orderNo=${order.orderNo}, openid匹配=${order.userId === openid}`)
      
      // 如果发现不匹配的订单，记录错误
      if (order.userId !== openid) {
        console.error(`数据异常: 订单 ${order.orderNo} 的 userId (${order.userId}) 与当前用户 openid (${openid}) 不匹配`)
      }
    })
    
    // 再次过滤确保数据安全 - 前端保护
    const filteredOrders = result.data.filter(order => order.userId === openid)
    
    if (filteredOrders.length !== result.data.length) {
      console.error(`数据过滤: 原始查询 ${result.data.length} 条，过滤后 ${filteredOrders.length} 条`)
    }
    
    // 格式化订单数据
    const orders = filteredOrders.map(order => ({
      ...order,
      createTime: formatDate(order.createTime),
      totalPrice: order.totalPrice.toFixed(2),
      statusClass: getStatusClass(order.status)
    }))
    
    console.log(`最终返回 ${orders.length} 条订单给用户 ${openid}`)
    
    return {
      code: 0,
      message: '获取成功',
      data: orders
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
    return {
      code: -1,
      message: '查询订单失败: ' + error.message
    }
  }
}

// 更新订单状态
async function updateOrderStatus(event, openid) {
  const { orderId, status, statusText } = event
  
  if (!orderId || !status) {
    return { code: -1, message: '参数不完整' }
  }
  
  console.log('更新订单状态:', { orderId, status, openid })
  
  // 检查订单是否存在且属于当前用户
  const orderResult = await db.collection('orders').doc(orderId).get()
  if (!orderResult.data) {
    return { code: -1, message: '订单不存在' }
  }
  
  const order = orderResult.data
  if (order.userId !== openid) {
    console.log('权限验证失败:', { orderUserId: order.userId, currentOpenid: openid })
    return { code: -1, message: '无权限操作此订单' }
  }
  
  // 更新订单状态
  await db.collection('orders').doc(orderId).update({
    data: {
      status: status,
      statusText: statusText || getStatusText(status),
      updateTime: new Date()
    }
  })
  
  return {
    code: 0,
    message: '状态更新成功'
  }
}

// 取消订单
async function cancelOrder(event, openid) {
  const { orderId } = event
  
  if (!orderId) {
    return { code: -1, message: '订单ID不能为空' }
  }
  
  console.log('取消订单:', { orderId, openid })
  
  // 检查订单
  const orderResult = await db.collection('orders').doc(orderId).get()
  if (!orderResult.data) {
    return { code: -1, message: '订单不存在' }
  }
  
  const order = orderResult.data
  if (order.userId !== openid) {
    console.log('权限验证失败:', { orderUserId: order.userId, currentOpenid: openid })
    return { code: -1, message: '无权限操作此订单' }
  }
  
  // 只有待支付和已支付未发货的订单可以取消
  if (!['pending', 'paid'].includes(order.status)) {
    return { code: -1, message: '当前订单状态不能取消' }
  }
  
  // 更新订单状态为已取消
  await db.collection('orders').doc(orderId).update({
    data: {
      status: 'cancelled',
      statusText: '已取消',
      updateTime: new Date()
    }
  })
  
  // 如果是已支付的订单，这里需要处理退款逻辑（暂时省略）
  
  return {
    code: 0,
    message: '订单已取消'
  }
}

// 支付订单（调用支付云函数）
async function payOrder(event, openid) {
  const { orderId } = event
  
  if (!orderId) {
    return { code: -1, message: '订单ID不能为空' }
  }
  
  console.log('发起支付:', { orderId, openid })
  
  try {
    // 获取订单信息
    const orderResult = await db.collection('orders').doc(orderId).get()
    if (!orderResult.data) {
      return { code: -1, message: '订单不存在' }
    }
    
    const order = orderResult.data
    console.log('支付订单信息:', { 
      orderId: order._id, 
      orderNo: order.orderNo, 
      orderUserId: order.userId, 
      currentOpenid: openid,
      userIdType: typeof order.userId,
      openidType: typeof openid,
      userIdLength: order.userId ? order.userId.length : 0,
      openidLength: openid ? openid.length : 0,
      isEqual: order.userId === openid,
      trimmedEqual: order.userId.trim() === openid.trim()
    })
    
    if (order.userId !== openid) {
      console.log('权限验证失败:', { 
        orderUserId: order.userId, 
        currentOpenid: openid,
        userIdLength: order.userId ? order.userId.length : 0,
        openidLength: openid ? openid.length : 0,
        userIdCharCodes: order.userId ? order.userId.split('').map(c => c.charCodeAt(0)) : [],
        openidCharCodes: openid ? openid.split('').map(c => c.charCodeAt(0)) : []
      })
      return { code: -1, message: '无权限操作此订单' }
    }
    
    if (order.status !== 'pending') {
      return { code: -1, message: '订单状态错误' }
    }
    
    // 调用支付云函数进行统一下单
    console.log('准备调用支付云函数:', {
      orderId: orderId,
      orderUserId: order.userId,
      currentOpenid: openid,
      totalFee: order.totalPrice,
      orderNo: order.orderNo
    })
    
    const paymentResult = await cloud.callFunction({
      name: 'payment',
      data: {
        action: 'unifiedOrder',
        orderId: orderId,
        totalFee: order.totalPrice,
        description: `学长二手书-订单${order.orderNo}`,
        openid: openid  // 传递当前用户的 openid
      }
    })
    
    console.log('支付云函数完整调用结果:', JSON.stringify(paymentResult, null, 2))
    console.log('支付云函数result字段:', paymentResult.result)
    console.log('支付云函数errMsg字段:', paymentResult.errMsg)
    
    // 检查云函数调用是否成功
    if (paymentResult.errMsg !== 'callFunction:ok') {
      console.error('云函数调用失败:', paymentResult.errMsg)
      return {
        code: -1,
        message: '支付服务调用失败: ' + paymentResult.errMsg
      }
    }
    
    return paymentResult.result
  } catch (error) {
    console.error('支付处理异常:', error)
    return {
      code: -1,
      message: '支付处理失败: ' + error.message
    }
  }
}

// 获取订单详情
async function getOrderDetail(event, openid) {
  const { orderId } = event
  
  if (!orderId) {
    return { code: -1, message: '订单ID不能为空' }
  }
  
  console.log('获取订单详情:', { orderId, openid })
  
  const orderResult = await db.collection('orders').doc(orderId).get()
  if (!orderResult.data) {
    return { code: -1, message: '订单不存在' }
  }
  
  const order = orderResult.data
  if (order.userId !== openid) {
    console.log('权限验证失败:', { orderUserId: order.userId, currentOpenid: openid })
    return { code: -1, message: '无权限查看此订单' }
  }
  
  // 格式化订单数据
  const formattedOrder = {
    ...order,
    createTime: formatDate(order.createTime),
    totalPrice: order.totalPrice.toFixed(2),
    statusClass: getStatusClass(order.status)
  }
  
  return {
    code: 0,
    message: '获取成功',
    data: formattedOrder
  }
}

// 商家发货
async function shipOrder(event, openid) {
  const { orderId } = event
  
  if (!orderId) {
    return { code: -1, message: '订单ID不能为空' }
  }
  
  // 检查订单
  const orderResult = await db.collection('orders').doc(orderId).get()
  if (!orderResult.data) {
    return { code: -1, message: '订单不存在' }
  }
  
  const order = orderResult.data
  
  // 检查是否是商家操作（这里简化处理，实际应该验证商家身份）
  if (order.status !== 'paid') {
    return { code: -1, message: '订单状态错误，只有已支付的订单可以发货' }
  }
  
  // 更新订单状态为待收货
  await db.collection('orders').doc(orderId).update({
    data: {
      status: 'shipping',
      statusText: '待收货',
      shipTime: new Date(),
      updateTime: new Date()
    }
  })
  
  return {
    code: 0,
    message: '发货成功'
  }
}

// 工具函数

// 生成订单号
function generateOrderNo() {
  const now = new Date()
  const timestamp = now.getTime()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${timestamp}${random}`
}

// 格式化日期
function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hour = d.getHours().toString().padStart(2, '0')
  const minute = d.getMinutes().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    'pending': '待支付',
    'paid': '待发货',
    'shipping': '待收货',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || '未知状态'
}

// 获取状态样式类
function getStatusClass(status) {
  const classMap = {
    'pending': 'pending',
    'paid': 'shipping',
    'shipping': 'receiving',
    'completed': 'completed',
    'cancelled': 'cancelled'
  }
  return classMap[status] || 'pending'
} 