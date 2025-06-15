const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-8gbfcrr39555713f'
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('订单超时检查任务开始执行')
  
  try {
    const now = new Date()
    
    // 查找已过期但仍为待支付状态的订单
    const expiredOrders = await db.collection('orders')
      .where({
        status: 'pending',
        expireTime: db.command.lt(now)
      })
      .get()
    
    console.log(`找到 ${expiredOrders.data.length} 个过期订单`)
    
    // 批量更新过期订单状态
    const updatePromises = expiredOrders.data.map(order => {
      console.log(`取消过期订单: ${order._id}`)
      return db.collection('orders').doc(order._id).update({
        data: {
          status: 'cancelled',
          statusText: '已取消（超时）',
          updateTime: now
        }
      })
    })
    
    await Promise.all(updatePromises)
    
    console.log(`成功取消 ${expiredOrders.data.length} 个过期订单`)
    
    return {
      code: 0,
      message: `成功处理 ${expiredOrders.data.length} 个超时订单`,
      data: {
        processedCount: expiredOrders.data.length,
        processedOrders: expiredOrders.data.map(order => ({
          orderId: order._id,
          orderNo: order.orderNo,
          expireTime: order.expireTime
        }))
      }
    }
  } catch (error) {
    console.error('订单超时处理失败:', error)
    return {
      code: -1,
      message: '订单超时处理失败: ' + error.message
    }
  }
} 