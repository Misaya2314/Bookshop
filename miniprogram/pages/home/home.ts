Page({
  data: {
    searchValue: '',
    loading: false,
    componentError: false,
    isLoggedIn: false, // 添加登录状态标识
    userInfo: null, // 用户信息
    banners: [
      {
        id: 1,
        title: '新学期优惠',
        subtitle: '专业商品 9折起',
        bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        image: 'cloud://cloud1-8gbfcrr39555713f.636c-cloud1-8gbfcrr39555713f-1355783267/book-covers/1749909745183_yptr84wow.jpg',
        link: '/pages/category/category'
      },
      {
        id: 2,
        title: '学习用品',
        subtitle: '助力学习路',
        bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        image: '',
        link: '/pages/category/category'
      },
      {
        id: 3,
        title: '计算机专区',
        subtitle: '程序员必备商品',
        bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        image: '',
        link: '/pages/category/category'
      }
    ],
    categories: [
      { id: 3, name: '计算机学院', icon: '💻', bgColor: '#dbeafe' },
      { id: 9, name: '药学学院', icon: '💊', bgColor: '#dcfce7' },
      { id: 7, name: '管理学院', icon: '💼', bgColor: '#fed7aa' },
      { id: 13, name: '知识产权', icon: '🏛️', bgColor: '#e9d5ff' },
      { id: 2, name: '经济金融', icon: '💰', bgColor: '#fef3c7' },
      { id: 11, name: '机械工程', icon: '⚙️', bgColor: '#f3e8ff' },
      { id: 6, name: '电气学院', icon: '⚡', bgColor: '#ecfdf5' },
      { id: 16, name: 'AI学院', icon: '🤖', bgColor: '#fef2f2' }
    ],
    hotBooks: []
  },

  onLoad() {
    console.log('首页加载完成')
    
    this.addErrorHandler()
    
    // 检查登录状态但不强制跳转
    this.checkLoginStatus()
    // 无论是否登录都加载基础数据
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
      // 只获取热门商品
      const hotBooksResult = await this.getHotBooks()

      if (hotBooksResult.code === 0) {
        this.setData({ hotBooks: hotBooksResult.data })
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

  // 获取热门商品
  async getHotBooks() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'books',
        data: {
          action: 'getHotBooks',
          limit: 5
        }
      })
      return result.result as any
    } catch (error) {
      console.error('获取热门商品失败:', error)
      return { code: -1, message: '获取失败' }
    }
  },



  // 检查登录状态（不强制跳转）
  async checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    
    if (!userInfo || !userInfo.openid) {
      // 用户未登录，更新状态但不跳转
      this.setData({ 
        isLoggedIn: false,
        userInfo: null 
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
        // 登录状态无效，清除本地存储并更新状态
        wx.removeStorageSync('userInfo')
        this.setData({ 
          isLoggedIn: false,
          userInfo: null 
        })
      } else {
        // 登录状态有效
        this.setData({ 
          isLoggedIn: true,
          userInfo: userInfo 
        })
      }
    } catch (error) {
      console.error('验证登录状态失败:', error)
      // 网络错误时假设已登录，让用户继续使用
      this.setData({ 
        isLoggedIn: !!userInfo,
        userInfo: userInfo 
      })
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
    const collegeId = e.currentTarget.dataset.id
    wx.switchTab({
      url: '/pages/category/category',
      success: () => {
        // 通过全局数据或者事件传递学院ID给分类页面
        if (collegeId) {
          setTimeout(() => {
            const pages = getCurrentPages()
            const categoryPage = pages[pages.length - 1]
            if (categoryPage.selectCollege) {
              categoryPage.selectCollege({ currentTarget: { dataset: { id: collegeId } } })
            }
          }, 100)
        }
      }
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
      title: '学长二手商品 - 校园专业商品交易平台',
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