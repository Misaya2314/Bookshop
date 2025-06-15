import { checkLoginStatus } from '../../utils/auth'

interface FavoriteItem {
  _id: string
  bookId: string
  title: string
  author: string
  price: number
  originalPrice?: number
  images: string[]
  icon: string
  merchantId: string
  merchantName: string
  createTime: string
}

Page({
  data: {
    favorites: [] as FavoriteItem[],
    loading: true,
    loadingMore: false,
    hasMore: true,
    page: 1,
    pageSize: 20,
    hasLoaded: false
  },

  onLoad() {
    console.log('收藏页面 onLoad')
    this.checkLoginAndLoad()
  },

  onShow() {
    console.log('收藏页面 onShow, hasLoaded:', this.data.hasLoaded)
    // 只有在已经加载过数据后，再次显示页面时才刷新
    if (this.data.hasLoaded) {
      console.log('页面已加载过，刷新数据')
      this.refreshFavorites()
    }
  },

  // 检查登录状态并加载数据
  checkLoginAndLoad() {
    if (!checkLoginStatus()) {
      wx.showModal({
        title: '请先登录',
        content: '查看收藏需要先登录账号',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            })
          } else {
            wx.navigateBack()
          }
        }
      })
      return
    }
    
    this.loadFavorites()
  },

  // 刷新收藏列表
  refreshFavorites() {
    // 检查登录状态
    if (!checkLoginStatus()) {
      return
    }
    
    this.setData({
      favorites: [],
      page: 1,
      hasMore: true,
      loading: true
    })
    this.loadFavorites()
  },

  // 加载收藏列表
  async loadFavorites() {
    if (!this.data.hasMore && this.data.page > 1) return

    console.log('开始加载收藏列表, page:', this.data.page)

    try {
      this.setData({
        loading: this.data.page === 1,
        loadingMore: this.data.page > 1
      })

      const result = await wx.cloud.callFunction({
        name: 'books',
        data: {
          action: 'getFavorites',
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      })

      const response = result.result as any
      console.log('收藏列表响应:', response)

      if (response.code === 0) {
        const newFavorites = response.data.favorites.map((item: any) => ({
          ...item,
          createTime: this.formatTime(item.createTime)
        }))

        console.log('新收藏数据:', newFavorites)
        console.log('当前页面:', this.data.page)
        console.log('现有收藏数量:', this.data.favorites.length)

        const updatedFavorites = this.data.page === 1 ? newFavorites : [...this.data.favorites, ...newFavorites]
        console.log('更新后收藏数量:', updatedFavorites.length)

        // 去重处理，防止重复数据
        const uniqueFavorites = updatedFavorites.filter((item: FavoriteItem, index: number, self: FavoriteItem[]) => 
          index === self.findIndex((t: FavoriteItem) => t._id === item._id)
        )

        console.log('去重后收藏数量:', uniqueFavorites.length)

        this.setData({
          favorites: uniqueFavorites,
          hasMore: response.data.hasMore,
          page: this.data.page + 1,
          hasLoaded: true
        })
      } else {
        wx.showToast({
          title: response.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载收藏列表失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({
        loading: false,
        loadingMore: false
      })
    }
  },

  // 格式化时间
  formatTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    const month = 30 * day

    if (diff < hour) {
      return Math.floor(diff / minute) + '分钟前'
    } else if (diff < day) {
      return Math.floor(diff / hour) + '小时前'
    } else if (diff < month) {
      return Math.floor(diff / day) + '天前'
    } else {
      return date.toLocaleDateString()
    }
  },

  // 取消收藏
  async removeFavorite(e: any) {
    e.stopPropagation()
    
    const bookId = e.currentTarget.dataset.bookId
    const index = e.currentTarget.dataset.index

    try {
      wx.showModal({
        title: '确认取消收藏',
        content: '确定要取消收藏这本书吗？',
        success: async (res) => {
          if (res.confirm) {
            wx.showLoading({ title: '处理中...' })

            const result = await wx.cloud.callFunction({
              name: 'books',
              data: {
                action: 'removeFromFavorites',
                bookId: bookId
              }
            })

            const response = result.result as any

            if (response.code === 0) {
              // 从列表中移除该项
              const newFavorites = [...this.data.favorites]
              newFavorites.splice(index, 1)
              
              this.setData({
                favorites: newFavorites
              })

              wx.showToast({
                title: '取消收藏成功',
                icon: 'success'
              })
            } else {
              wx.showToast({
                title: response.message || '取消收藏失败',
                icon: 'none'
              })
            }
          }
        }
      })
    } catch (error) {
      console.error('取消收藏失败:', error)
      wx.showToast({
        title: '取消收藏失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 跳转到商品详情
  goToDetail(e: any) {
    const bookId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product-detail/product-detail?id=${bookId}`
    })
  },

  // 跳转到首页
  goToHome() {
    wx.switchTab({
      url: '/pages/home/home'
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshFavorites()
    wx.stopPullDownRefresh()
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadFavorites()
    }
  }
}) 