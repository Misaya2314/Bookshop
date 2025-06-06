import { checkLoginStatus, getCurrentUser, logout } from '../../utils/auth'

Page({
  data: {
    isLoggedIn: false,
    userInfo: {
      name: '张同学',
      college: '计算机学院',
      grade: '大三',
      phone: '138****5678',
      isMerchant: false
    },
    orderStats: [
      { type: 'pending', label: '待支付', icon: 'time', color: '#f59e0b', count: 1 },
      { type: 'shipping', label: '待发货', icon: 'order', color: '#3b82f6', count: 2 },
      { type: 'receiving', label: '待收货', icon: 'delivery', color: '#10b981', count: 1 },
      { type: 'completed', label: '已完成', icon: 'check-circle', color: '#6b7280', count: 0 },
      { type: 'review', label: '待评价', icon: 'star', color: '#6b7280', count: 0 }
    ],
    tradeMenus: [
      { id: 1, title: '我的收藏', icon: 'heart', action: 'favorites' },
      { id: 2, title: '浏览历史', icon: 'history', action: 'history' },
      { id: 3, title: '客服中心', icon: 'service', action: 'service' },
      { id: 4, title: '收货地址', icon: 'location', action: 'address' }
    ],
    settingMenus: [
      { id: 1, title: '个人信息', icon: 'user', action: 'userInfo' },
      { id: 2, title: '我的评价', icon: 'star', action: 'reviews' },
      { id: 3, title: '设置', icon: 'setting', action: 'settings' }
    ],
    helpMenus: [
      { id: 1, title: '常见问题', icon: 'help', action: 'faq' },
      { id: 2, title: '意见反馈', icon: 'mail', action: 'feedback' },
      { id: 3, title: '关于我们', icon: 'info-circle', action: 'about' }
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
            isMerchant: userInfo.isMerchant || false
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

  loadOrderStats() {
    // 这里应该从服务器加载用户的订单统计数据
    // 目前使用模拟数据
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
      case 'history':
        this.goToHistory()
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
      case 'reviews':
        this.goToReviews()
        break
      case 'settings':
        this.goToSettings()
        break
      case 'faq':
        this.goToFAQ()
        break
      case 'feedback':
        this.goToFeedback()
        break
      case 'about':
        this.goToAbout()
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

  goToHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
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

  goToReviews() {
    wx.navigateTo({
      url: '/pages/my-reviews/my-reviews'
    })
  },

  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  goToFAQ() {
    wx.navigateTo({
      url: '/pages/faq/faq'
    })
  },

  goToFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    })
  },

  goToAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  onShareAppMessage() {
    return {
      title: '学长二手书 - 校园专业图书交易平台',
      path: '/pages/home/home'
    }
  }
}) 