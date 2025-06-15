Page({
  data: {
    selectedCategory: 1,
    selectedSubCategory: 'all',
    loading: false,
    categories: [
      { id: 1, name: '计算机', icon: '💻' },
      { id: 2, name: '医学', icon: '⚕️' },
      { id: 3, name: '管理学', icon: '💼' },
      { id: 4, name: '英语', icon: '🇬🇧' },
      { id: 5, name: '法律', icon: '🏛️' },
      { id: 6, name: '理工', icon: '🔬' },
      { id: 7, name: '艺术', icon: '🎨' }
    ],
    subCategories: [
      { id: 'all', name: '全部' },
      { id: 'textbook', name: '教材' },
      { id: 'reference', name: '参考书' },
      { id: 'exam', name: '考研资料' }
    ],
    books: [],
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.loadBooks()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
  },

  selectCategory(e: any) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({
      selectedCategory: categoryId,
      selectedSubCategory: 'all'
    })
    this.loadBooks()
  },

  onSubCategoryChange(e: any) {
    this.setData({
      selectedSubCategory: e.detail.value
    })
    this.loadBooks()
  },

  async loadBooks(refresh = true) {
    const { selectedCategory, selectedSubCategory, page, books } = this.data
    
    if (refresh) {
      this.setData({ loading: true, page: 1, books: [], hasMore: true })
    }

    try {
      const result = await wx.cloud.callFunction({
        name: 'books',
        data: {
          action: 'getBooksByCategory',
          categoryId: selectedCategory,
          subCategoryId: selectedSubCategory,
          page: refresh ? 1 : page,
          pageSize: 20
        }
      })

      const response = result.result as any
      if (response.code === 0) {
        const newBooks = response.data.books
    this.setData({
          books: refresh ? newBooks : [...books, ...newBooks],
          hasMore: response.data.hasMore,
          page: refresh ? 2 : page + 1
        })
      } else {
        wx.showToast({
          title: response.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载图书失败:', error)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载更多图书
  async loadMoreBooks() {
    if (!this.data.hasMore || this.data.loading) return
    await this.loadBooks(false)
  },

  goToDetail(e: any) {
    const bookId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product-detail/product-detail?id=${bookId}`
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadBooks().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadMoreBooks()
  }
}) 