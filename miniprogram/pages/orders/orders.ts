import { formatFullTime } from '../../utils/util'

Page({
  data: {
    currentTab: 'all',
    currentTabLabel: '全部',
    refreshing: false,
    loading: true,
    tabs: [
      { label: '全部', value: 'all', count: 0, labelWithCount: '全部' },
      { label: '待付款', value: 'pending', count: 0, labelWithCount: '待付款' },
      { label: '待发货', value: 'paid', count: 0, labelWithCount: '待发货' },
      { label: '待收货', value: 'shipping', count: 0, labelWithCount: '待收货' },
      { label: '已完成', value: 'completed', count: 0, labelWithCount: '已完成' },
      { label: '已取消', value: 'cancelled', count: 0, labelWithCount: '已取消' }
    ],
    orders: [] as any[],
    countdownTimer: null as any,
    currentUserOpenid: '' // 添加当前用户openid跟踪
  },

  onLoad(options: any) {
    const type = options.type || 'all'
    this.setData({ currentTab: type })
    // 首先验证登录状态，然后加载订单
    this.checkLoginAndLoadOrders(type)
  },
  
  onShow() {
    // 每次显示页面时重新验证登录状态并加载订单数据
    this.checkLoginAndLoadOrders(this.data.currentTab)
    // 启动倒计时
    this.startCountdown()
  },

  onHide() {
    // 页面隐藏时清除倒计时
    this.clearCountdown()
  },

  onUnload() {
    // 页面卸载时清除倒计时
    this.clearCountdown()
  },

  // 检查登录状态并加载订单
  async checkLoginAndLoadOrders(status: string) {
    // 获取当前本地存储的用户信息
    const userInfo = wx.getStorageSync('userInfo')
    
    if (!userInfo || !userInfo.openid) {
      // 用户未登录，跳转到登录页
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    try {
      // 验证云端登录状态，确保openid一致
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {
          action: 'getUserInfo'
        }
      })

      const response = result.result as any
      
      if (response.code !== 0) {
        // 云端登录状态无效，清除本地存储并跳转登录页
        wx.removeStorageSync('userInfo')
        wx.redirectTo({
          url: '/pages/login/login'
        })
        return
      }

      const cloudUserInfo = response.data
      
      // 检查本地openid与云端是否一致
      if (userInfo.openid !== cloudUserInfo.openid) {
        console.log('用户身份不一致，清除本地数据并重新登录')
        wx.removeStorageSync('userInfo')
        wx.redirectTo({
          url: '/pages/login/login'
        })
        return
      }

      // 检查是否为新用户或用户切换
      if (this.data.currentUserOpenid && this.data.currentUserOpenid !== cloudUserInfo.openid) {
        console.log('检测到用户切换，清空订单数据')
        this.setData({ 
          orders: [],
          currentUserOpenid: cloudUserInfo.openid
        })
      } else {
        this.setData({ currentUserOpenid: cloudUserInfo.openid })
      }

      // 验证通过，加载订单数据
      this.loadOrders(status)
      
    } catch (error) {
      console.error('验证登录状态失败:', error)
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  onTabChange(e: any) {
    const tab = e.detail.value
    this.setData({ currentTab: tab })
    this.loadOrders(tab)
  },

  // 加载订单数据
  async loadOrders(status: string = 'all') {
    this.setData({ loading: true })

    try {
      // 获取当前用户信息用于验证
      const userInfo = wx.getStorageSync('userInfo')
      console.log('当前前端用户信息:', { 
        openid: userInfo?.openid, 
        nickname: userInfo?.nickName,
        currentUserOpenid: this.data.currentUserOpenid 
      })

      // 并行获取当前状态订单和所有订单（用于计数）
      const [currentResult, allResult] = await Promise.all([
        wx.cloud.callFunction({
          name: 'orders',
          data: {
            action: 'getOrders',
            status: status,
            page: 1,
            limit: 50
          }
        }),
        wx.cloud.callFunction({
          name: 'orders',
          data: {
            action: 'getOrders',
            status: 'all',
            page: 1,
            limit: 200
          }
        })
      ])

      const currentResponse = currentResult.result as any
      const allResponse = allResult.result as any
      
      console.log('获取订单结果:', currentResponse)
      console.log('所有订单结果:', allResponse)
      
      // 检查返回的订单数据中是否有不属于当前用户的订单
      if (currentResponse.code === 0 && currentResponse.data) {
        const currentUserOpenid = userInfo?.openid
        currentResponse.data.forEach((order: any, index: number) => {
          if (order.userId !== currentUserOpenid) {
            console.error(`前端发现数据异常: 订单 ${index} (${order.orderNo}) 的 userId (${order.userId}) 与当前用户 (${currentUserOpenid}) 不匹配`)
          }
        })
      }

      if (currentResponse.code === 0) {
        const currentUserOpenid = userInfo?.openid
        
        // 前端强制过滤：只保留属于当前用户的订单
        const userOrders = currentResponse.data.filter((order: any) => {
          const isMatch = order.userId === currentUserOpenid
          if (!isMatch) {
            console.error(`前端过滤: 移除不属于当前用户的订单 ${order.orderNo}`)
          }
          return isMatch
        })
        
        console.log(`前端过滤结果: 原始 ${currentResponse.data.length} 条，过滤后 ${userOrders.length} 条`)
        
        // 格式化订单数据，添加倒计时
        const orders = userOrders.map((order: any) => {
          const formattedOrder = {
            ...order,
            id: order._id, // 兼容现有模板
            createTime: formatFullTime(order.createTime), // 格式化创建时间
            products: order.items.map((item: any) => ({
              id: item.bookId,
              title: item.title,
              description: `¥${item.price} x${item.quantity}`,
              price: item.price,
              quantity: item.quantity,
              icon: item.icon || '📚'
            }))
          }
          
          // 为待支付订单添加倒计时
          if (order.status === 'pending' && order.expireTime) {
            formattedOrder.remainingTime = this.calculateRemainingTime(order.expireTime)
          }
          
          return formattedOrder
        })

        // 更新订单计数（使用所有订单数据，但需要过滤）
        if (allResponse.code === 0) {
          const allUserOrders = allResponse.data.filter((order: any) => {
            return order.userId === currentUserOpenid
          })
          console.log(`统计数据过滤: 原始 ${allResponse.data.length} 条，过滤后 ${allUserOrders.length} 条`)
          this.updateOrderCounts(allUserOrders)
        }

        // 获取标签名称
        const tabItem = this.data.tabs.find(item => item.value === status)
        const currentTabLabel = tabItem ? tabItem.label : '全部'

        this.setData({ 
          orders,
          currentTabLabel,
          loading: false
        })
      } else {
        console.error('获取订单失败:', currentResponse)
        this.setData({ 
          orders: [],
          loading: false
        })
        if (currentResponse.message !== '获取失败') {
          wx.showToast({
            title: currentResponse.message || '加载失败',
            icon: 'none'
          })
        }
      }
    } catch (error) {
      console.error('加载订单失败:', error)
      this.setData({ 
        orders: [],
        loading: false
      })
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    }
  },

  async onRefresh() {
    this.setData({ refreshing: true })
    
    try {
      await this.loadOrders(this.data.currentTab)
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('刷新失败:', error)
    } finally {
      this.setData({ refreshing: false })
    }
  },

  goToOrderDetail(e: any) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    })
  },

  // 检查支付状态
  async checkPaymentStatus(orderId: string) {
    console.log('检查支付状态:', orderId)
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'payment',
        data: {
          action: 'queryOrder',
          orderId: orderId
        }
      })

      const response = result.result as any
      console.log('支付状态查询结果:', response)
      
      if (response.code === 0) {
        console.log('支付状态确认成功:', response.data.status)
        return response.data
      } else if (response.code === 1) {
        console.log('支付状态查询:', response.message)
        return response.data
      } else {
        console.error('支付状态查询失败:', response.message)
        return null
      }
    } catch (error) {
      console.error('查询支付状态异常:', error)
      return null
    }
  },

  async payOrder(e: any) {
    const orderId = e.currentTarget.dataset.id
    console.log('前端支付订单ID:', orderId)
    console.log('订单ID类型:', typeof orderId)
    
    // 查找对应的订单数据
    const orderData = this.data.orders.find(order => order._id === orderId)
    console.log('找到的订单数据:', orderData)
    
    try {
      wx.showLoading({ title: '准备支付...' })
          
      // 调用支付云函数获取支付参数
            const result = await wx.cloud.callFunction({
              name: 'orders',
              data: {
                action: 'payOrder',
                orderId: orderId
              }
            })

            const response = result.result as any
      console.log('支付云函数返回:', response)
            
            if (response.code === 0) {
        wx.hideLoading()
        
        // 调用微信支付
        wx.requestPayment({
          timeStamp: response.data.timeStamp,
          nonceStr: response.data.nonceStr,
          package: response.data.package,
          signType: response.data.signType,
          paySign: response.data.paySign,
          success: (payRes) => {
            console.log('微信支付成功:', payRes)
              wx.showToast({
                title: '支付成功',
                icon: 'success'
              })
            // 支付成功后主动查询支付状态确保同步
            this.checkPaymentStatus(orderId).then(() => {
              // 重新加载订单数据
              this.loadOrders(this.data.currentTab)
            })
          },
          fail: (payErr) => {
            console.error('微信支付失败:', payErr)
            if (payErr.errMsg.includes('cancel')) {
              wx.showToast({
                title: '支付已取消',
                icon: 'none'
              })
            } else {
              wx.showToast({
                title: '支付失败，请重试',
                icon: 'none'
              })
            }
          }
        })
      } else {
        wx.hideLoading()
        wx.showToast({
          title: response.message || '支付准备失败',
                icon: 'none'
              })
            }
          } catch (error) {
      console.error('支付处理失败:', error)
      wx.hideLoading()
            wx.showToast({
              title: '网络错误，请重试',
              icon: 'none'
            })
      }
  },

  async cancelOrder(e: any) {
    const orderId = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消订单',
      content: '确定要取消此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '取消中...' })
          
          try {
            const result = await wx.cloud.callFunction({
              name: 'orders',
              data: {
                action: 'cancelOrder',
                orderId: orderId
              }
            })

            const response = result.result as any
            
            if (response.code === 0) {
              wx.showToast({
                title: '订单已取消',
                icon: 'success'
              })
              // 重新加载订单数据
              this.loadOrders(this.data.currentTab)
            } else {
              wx.showToast({
                title: response.message || '取消失败',
                icon: 'none'
              })
            }
          } catch (error) {
            console.error('取消订单失败:', error)
            wx.showToast({
              title: '网络错误，请重试',
              icon: 'none'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  contactSeller(e: any) {
    const orderId = e.currentTarget.dataset.id
    const order = this.data.orders.find(o => o.id === orderId)
    if (order) {
      wx.showModal({
        title: '联系卖家',
        content: `是否要联系卖家"${order.merchantName}"？`,
        success: (res) => {
          if (res.confirm) {
            wx.showToast({
              title: '正在连接卖家...',
              icon: 'loading'
            })
          }
        }
      })
    }
  },

  async confirmReceive(e: any) {
    const orderId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认收货',
      content: '确认已收到商品吗？确认后订单将完成。',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '确认中...' })
          
          try {
            const result = await wx.cloud.callFunction({
              name: 'orders',
              data: {
                action: 'updateOrderStatus',
                orderId: orderId,
                status: 'completed',
                statusText: '已完成'
              }
            })

            const response = result.result as any
            
            if (response.code === 0) {
              wx.showToast({
                title: '确认收货成功',
                icon: 'success'
              })
              // 重新加载订单数据
              this.loadOrders(this.data.currentTab)
            } else {
              wx.showToast({
                title: response.message || '确认失败',
                icon: 'none'
              })
            }
          } catch (error) {
            console.error('确认收货失败:', error)
            wx.showToast({
              title: '网络错误，请重试',
              icon: 'none'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  viewLogistics(e: any) {
    const orderId = e.currentTarget.dataset.id
    wx.showToast({
      title: '物流查询功能开发中',
      icon: 'none'
    })
  },

  writeReview(e: any) {
    const orderId = e.currentTarget.dataset.id
    wx.showToast({
      title: '评价功能开发中',
      icon: 'none'
    })
  },



  buyAgain(e: any) {
    const orderId = e.currentTarget.dataset.id
    const order = this.data.orders.find(o => o.id === orderId)
    if (order && order.products.length > 0) {
      // 跳转到第一个商品的详情页
      wx.navigateTo({
        url: `/pages/product-detail/product-detail?id=${order.products[0].id}`
      })
    }
  },



  goShopping() {
    wx.switchTab({
      url: '/pages/home/home'
    })
  },

  // 计算剩余时间
  calculateRemainingTime(expireTime: string | Date) {
    const now = new Date().getTime()
    const expire = new Date(expireTime).getTime()
    const remaining = expire - now
    
    if (remaining <= 0) {
      return '已过期'
    }
    
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
    
    if (hours > 0) {
      return `${hours}小时${minutes}分${seconds}秒`
    } else if (minutes > 0) {
      return `${minutes}分${seconds}秒`
    } else {
      return `${seconds}秒`
    }
  },

  // 更新订单计数
  updateOrderCounts(allOrders: any[]) {
    const counts = {
      all: allOrders.length,
      pending: 0,
      paid: 0,
      shipping: 0,
      completed: 0,
      cancelled: 0
    }
    
    allOrders.forEach((order: any) => {
      if (counts.hasOwnProperty(order.status)) {
        counts[order.status as keyof typeof counts]++
      }
    })
    
    const updatedTabs = this.data.tabs.map(tab => {
      const count = counts[tab.value as keyof typeof counts] || 0
      return {
        ...tab,
        count: count,
        labelWithCount: count > 0 ? `${tab.label} (${count})` : tab.label
      }
    })
    
    this.setData({ tabs: updatedTabs })
  },

  // 启动倒计时定时器
  startCountdown() {
    this.clearCountdown()
    
    this.data.countdownTimer = setInterval(() => {
      const orders = this.data.orders.map((order: any) => {
        if (order.status === 'pending' && order.expireTime) {
          const remainingTime = this.calculateRemainingTime(order.expireTime)
          
          // 如果订单已过期，自动取消
          if (remainingTime === '已过期') {
            this.autoExpireOrder(order._id)
            return {
              ...order,
              status: 'cancelled',
              statusText: '已取消（超时）',
              statusClass: 'cancelled',
              remainingTime: null
            }
          }
          
          return {
            ...order,
            remainingTime
          }
        }
        return order
      })
      
      this.setData({ orders })
    }, 1000)
  },

  // 清除倒计时定时器
  clearCountdown() {
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer)
      this.setData({ countdownTimer: null })
    }
  },

  // 自动过期订单
  async autoExpireOrder(orderId: string) {
    try {
      await wx.cloud.callFunction({
        name: 'orders',
        data: {
          action: 'cancelOrder',
          orderId: orderId
        }
      })
      console.log('订单自动过期取消:', orderId)
    } catch (error) {
      console.error('自动过期订单失败:', error)
    }
  },

  // 阻止事件冒泡
  onStopPropagation(e: any) {
    console.log('阻止事件冒泡')
    // 阻止事件冒泡到父元素
    e.stopPropagation && e.stopPropagation()
  },

  // 返回按钮
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({
        url: '/pages/profile/profile'
      })
    }
  }
}) 