import { collegeData, getCollegeById, getMajorsByCollegeId } from '../../utils/college-data'

Page({
  data: {
    selectedCollege: 1, // 改为学院ID
    selectedMajor: 'all', // 改为专业ID
    loading: false,
    refreshing: false,
    colleges: collegeData, // 使用学院数据
    majors: getMajorsByCollegeId(1), // 当前学院的专业列表
    books: [],
    page: 1,
    hasMore: true,
    scrollIntoView: '' // 用于控制横向滚动
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

  selectCollege(e: any) {
    const collegeId = e.currentTarget.dataset.id
    const majors = getMajorsByCollegeId(collegeId)
    this.setData({
      selectedCollege: collegeId,
      selectedMajor: 'all',
      majors: majors,
      scrollIntoView: 'major-0' // 滚动到第一个专业（全部专业）
    })
    this.loadBooks()
  },

  selectMajor(e: any) {
    const majorId = e.currentTarget.dataset.id
    const majorIndex = e.currentTarget.dataset.index
    
    this.setData({
      selectedMajor: majorId,
      scrollIntoView: `major-${majorIndex}`
    })
    
    this.loadBooks()
  },

  async loadBooks(refresh = true) {
    const { selectedCollege, selectedMajor, page, books } = this.data
    
    if (refresh) {
      this.setData({ loading: true, page: 1, books: [], hasMore: true })
    }

    try {
      const result = await wx.cloud.callFunction({
        name: 'books',
        data: {
          action: 'getBooksByCollege',
          collegeId: selectedCollege,
          majorId: selectedMajor,
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
      console.error('加载商品失败:', error)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载更多商品
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
    this.setData({ refreshing: true })
    this.loadBooks().finally(() => {
      this.setData({ refreshing: false })
    })
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadMoreBooks()
  }
}) 