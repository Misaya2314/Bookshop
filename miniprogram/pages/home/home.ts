Page({
  data: {
    searchValue: '',
    banners: [
      {
        id: 1,
        title: '新学期优惠',
        subtitle: '专业教材 9折起',
        bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      {
        id: 2,
        title: '考研资料',
        subtitle: '助力考研路',
        bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      },
      {
        id: 3,
        title: '计算机专区',
        subtitle: '程序员必备书籍',
        bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
      }
    ],
    categories: [
      { id: 1, name: '计算机', icon: '💻', bgColor: '#dbeafe' },
      { id: 2, name: '医学', icon: '⚕️', bgColor: '#dcfce7' },
      { id: 3, name: '管理学', icon: '💼', bgColor: '#fed7aa' },
      { id: 4, name: '法律', icon: '🏛️', bgColor: '#e9d5ff' }
    ],
    hotBooks: [
      {
        id: 1,
        title: 'Java核心技术 卷I',
        author: '凯·S·霍斯特曼 著',
        price: 45,
        rating: '4.8',
        sales: '156',
        icon: '📖'
      },
      {
        id: 2,
        title: '医学统计学',
        author: '李康 主编',
        price: 32,
        rating: '4.6',
        sales: '89',
        icon: '📚'
      },
      {
        id: 3,
        title: '管理学原理',
        author: '周三多 主编',
        price: 28,
        rating: '4.7',
        sales: '124',
        icon: '📊'
      }
    ],
    recommendBooks: [
      {
        id: 4,
        title: '线性代数',
        author: '同济大学',
        price: 25,
        icon: '📘'
      },
      {
        id: 5,
        title: '高等数学',
        author: '同济大学',
        price: 35,
        icon: '📗'
      }
    ]
  },

  onLoad() {
    console.log('首页加载完成')
    this.checkLoginStatus()
  },

  onShow() {
    // 每次显示页面时也检查登录状态
    this.checkLoginStatus()
    
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
  },

  // 检查登录状态
  async checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    
    if (!userInfo || !userInfo.openid) {
      // 用户未登录，跳转到登录页
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    try {
      // 验证云端登录状态
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {
          action: 'getUserInfo'
        }
      })

      if ((result.result as any)?.code !== 0) {
        // 登录状态无效，清除本地存储并跳转登录页
        wx.removeStorageSync('userInfo')
        wx.redirectTo({
          url: '/pages/login/login'
        })
      }
    } catch (error) {
      console.error('验证登录状态失败:', error)
      // 网络错误时暂时不跳转，允许用户继续使用
    }
  },

  onSearch(e: any) {
    const value = e.detail.value
    if (value.trim()) {
      wx.navigateTo({
        url: `/pages/search/search?keyword=${value}`
      })
    }
  },

  onSearchFocus() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  goToCategory(e: any) {
    const categoryId = e.currentTarget.dataset.id
    wx.switchTab({
      url: '/pages/category/category'
    })
  },

  goToDetail(e: any) {
    const bookId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product-detail/product-detail?id=${bookId}`
    })
  },

  onShareAppMessage() {
    return {
      title: '学长二手书 - 校园专业图书交易平台',
      path: '/pages/home/home'
    }
  }
}) 