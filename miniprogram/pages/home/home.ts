Page({
  data: {
    searchValue: '',
    loading: false,
    componentError: false,
    banners: [
      {
        id: 1,
        title: '新学期优惠',
        subtitle: '专业教材 9折起',
        bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        image: 'cloud://cloud1-8gbfcrr39555713f.636c-cloud1-8gbfcrr39555713f-1355783267/book-covers/1749909745183_yptr84wow.jpg', // 云存储图片ID，如：cloud://xxx/banners/banner1.jpg
        link: '/pages/category/category?id=1'
      },
      {
        id: 2,
        title: '考研资料',
        subtitle: '助力考研路',
        bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        image: '', // 云存储图片ID
        link: '/pages/category/category?id=exam'
      },
      {
        id: 3,
        title: '计算机专区',
        subtitle: '程序员必备书籍',
        bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        image: '', // 云存储图片ID
        link: '/pages/category/category?id=computer'
      }
    ],
    categories: [
      { id: 1, name: '计算机', icon: '💻', bgColor: '#dbeafe' },
      { id: 2, name: '医学', icon: '⚕️', bgColor: '#dcfce7' },
      { id: 3, name: '管理学', icon: '💼', bgColor: '#fed7aa' },
      { id: 4, name: '法律', icon: '🏛️', bgColor: '#e9d5ff' }
    ],
    hotBooks: [],
    recommendBooks: []
  },

  onLoad() {
    console.log('首页加载完成')
    
    this.addErrorHandler()
    
    this.checkLoginStatus()
    this.loadHomeData()
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

  // 加载首页数据
  async loadHomeData() {
    this.setData({ loading: true })
    
    try {
      // 并行获取热门图书和推荐图书
      const [hotBooksResult, recommendBooksResult] = await Promise.all([
        this.getHotBooks(),
        this.getRecommendBooks()
      ])

      if (hotBooksResult.code === 0) {
        this.setData({ hotBooks: hotBooksResult.data })
      }

      if (recommendBooksResult.code === 0) {
        this.setData({ recommendBooks: recommendBooksResult.data })
      }
    } catch (error) {
      console.error('加载首页数据失败:', error)
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 获取热门图书
  async getHotBooks() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'books',
        data: {
          action: 'getHotBooks',
          limit: 6
        }
      })
      return result.result as any
    } catch (error) {
      console.error('获取热门图书失败:', error)
      return { code: -1, message: '获取失败' }
    }
  },

  // 获取推荐图书
  async getRecommendBooks() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'books',
        data: {
          action: 'getRecommendBooks',
          limit: 10
        }
      })
      return result.result as any
    } catch (error) {
      console.error('获取推荐图书失败:', error)
      return { code: -1, message: '获取失败' }
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
    const value = e.detail.value.trim()
    if (value) {
      wx.navigateTo({
        url: `/pages/search/search?keyword=${encodeURIComponent(value)}`
      })
    }
  },

  onSearchFocus() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  // 轮播图点击事件
  onBannerTap(e: any) {
    const link = e.currentTarget.dataset.link
    if (link) {
      wx.navigateTo({
        url: link,
        fail: (error) => {
          console.error('页面跳转失败:', error)
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          })
        }
      })
    }
  },

  // 轮播图变化事件
  onSwiperChange(e: any) {
    console.log('轮播图切换到:', e.detail.current)
  },

  // 轮播图动画结束事件
  onSwiperAnimationFinish(e: any) {
    console.log('轮播图动画结束:', e.detail.current)
  },

  // 轮播图图片加载成功
  onBannerImageLoad(e: any) {
    console.log('轮播图图片加载成功')
  },

  // 轮播图图片加载失败
  onBannerImageError(e: any) {
    console.error('轮播图图片加载失败:', e.detail)
    wx.showToast({
      title: '图片加载失败',
      icon: 'none',
      duration: 2000
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

  // 下拉刷新
  onPullDownRefresh() {
    this.loadHomeData().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  onShareAppMessage() {
    return {
      title: '学长二手书 - 校园专业图书交易平台',
      path: '/pages/home/home'
    }
  },

  // 添加错误处理
  addErrorHandler() {
    try {
      // 监听未捕获的Promise错误
      wx.onUnhandledRejection && wx.onUnhandledRejection((res) => {
        console.error('Unhandled promise rejection:', res)
        const reasonStr = typeof res.reason === 'string' ? res.reason : 
                         (res.reason && typeof res.reason === 'object' && (res.reason as any).message) ? 
                         (res.reason as any).message : String(res.reason)
        
        if (reasonStr && reasonStr.includes('$$')) {
          this.setData({ componentError: true })
          console.log('检测到TDesign组件错误，启用降级模式')
        }
      })

      // 监听JS错误
      wx.onError && wx.onError((error) => {
        console.error('JavaScript error:', error)
        if (error.includes('$$') || error.includes('tdesign')) {
          this.setData({ componentError: true })
          console.log('检测到TDesign相关错误，启用降级模式')
        }
      })
    } catch (e) {
      console.error('Error handler setup failed:', e)
    }
  }
}) 