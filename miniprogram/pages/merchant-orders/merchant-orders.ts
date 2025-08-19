Page({
  data: {
    currentTab: 'all',
    currentTabLabel: '',
    loading: true,
    merchantId: '',
    orders: [] as any[],
    allOrders: [] as any[],
    tabs: [
      { label: '全部', value: 'all', count: 0, labelWithCount: '全部' },
      { label: '待发货', value: 'paid', count: 0, labelWithCount: '待发货' },
      { label: '已发货', value: 'shipping', count: 0, labelWithCount: '已发货' },
      { label: '已完成', value: 'completed', count: 0, labelWithCount: '已完成' },
      { label: '已取消', value: 'cancelled', count: 0, labelWithCount: '已取消' }
    ],
    refreshing: false
  },

  async onLoad(options: any) {
    // 获取商家ID
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ merchantId: userInfo._id })
    }

    // 处理状态筛选参数
    if (options.status) {
      const currentTabObj = this.data.tabs.find(t => t.value === options.status)
      const currentTabLabel = currentTabObj ? (options.status === 'all' ? '' : currentTabObj.label) : ''
      this.setData({ 
        currentTab: options.status,
        currentTabLabel: currentTabLabel
      })
    }

    await this.loadOrders()
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadOrders()
  },

  // 加载订单数据
  async loadOrders() {
    this.setData({ loading: true })
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'orders',
        data: {
          action: 'getMerchantOrders',
          merchantId: this.data.merchantId
        }
      })

      const response = result.result as any
      if (response.code === 0) {
        const orders = response.data.map((order: any) => ({
          ...order,
          createTime: this.formatTime(order.createTime),
          statusText: this.getStatusText(order.status),
          statusClass: `status-${order.status}`
        }))

        this.setData({
          allOrders: orders,
          orders: this.filterOrdersByStatus(orders, this.data.currentTab)
        })
        
        // 更新标签页数量统计
        this.updateTabCounts(orders)
      } else {
        wx.showToast({
          title: response.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载订单失败:', error)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false, refreshing: false })
    }
  },

  // 根据状态筛选订单
  filterOrdersByStatus(orders: any[], status: string) {
    if (status === 'all') {
      return orders
    }
    return orders.filter(order => order.status === status)
  },

  // 更新标签页数量统计
  updateTabCounts(orders: any[]) {
    const tabs = this.data.tabs.map(tab => {
      const count = tab.value === 'all' ? orders.length : orders.filter(order => order.status === tab.value).length
      return {
        ...tab,
        count: count,
        labelWithCount: count > 0 ? `${tab.label} (${count})` : tab.label
      }
    })
    
    this.setData({ tabs })
  },

  // 获取状态文字
  getStatusText(status: string) {
    const statusMap: { [key: string]: string } = {
      'pending': '待支付',
      'paid': '待发货',
      'shipping': '已发货',
      'completed': '已完成',
      'cancelled': '已取消'
    }
    return statusMap[status] || '未知状态'
  },

  // 格式化时间
  formatTime(timestamp: number) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return '今天 ' + date.toTimeString().slice(0, 5)
    } else if (days === 1) {
      return '昨天 ' + date.toTimeString().slice(0, 5)
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return `${date.getMonth() + 1}-${date.getDate()}`
    }
  },

  // 切换标签
  onTabChange(e: any) {
    const tab = e.detail.value
    const currentTabObj = this.data.tabs.find(t => t.value === tab)
    const currentTabLabel = currentTabObj ? (tab === 'all' ? '' : currentTabObj.label) : ''
    
    this.setData({ 
      currentTab: tab,
      currentTabLabel: currentTabLabel,
      orders: this.filterOrdersByStatus(this.data.allOrders, tab)
    })
  },

  // 发货操作
  async shipOrder(e: any) {
    const orderId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认发货',
      content: '确定要发货这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '发货中...' })
            
            const result = await wx.cloud.callFunction({
              name: 'orders',
              data: {
                action: 'merchantShipOrder',
                orderId: orderId
              }
            })

            const response = result.result as any
            if (response.code === 0) {
              wx.showToast({
                title: '发货成功',
                icon: 'success'
              })
              // 重新加载订单
              await this.loadOrders()
            } else {
              wx.showToast({
                title: response.message || '发货失败',
                icon: 'none'
              })
            }
          } catch (error) {
            console.error('发货失败:', error)
            wx.showToast({
              title: '网络错误',
              icon: 'none'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  // 联系买家
  contactBuyer(e: any) {
    const orderId = e.currentTarget.dataset.id
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 查看订单详情
  viewOrderDetail(e: any) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    })
  },

  // 下拉刷新
  onRefresh() {
    this.setData({ refreshing: true })
    this.loadOrders()
  },

  // 返回商家后台
  goBack() {
    wx.navigateBack()
  }
})
