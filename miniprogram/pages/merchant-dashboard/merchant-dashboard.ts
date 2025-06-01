Page({
  data: {
    currentTab: 'all',
    shopInfo: {
      name: '李同学的店',
      description: '专注计算机类图书，质量保证',
      status: 'active',
      statusText: '营业中'
    },
    stats: [
      { type: 'sales', label: '今日销售', value: '12', trend: 15 },
      { type: 'orders', label: '今日订单', value: '8', trend: -5 },
      { type: 'revenue', label: '今日收入', value: '456', trend: 12 },
      { type: 'views', label: '商品浏览', value: '89', trend: 8 }
    ],
    quickActions: [
      { id: 1, name: '添加商品', icon: 'add', action: 'addProduct', bgColor: '#3b82f6' },
      { id: 2, name: '订单管理', icon: 'order', action: 'orders', bgColor: '#10b981' },
      { id: 3, name: '营销工具', icon: 'discount', action: 'marketing', bgColor: '#f59e0b' },
      { id: 4, name: '数据分析', icon: 'chart', action: 'analytics', bgColor: '#8b5cf6' },
      { id: 5, name: '客服消息', icon: 'chat', action: 'messages', bgColor: '#ef4444' },
      { id: 6, name: '店铺装修', icon: 'edit', action: 'decoration', bgColor: '#06b6d4' }
    ],
    pendingTasks: [
      { 
        id: 1, 
        title: '待发货订单', 
        desc: '有新订单需要处理', 
        icon: 'order', 
        action: 'pendingShipment', 
        count: 3, 
        urgent: true 
      },
      { 
        id: 2, 
        title: '库存预警', 
        desc: '部分商品库存不足', 
        icon: 'error-circle', 
        action: 'lowStock', 
        count: 2, 
        urgent: false 
      },
      { 
        id: 3, 
        title: '客户咨询', 
        desc: '待回复的咨询消息', 
        icon: 'chat', 
        action: 'customerService', 
        count: 5, 
        urgent: false 
      }
    ],
    productTabs: [
      { label: '全部', value: 'all', count: 0 },
      { label: '在售', value: 'active', count: 12 },
      { label: '下架', value: 'inactive', count: 3 },
      { label: '售罄', value: 'sold_out', count: 1 }
    ],
    allProducts: [
      {
        id: 1,
        title: 'Java核心技术 卷I',
        price: 45,
        sales: 156,
        stock: 5,
        status: 'active',
        icon: '📖'
      },
      {
        id: 2,
        title: '算法导论',
        price: 68,
        sales: 89,
        stock: 3,
        status: 'active',
        icon: '📘'
      },
      {
        id: 3,
        title: '深入理解计算机系统',
        price: 52,
        sales: 76,
        stock: 2,
        status: 'active',
        icon: '📗'
      },
      {
        id: 4,
        title: '设计模式',
        price: 38,
        sales: 95,
        stock: 0,
        status: 'sold_out',
        icon: '📙'
      },
      {
        id: 5,
        title: '计算机网络',
        price: 35,
        sales: 45,
        stock: 8,
        status: 'inactive',
        icon: '📕'
      }
    ],
    products: [] as any[],
    recentOrders: [
      {
        id: 'order001',
        orderNumber: '2024012012001',
        createTime: '2024-01-20 14:30',
        productNames: 'Java核心技术 卷I, 算法导论',
        totalAmount: '113.00',
        statusText: '待发货',
        statusClass: 'shipping'
      },
      {
        id: 'order002',
        orderNumber: '2024012011001',
        createTime: '2024-01-20 11:15',
        productNames: '深入理解计算机系统',
        totalAmount: '52.00',
        statusText: '已完成',
        statusClass: 'completed'
      },
      {
        id: 'order003',
        orderNumber: '2024011920001',
        createTime: '2024-01-19 20:45',
        productNames: '设计模式',
        totalAmount: '38.00',
        statusText: '待发货',
        statusClass: 'shipping'
      }
    ]
  },

  onLoad() {
    this.filterProducts('all')
  },

  // 切换商品标签
  switchTab(e: any) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    this.filterProducts(tab)
  },

  // 筛选商品
  filterProducts(tab: string) {
    let products = this.data.allProducts
    
    if (tab !== 'all') {
      products = products.filter(product => product.status === tab)
    }

    this.setData({ products })
  },

  // 编辑店铺信息
  editShopInfo() {
    wx.navigateTo({
      url: '/pages/shop-edit/shop-edit'
    })
  },

  // 查看统计详情
  viewStatDetail(e: any) {
    const type = e.currentTarget.dataset.type
    wx.navigateTo({
      url: `/pages/stat-detail/stat-detail?type=${type}`
    })
  },

  // 快捷操作处理
  handleQuickAction(e: any) {
    const action = e.currentTarget.dataset.action
    switch (action) {
      case 'addProduct':
        this.addProduct()
        break
      case 'orders':
        this.goToOrderManagement()
        break
      case 'marketing':
        wx.navigateTo({
          url: '/pages/marketing/marketing'
        })
        break
      case 'analytics':
        wx.navigateTo({
          url: '/pages/analytics/analytics'
        })
        break
      case 'messages':
        wx.navigateTo({
          url: '/pages/customer-service/customer-service'
        })
        break
      case 'decoration':
        wx.navigateTo({
          url: '/pages/shop-decoration/shop-decoration'
        })
        break
      default:
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        })
    }
  },

  // 处理待办事项
  handleTask(e: any) {
    const action = e.currentTarget.dataset.action
    switch (action) {
      case 'pendingShipment':
        wx.navigateTo({
          url: '/pages/order-management/order-management?status=shipping'
        })
        break
      case 'lowStock':
        wx.navigateTo({
          url: '/pages/inventory/inventory'
        })
        break
      case 'customerService':
        wx.navigateTo({
          url: '/pages/customer-service/customer-service'
        })
        break
      default:
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        })
    }
  },

  // 添加商品
  addProduct() {
    wx.navigateTo({
      url: '/pages/product-add/product-add'
    })
  },

  // 编辑商品
  editProduct(e: any) {
    const productId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product-edit/product-edit?id=${productId}`
    })
  },

  // 切换商品状态
  toggleProductStatus(e: any) {
    const productId = e.currentTarget.dataset.id
    const product = this.data.allProducts.find(p => p.id === productId)
    
    if (!product) return

    const newStatus = product.status === 'active' ? 'inactive' : 'active'
    const statusText = newStatus === 'active' ? '上架' : '下架'

    wx.showModal({
      title: `确认${statusText}`,
      content: `确定要${statusText}商品"${product.title}"吗？`,
      success: (res) => {
        if (res.confirm) {
          // 更新商品状态
          const allProducts = this.data.allProducts.map(p => {
            if (p.id === productId) {
              return { ...p, status: newStatus }
            }
            return p
          })

          this.setData({ allProducts })
          this.filterProducts(this.data.currentTab)

          wx.showToast({
            title: `${statusText}成功`,
            icon: 'success'
          })
        }
      }
    })
  },

  // 订单管理
  goToOrderManagement() {
    wx.navigateTo({
      url: '/pages/order-management/order-management'
    })
  },

  // 查看订单详情
  viewOrderDetail(e: any) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    })
  },

  // 前往设置
  goToSettings() {
    wx.navigateTo({
      url: '/pages/merchant-settings/merchant-settings'
    })
  }
}) 