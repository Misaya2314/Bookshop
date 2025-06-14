interface BookItem {
  _id: string;
  title: string;
  author: string;
  price: number;
  icon: string;
  sales: number;
  rating?: number;
}

Page({
  data: {
    searchValue: '',
    searched: false,
    loading: false,
    books: [] as BookItem[],
    total: 0,
    page: 1,
    hasMore: true,
    searchHistory: [] as string[],
    hotKeywords: [
      'Java', 'Python', '算法', '数据结构', 
      '机器学习', '人工智能', '数据库', '网络编程'
    ]
  },

  onLoad(options: any) {
    const keyword = options.keyword
    if (keyword) {
      this.setData({ searchValue: keyword })
      this.performSearch(keyword)
    }
    this.loadSearchHistory()
  },

  onShow() {
    // 每次显示页面时刷新搜索历史
    this.loadSearchHistory()
  },

  // 加载搜索历史
  loadSearchHistory() {
    try {
      const history = wx.getStorageSync('searchHistory') || []
      this.setData({ searchHistory: history.slice(0, 10) }) // 最多显示10条
    } catch (error) {
      console.error('加载搜索历史失败:', error)
    }
  },

  // 保存搜索历史
  saveSearchHistory(keyword: string) {
    try {
      let history = wx.getStorageSync('searchHistory') || []
      // 移除重复项
      history = history.filter((item: string) => item !== keyword)
      // 添加到开头
      history.unshift(keyword)
      // 最多保存20条
      history = history.slice(0, 20)
      wx.setStorageSync('searchHistory', history)
      this.setData({ searchHistory: history.slice(0, 10) })
    } catch (error) {
      console.error('保存搜索历史失败:', error)
    }
  },

  // 清除搜索历史
  clearHistory() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('searchHistory')
          this.setData({ searchHistory: [] })
          wx.showToast({
            title: '已清除',
            icon: 'success'
          })
        }
      }
    })
  },

  // 搜索提交
  onSearch(e: any) {
    const keyword = e.detail.value.trim()
    if (keyword) {
      this.performSearch(keyword)
    }
  },

  // 清除搜索
  onClear() {
    this.setData({ 
      searchValue: '',
      searched: false,
      books: [],
      total: 0
    })
  },

  // 点击关键词搜索
  searchKeyword(e: any) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ searchValue: keyword })
    this.performSearch(keyword)
  },

  // 执行搜索
  async performSearch(keyword: string, loadMore = false) {
    if (!keyword.trim()) return

    // 如果是新搜索，重置状态
    if (!loadMore) {
      this.setData({
        loading: true,
        searched: true,
        books: [],
        page: 1,
        hasMore: true,
        total: 0
      })
    }

    try {
      const result = await wx.cloud.callFunction({
        name: 'books',
        data: {
          action: 'searchBooks',
          keyword: keyword,
          page: this.data.page,
          pageSize: 20
        }
      })

      const response = result.result as any
      if (response.code === 0) {
        const newBooks = response.data.books
        const currentBooks = loadMore ? this.data.books : []
        
        this.setData({
          books: [...currentBooks, ...newBooks],
          hasMore: response.data.hasMore,
          page: this.data.page + 1,
          total: loadMore ? this.data.total : newBooks.length
        })

        // 保存搜索历史（只在新搜索时保存）
        if (!loadMore) {
          this.saveSearchHistory(keyword)
        }
      } else {
        wx.showToast({
          title: response.message || '搜索失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('搜索失败:', error)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载更多
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.performSearch(this.data.searchValue, true)
  },

  // 跳转到商品详情
  goToDetail(e: any) {
    const bookId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product-detail/product-detail?id=${bookId}`
    })
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadMore()
  },

  // 下拉刷新
  onPullDownRefresh() {
    if (this.data.searchValue) {
      this.performSearch(this.data.searchValue).finally(() => {
        wx.stopPullDownRefresh()
      })
    } else {
      wx.stopPullDownRefresh()
    }
  }
}) 