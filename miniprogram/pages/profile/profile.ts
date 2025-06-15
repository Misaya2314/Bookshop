import { checkLoginStatus, getCurrentUser, logout } from '../../utils/auth'

Page({
  data: {
    isLoggedIn: false,
    userInfo: {
      name: '张同学',
      college: '计算机学院',
      grade: '大三',
      phone: '138****5678',
      isMerchant: false,
      avatarUrl: ''
    },
    orderStats: [
      { type: 'pending', label: '待支付', icon: 'time', color: '#f59e0b', count: 0 },
      { type: 'paid', label: '待发货', icon: 'shop', color: '#3b82f6', count: 0 },
      { type: 'shipping', label: '待收货', icon: 'chevron-right', color: '#10b981', count: 0 },
      { type: 'completed', label: '已完成', icon: 'check-circle', color: '#6b7280', count: 0 }
    ],
    tradeMenus: [
      { id: 1, title: '我的收藏', icon: 'heart', action: 'favorites' },
      { id: 2, title: '客服中心', icon: 'chat', action: 'service' },
      { id: 3, title: '收货地址', icon: 'location', action: 'address' }
    ],
    settingMenus: [
      { id: 1, title: '个人信息', icon: 'user', action: 'userInfo' },
      { id: 2, title: '设置', icon: 'setting', action: 'settings' }
    ]
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
      })
    }
    this.loadUserInfo()
    this.loadOrderStats()
  },

  loadUserInfo() {
    const isLoggedIn = checkLoginStatus()
    this.setData({ isLoggedIn })
    
    if (isLoggedIn) {
      const userInfo = getCurrentUser()
    if (userInfo) {
        this.setData({ 
          userInfo: {
            name: userInfo.nickName || userInfo.name || '未设置',
            college: userInfo.college || '未设置',
            grade: userInfo.grade || '未设置',
            phone: userInfo.phone || '未设置',
            isMerchant: userInfo.isMerchant || false,
            avatarUrl: userInfo.avatarUrl || ''
          }
        })
    }
    }
  },

  // 前往登录页面
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
        }
      }
    })
  },

  async loadOrderStats() {
    if (!checkLoginStatus()) {
      return
    }

    try {
      // 获取所有订单数据
      const result = await wx.cloud.callFunction({
        name: 'orders',
        data: {
          action: 'getOrders',
          status: 'all'
        }
      })

      const response = result.result as any
      
      if (response.code === 0) {
        const orders = response.data || []
        
        // 统计各状态订单数量
        const stats = {
          pending: 0,    // 待支付
          paid: 0,       // 待发货
          shipping: 0,   // 待收货
          completed: 0   // 已完成
        }

        orders.forEach((order: any) => {
          if (stats.hasOwnProperty(order.status)) {
            stats[order.status as keyof typeof stats]++
          }
        })

        // 更新订单统计数据
        const updatedOrderStats = this.data.orderStats.map(item => ({
          ...item,
          count: stats[item.type as keyof typeof stats] || 0
        }))

        this.setData({
          orderStats: updatedOrderStats
        })
      }
    } catch (error) {
      console.error('加载订单统计失败:', error)
      // 静默失败，不影响用户体验
    }
  },

  goToOrders(e?: any) {
    const type = e?.currentTarget?.dataset?.type || 'all'
    wx.navigateTo({
      url: `/pages/orders/orders?type=${type}`
    })
  },

  goToMerchantApply() {
    wx.navigateTo({
      url: '/pages/merchant-apply/merchant-apply'
    })
  },

  goToMerchantDashboard() {
    wx.navigateTo({
      url: '/pages/merchant-dashboard/merchant-dashboard'
    })
  },

  onMenuClick(e: any) {
    const action = e.currentTarget.dataset.action
    switch (action) {
      case 'favorites':
        this.goToFavorites()
        break
      case 'service':
        this.contactService()
        break
      case 'address':
        this.goToAddress()
        break
      case 'userInfo':
        this.editUserInfo()
        break
      case 'settings':
        this.goToSettings()
        break
      default:
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        })
    }
  },

  goToFavorites() {
    wx.navigateTo({
      url: '/pages/favorites/favorites'
    })
  },

  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '请添加客服微信：bookshop_service',
      showCancel: false
    })
  },

  goToAddress() {
    wx.navigateTo({
      url: '/pages/address/address'
    })
  },

  editUserInfo() {
    wx.navigateTo({
      url: '/pages/user-info/user-info'
    })
  },

  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  onShareAppMessage() {
    return {
      title: '学长二手书 - 校园专业图书交易平台',
      path: '/pages/home/home'
    }
  }
}) 