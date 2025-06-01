Page({
  data: {
    currentTab: 'all',
    currentTabLabel: '全部',
    refreshing: false,
    tabs: [
      { label: '全部', value: 'all' },
      { label: '待付款', value: 'pending' },
      { label: '待发货', value: 'shipping' },
      { label: '待收货', value: 'receiving' },
      { label: '已完成', value: 'completed' },
      { label: '待评价', value: 'review' }
    ],
    allOrders: [
      {
        id: 'order001',
        merchantName: '李同学的店',
        status: 'pending',
        statusText: '待付款',
        statusClass: 'pending',
        createTime: '2024-01-20 14:30',
        totalQuantity: 2,
        totalPrice: '113.00',
        products: [
          {
            id: 'product001',
            title: 'Java核心技术 卷I',
            description: '9成新，几乎无笔记',
            price: 45,
            quantity: 1,
            icon: '📖'
          },
          {
            id: 'product002',
            title: '算法导论',
            description: '8成新，有少量笔记',
            price: 68,
            quantity: 1,
            icon: '📘'
          }
        ]
      },
      {
        id: 'order002',
        merchantName: '王同学的店',
        status: 'shipping',
        statusText: '待发货',
        statusClass: 'shipping',
        createTime: '2024-01-19 10:15',
        totalQuantity: 1,
        totalPrice: '32.00',
        products: [
          {
            id: 'product003',
            title: '医学统计学',
            description: '9成新，保存完好',
            price: 32,
            quantity: 1,
            icon: '📚'
          }
        ]
      },
      {
        id: 'order003',
        merchantName: '张同学的店',
        status: 'receiving',
        statusText: '待收货',
        statusClass: 'receiving',
        createTime: '2024-01-18 16:45',
        totalQuantity: 1,
        totalPrice: '38.00',
        products: [
          {
            id: 'product004',
            title: '设计模式',
            description: '8成新，有重点标记',
            price: 38,
            quantity: 1,
            icon: '📙'
          }
        ]
      },
      {
        id: 'order004',
        merchantName: '刘同学的店',
        status: 'completed',
        statusText: '已完成',
        statusClass: 'completed',
        createTime: '2024-01-15 09:20',
        totalQuantity: 2,
        totalPrice: '70.00',
        products: [
          {
            id: 'product005',
            title: '线性代数',
            description: '9成新，几乎全新',
            price: 25,
            quantity: 1,
            icon: '📗'
          },
          {
            id: 'product006',
            title: '高等数学',
            description: '8成新，有笔记',
            price: 45,
            quantity: 1,
            icon: '📕'
          }
        ]
      },
      {
        id: 'order005',
        merchantName: '陈同学的店',
        status: 'review',
        statusText: '待评价',
        statusClass: 'review',
        createTime: '2024-01-12 13:30',
        totalQuantity: 1,
        totalPrice: '52.00',
        products: [
          {
            id: 'product007',
            title: '深入理解计算机系统',
            description: '9成新，经典教材',
            price: 52,
            quantity: 1,
            icon: '📘'
          }
        ]
      }
    ],
    orders: [] as any[]
  },

  onLoad(options: any) {
    const type = options.type || 'all'
    this.setData({ currentTab: type })
    this.filterOrders(type)
  },

  onTabChange(e: any) {
    const tab = e.detail.value
    this.setData({ currentTab: tab })
    this.filterOrders(tab)
  },

  filterOrders(tab: string) {
    let orders = this.data.allOrders
    let tabLabel = '全部'

    if (tab !== 'all') {
      orders = orders.filter(order => order.status === tab)
    }

    const tabItem = this.data.tabs.find(item => item.value === tab)
    if (tabItem) {
      tabLabel = tabItem.label
    }

    this.setData({ 
      orders,
      currentTabLabel: tabLabel
    })
  },

  onRefresh() {
    this.setData({ refreshing: true })
    
    // 模拟刷新数据
    setTimeout(() => {
      this.setData({ refreshing: false })
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
    }, 1000)
  },

  goToOrderDetail(e: any) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    })
  },

  payOrder(e: any) {
    const orderId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认支付',
      content: '确定要支付此订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '支付中...' })
          // 模拟支付过程
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({
              title: '支付成功',
              icon: 'success'
            })
            this.updateOrderStatus(orderId, 'shipping', '待发货')
          }, 2000)
        }
      }
    })
  },

  cancelOrder(e: any) {
    const orderId = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消订单',
      content: '确定要取消此订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '订单已取消',
            icon: 'success'
          })
          this.removeOrder(orderId)
        }
      }
    })
  },

  contactSeller(e: any) {
    const orderId = e.currentTarget.dataset.id
    const order = this.data.allOrders.find(o => o.id === orderId)
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

  confirmReceive(e: any) {
    const orderId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认收货',
      content: '确认已收到商品吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '确认收货成功',
            icon: 'success'
          })
          this.updateOrderStatus(orderId, 'review', '待评价')
        }
      }
    })
  },

  viewLogistics(e: any) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/logistics/logistics?orderId=${orderId}`
    })
  },

  writeReview(e: any) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/write-review/write-review?orderId=${orderId}`
    })
  },

  buyAgain(e: any) {
    const orderId = e.currentTarget.dataset.id
    const order = this.data.allOrders.find(o => o.id === orderId)
    if (order && order.products.length > 0) {
      // 跳转到第一个商品的详情页
      wx.navigateTo({
        url: `/pages/product-detail/product-detail?id=${order.products[0].id}`
      })
    }
  },

  updateOrderStatus(orderId: string, status: string, statusText: string) {
    const allOrders = this.data.allOrders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status,
          statusText,
          statusClass: status
        }
      }
      return order
    })

    this.setData({ allOrders })
    this.filterOrders(this.data.currentTab)
  },

  removeOrder(orderId: string) {
    const allOrders = this.data.allOrders.filter(order => order.id !== orderId)
    this.setData({ allOrders })
    this.filterOrders(this.data.currentTab)
  },

  goShopping() {
    wx.switchTab({
      url: '/pages/home/home'
    })
  }
}) 