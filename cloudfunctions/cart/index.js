const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-8gbfcrr39555713f'
})

const db = cloud.database()

// 购物车表名
const CART_COLLECTION = 'cart'

exports.main = async (event, context) => {
  const { action } = event
  const openid = cloud.getWXContext().OPENID

  console.log('购物车云函数调用:', { action, openid, event })

  try {
    switch (action) {
      case 'addToCart':
        return await addToCart(event, openid)
      case 'getCart':
        return await getCart(openid)
      case 'updateCartItem':
        return await updateCartItem(event, openid)
      case 'removeCartItem':
        return await removeCartItem(event, openid)
      case 'removeSelected':
        return await removeSelected(event, openid)
      case 'clearCart':
        return await clearCart(openid)
      default:
        return { code: -1, message: '不支持的操作' }
    }
  } catch (error) {
    console.error('购物车云函数执行失败:', error)
    return { code: -1, message: '服务器错误', error: error.message }
  }
}

// 添加商品到购物车
async function addToCart(event, openid) {
  const { bookId, quantity = 1 } = event

  if (!bookId) {
    return { code: -1, message: '缺少商品ID' }
  }

  try {
    // 首先获取商品信息
    const bookResult = await db.collection('books').doc(bookId).get()
    if (!bookResult.data) {
      return { code: -1, message: '商品不存在' }
    }

    const book = bookResult.data

    // 检查商品库存
    if (book.stock < quantity) {
      return { code: -1, message: '库存不足' }
    }

    // 检查购物车中是否已存在该商品
    const existingItem = await db.collection(CART_COLLECTION)
      .where({
        openid: openid,
        bookId: bookId
      })
      .get()

    if (existingItem.data.length > 0) {
      // 如果已存在，更新数量
      const item = existingItem.data[0]
      const newQuantity = item.quantity + quantity

      if (newQuantity > book.stock) {
        return { code: -1, message: '库存不足' }
      }

      await db.collection(CART_COLLECTION).doc(item._id).update({
        data: {
          quantity: newQuantity,
          updateTime: new Date()
        }
      })
      
      return { code: 0, message: '购物车已更新', data: { quantity: newQuantity } }
    } else {
      // 如果不存在，添加新记录
      const cartItem = {
        openid: openid,
        bookId: bookId,
        title: book.title,
        price: book.price,
        originalPrice: book.originalPrice || book.price,
        images: book.images || [book.icon || '📚'],
        merchantId: book.merchantId,
        merchantName: book.merchantName || '商家',
        quantity: quantity,
        checked: true, // 新添加的商品默认选中
        stock: book.stock,
        createTime: new Date(),
        updateTime: new Date()
      }

      const result = await db.collection(CART_COLLECTION).add({
        data: cartItem
      })

      return { code: 0, message: '已加入购物车', data: { _id: result._id } }
    }
  } catch (error) {
    console.error('添加购物车失败:', error)
    return { code: -1, message: '添加失败', error: error.message }
  }
}

// 获取购物车列表
async function getCart(openid) {
  try {
    const result = await db.collection(CART_COLLECTION)
      .where({
        openid: openid
      })
      .orderBy('createTime', 'desc')
      .get()

    // 按商家分组
    const merchants = {}
    result.data.forEach(item => {
      const merchantId = item.merchantId || 'default'
      const merchantName = item.merchantName || '商家'
      
      if (!merchants[merchantId]) {
        merchants[merchantId] = {
          id: merchantId,
          name: merchantName,
          checked: false,
          items: []
        }
      }
      
      merchants[merchantId].items.push({
        id: item._id,
        bookId: item.bookId,
        title: item.title,
        price: item.price,
        originalPrice: item.originalPrice,
        images: item.images,
        quantity: item.quantity,
        stock: item.stock,
        checked: item.checked !== undefined ? item.checked : true, // 默认选中
        createTime: item.createTime
      })
    })

    // 转换为数组格式
    const merchantList = Object.values(merchants)

    return { 
      code: 0, 
      message: '获取成功', 
      data: merchantList,
      total: result.data.length 
    }
  } catch (error) {
    console.error('获取购物车失败:', error)
    return { code: -1, message: '获取失败', error: error.message }
  }
}

// 更新购物车商品
async function updateCartItem(event, openid) {
  const { itemId, quantity, checked } = event

  if (!itemId) {
    return { code: -1, message: '缺少商品ID' }
  }

  try {
    const updateData = { updateTime: new Date() }
    
    if (quantity !== undefined) {
      if (quantity <= 0) {
        return { code: -1, message: '数量必须大于0' }
      }
      updateData.quantity = quantity
    }
    
    if (checked !== undefined) {
      updateData.checked = checked
    }

    await db.collection(CART_COLLECTION)
      .where({
        _id: itemId,
        openid: openid
      })
      .update({
        data: updateData
      })

    return { code: 0, message: '更新成功' }
  } catch (error) {
    console.error('更新购物车失败:', error)
    return { code: -1, message: '更新失败', error: error.message }
  }
}

// 删除购物车商品
async function removeCartItem(event, openid) {
  const { itemId } = event

  if (!itemId) {
    return { code: -1, message: '缺少商品ID' }
  }

  try {
    await db.collection(CART_COLLECTION)
      .where({
        _id: itemId,
        openid: openid
      })
      .remove()

    return { code: 0, message: '删除成功' }
  } catch (error) {
    console.error('删除购物车商品失败:', error)
    return { code: -1, message: '删除失败', error: error.message }
  }
}

// 删除选中的商品
async function removeSelected(event, openid) {
  try {
    await db.collection(CART_COLLECTION)
      .where({
        openid: openid,
        checked: true
      })
      .remove()

    return { code: 0, message: '删除成功' }
  } catch (error) {
    console.error('删除选中商品失败:', error)
    return { code: -1, message: '删除失败', error: error.message }
  }
}

// 清空购物车
async function clearCart(openid) {
  try {
    await db.collection(CART_COLLECTION)
      .where({
        openid: openid
      })
      .remove()

    return { code: 0, message: '清空成功' }
  } catch (error) {
    console.error('清空购物车失败:', error)
    return { code: -1, message: '清空失败', error: error.message }
  }
} 