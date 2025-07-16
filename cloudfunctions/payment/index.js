const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-8gbfcrr39555713f'
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action } = event
  const { OPENID } = cloud.getWXContext()

  console.log('支付云函数调用:', { action, openid: OPENID, eventKeys: Object.keys(event) })

  try {
    // 检查是否是微信支付回调（微信支付回调不会有action参数，但会有支付相关字段）
    if (!action && (event.resultCode || event.returnCode || event.outTradeNo)) {
      console.log('检测到微信支付回调:', event)
      return await paymentNotify(event)
    }
    
    switch (action) {
      case 'unifiedOrder':
        return await unifiedOrder(event, OPENID)
      case 'paymentNotify':
        return await paymentNotify(event)
      case 'queryOrder':
        return await queryOrder(event, OPENID)
      default:
        console.log('未知操作，事件内容:', event)
        return {
          code: -1,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('支付云函数执行错误:', error)
    return {
      code: -1,
      message: '服务器错误: ' + error.message
    }
  }
}

// 统一下单
async function unifiedOrder(event, contextOpenid) {
  const { orderId, totalFee, description, openid } = event
  
  // 优先使用传递的 openid，如果没有则使用上下文中的 openid
  const currentOpenid = openid || contextOpenid
  
  if (!orderId || !totalFee) {
    return { code: -1, message: '参数不完整' }
  }

  console.log('统一下单请求:', { orderId, totalFee, description, openid: currentOpenid, passedOpenid: openid, contextOpenid: contextOpenid })

  try {
    // 获取订单信息
    console.log('开始查询订单:', { orderId, queryType: 'doc' })
    const orderResult = await db.collection('orders').doc(orderId).get()
    console.log('订单查询结果:', { 
      found: !!orderResult.data, 
      dataKeys: orderResult.data ? Object.keys(orderResult.data) : [],
      orderResult: orderResult.data 
    })
    
    if (!orderResult.data) {
      return { code: -1, message: '订单不存在' }
    }

    const order = orderResult.data
    console.log('订单信息:', { 
      orderId: order._id, 
      orderNo: order.orderNo, 
      orderUserId: order.userId, 
      currentOpenid: currentOpenid,
      userIdType: typeof order.userId,
      openidType: typeof currentOpenid,
      isEqual: order.userId === currentOpenid
    })
    
    if (order.userId !== currentOpenid) {
      console.log('支付权限验证失败:', { orderUserId: order.userId, currentOpenid: currentOpenid })
      return { code: -1, message: '无权限操作此订单' }
    }

    if (order.status !== 'pending') {
      return { code: -1, message: '订单状态错误' }
    }

    // 检查订单是否过期
    if (new Date() > new Date(order.expireTime)) {
      await db.collection('orders').doc(orderId).update({
        data: {
          status: 'cancelled',
          statusText: '已取消（超时）',
          updateTime: new Date()
        }
      })
      return { code: -1, message: '订单已超时' }
    }

    // 检查是否已经有支付信息（避免重复调用微信支付）
    if (order.paymentInfo && order.paymentInfo.prepayId) {
      console.log('订单已有支付信息，直接返回:', order.paymentInfo)
      
      // 验证支付信息是否仍然有效（prepayId一般2小时有效）
      const paymentTime = order.paymentInfo.timeStamp ? new Date(parseInt(order.paymentInfo.timeStamp) * 1000) : order.updateTime
      const now = new Date()
      const diffHours = (now.getTime() - paymentTime.getTime()) / (1000 * 60 * 60)
      
      if (diffHours < 1.5) { // 1.5小时内的支付信息认为有效
        return {
          code: 0,
          message: '获取支付参数成功',
          data: {
            prepayId: order.paymentInfo.prepayId,
            appId: order.paymentInfo.appId,
            timeStamp: order.paymentInfo.timeStamp,
            nonceStr: order.paymentInfo.nonceStr,
            package: order.paymentInfo.package,
            signType: order.paymentInfo.signType,
            paySign: order.paymentInfo.paySign
          }
        }
      } else {
        console.log('支付信息已过期，重新调用微信支付')
      }
    }

    // 生成商户订单号（如果重复会自动添加时间戳）
    let outTradeNo = order.orderNo
    let paymentResult
    
    // 最多重试3次
    for (let retry = 0; retry < 3; retry++) {
      if (retry > 0) {
        // 重试时添加时间戳避免订单号重复
        outTradeNo = `${order.orderNo}_${Date.now()}`
        console.log(`第${retry}次重试，使用新订单号:`, outTradeNo)
      }
      
      // 调用微信支付统一下单接口
      paymentResult = await cloud.cloudPay.unifiedOrder({
        body: description || `学长二手书-订单${order.orderNo}`,
        outTradeNo: outTradeNo,
        spbillCreateIp: '127.0.0.1',
        subMchId: '1716913038', // 你的商户号
        totalFee: Math.round(totalFee * 100), // 转换为分
        envId: 'cloud1-8gbfcrr39555713f', // 云开发环境ID
        functionName: 'payment', // 支付回调云函数名
      })

      console.log('微信支付统一下单结果:', paymentResult)

      // 如果成功或者不是订单号重复错误，跳出重试循环
      if (paymentResult.returnCode === 'SUCCESS' && paymentResult.resultCode === 'SUCCESS') {
        break
      } else if (paymentResult.resultCode === 'FAIL' && 
                 paymentResult.errCodeDes && 
                 paymentResult.errCodeDes.includes('商户订单号重复')) {
        console.log('商户订单号重复，准备重试...')
        continue
      } else {
        // 其他错误，直接跳出
        break
      }
    }

    if (paymentResult.returnCode === 'SUCCESS' && paymentResult.resultCode === 'SUCCESS') {
      // 从payment对象中提取支付参数
      const paymentParams = paymentResult.payment || {}
      
      console.log('支付参数:', {
        appId: paymentParams.appId,
        timeStamp: paymentParams.timeStamp,
        nonceStr: paymentParams.nonceStr,
        package: paymentParams.package,
        signType: paymentParams.signType,
        paySign: paymentParams.paySign
      })

      // 更新订单支付信息
      await db.collection('orders').doc(orderId).update({
        data: {
          paymentInfo: {
            prepayId: paymentResult.prepayId,
            appId: paymentParams.appId,
            timeStamp: paymentParams.timeStamp,
            nonceStr: paymentParams.nonceStr,
            package: paymentParams.package,
            signType: paymentParams.signType,
            paySign: paymentParams.paySign
          },
          updateTime: new Date()
        }
      })

      return {
        code: 0,
        message: '统一下单成功',
        data: {
          prepayId: paymentResult.prepayId,
          appId: paymentParams.appId,
          timeStamp: paymentParams.timeStamp,
          nonceStr: paymentParams.nonceStr,
          package: paymentParams.package,
          signType: paymentParams.signType,
          paySign: paymentParams.paySign
        }
      }
    } else {
      console.error('微信支付统一下单失败:', paymentResult)
      return {
        code: -1,
        message: paymentResult.returnMsg || '统一下单失败'
      }
    }
  } catch (error) {
    console.error('统一下单异常:', error)
    return {
      code: -1,
      message: '统一下单失败: ' + error.message
    }
  }
}

// 支付结果通知处理
async function paymentNotify(event) {
  console.log('=== 支付结果通知开始 ===')
  console.log('支付通知事件完整内容:', JSON.stringify(event, null, 2))
  console.log('事件字段列表:', Object.keys(event))

  try {
    const { resultCode, outTradeNo, transactionId, totalFee } = event

    if (resultCode === 'SUCCESS') {
      // 支付成功，更新订单状态
      const orderResult = await db.collection('orders').where({
        orderNo: outTradeNo
      }).get()

      if (orderResult.data.length === 0) {
        console.error('订单不存在:', outTradeNo)
        return { code: -1, message: '订单不存在' }
      }

      const order = orderResult.data[0]
      
      // 验证金额
      const orderTotalFee = Math.round(order.totalPrice * 100)
      if (orderTotalFee !== totalFee) {
        console.error('金额不匹配:', { orderTotalFee, totalFee })
        return { code: -1, message: '金额不匹配' }
      }

      // 更新订单状态
      await db.collection('orders').doc(order._id).update({
        data: {
          status: 'paid',
          statusText: '待发货',
          payTime: new Date(),
          transactionId: transactionId,
          updateTime: new Date()
        }
      })

      // 扣减库存
      for (const item of order.items) {
        await db.collection('books').doc(item.bookId).update({
          data: {
            stock: db.command.inc(-item.quantity),
            sales: db.command.inc(item.quantity)
          }
        })
      }

      console.log('订单支付成功，状态已更新:', order._id)
      
      return { code: 0, message: '支付成功' }
    } else {
      console.log('支付失败或取消:', event)
      return { code: -1, message: '支付失败' }
    }
  } catch (error) {
    console.error('支付通知处理异常:', error)
    return { code: -1, message: '处理异常: ' + error.message }
  }
}

// 查询支付结果
async function queryOrder(event, contextOpenid) {
  const { orderId, openid } = event
  
  // 优先使用传递的 openid，如果没有则使用上下文中的 openid
  const currentOpenid = openid || contextOpenid
  
  if (!orderId) {
    return { code: -1, message: '订单ID不能为空' }
  }

  try {
    const orderResult = await db.collection('orders').doc(orderId).get()
    if (!orderResult.data) {
      return { code: -1, message: '订单不存在' }
    }

    const order = orderResult.data
    if (order.userId !== currentOpenid) {
      return { code: -1, message: '无权限查看此订单' }
    }

    // 如果订单已支付，直接返回状态
    if (order.status === 'paid') {
      return {
        code: 0,
        message: '订单已支付',
        data: {
          status: 'paid',
          transactionId: order.transactionId
        }
      }
    }

    // 如果订单还是待支付状态，查询微信支付状态
    if (order.status === 'pending' && order.orderNo) {
      try {
        const queryResult = await cloud.cloudPay.queryOrder({
          outTradeNo: order.orderNo,
          subMchId: '1716913038' // 添加商户号参数
        })

        console.log('微信支付查询结果:', queryResult)

        if (queryResult.returnCode === 'SUCCESS' && queryResult.resultCode === 'SUCCESS') {
          if (queryResult.tradeState === 'SUCCESS') {
            // 支付成功，更新订单状态
            await db.collection('orders').doc(orderId).update({
              data: {
                status: 'paid',
                statusText: '待发货',
                payTime: new Date(),
                transactionId: queryResult.transactionId,
                updateTime: new Date()
              }
            })

            // 扣减库存
            for (const item of order.items) {
              await db.collection('books').doc(item.bookId).update({
                data: {
                  stock: db.command.inc(-item.quantity),
                  sales: db.command.inc(item.quantity)
                }
              })
            }

            return {
              code: 0,
              message: '支付成功',
              data: {
                status: 'paid',
                transactionId: queryResult.transactionId
              }
            }
          } else {
            return {
              code: 1,
              message: '支付中',
              data: {
                status: 'pending',
                tradeState: queryResult.tradeState
              }
            }
          }
        }
      } catch (queryError) {
        console.error('查询支付状态失败:', queryError)
      }
    }

    return {
      code: 1,
      message: '待支付',
      data: {
        status: order.status
      }
    }
  } catch (error) {
    console.error('查询订单异常:', error)
    return {
      code: -1,
      message: '查询失败: ' + error.message
    }
  }
} 