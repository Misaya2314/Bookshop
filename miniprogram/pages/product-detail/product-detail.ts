Page({
  data: {
    currentImageIndex: 0,
    selectedAddress: '',
    product: {
      id: 1,
      title: 'Java核心技术 卷I 基础知识（原书第12版）',
      subtitle: '经典Java教程，程序员必备，9成新，几乎无笔记',
      price: 45,
      originalPrice: 65,
      discount: 7,
      rating: 4.8,
      sales: 156,
      stock: 5,
      isFavorite: false,
      images: ['📖', '📚', '📘'],
      params: [
        { label: '书籍状态', value: '9成新' },
        { label: '出版社', value: '机械工业出版社' },
        { label: '作者', value: '凯·S·霍斯特曼' },
        { label: 'ISBN', value: '9787111681069' },
        { label: '页数', value: '768页' },
        { label: '版次', value: '第12版' }
      ],
      seller: {
        id: 'seller001',
        name: '李同学',
        college: '计算机学院',
        grade: '大四',
        rating: 4.9,
        totalSales: 89
      },
      description: '这本《Java核心技术》是Java程序员的经典教程，内容全面，讲解深入浅出。书籍保存完好，9成新，几乎没有笔记，非常适合Java学习者使用。本书涵盖了Java语言的核心特性，包括面向对象编程、泛型、集合、多线程等重要内容。原价65元，现在只要45元，性价比很高！',
      reviews: [
        {
          id: 1,
          userName: '张同学',
          rating: 5,
          content: '书籍质量很好，几乎全新，内容也很实用，推荐！',
          time: '2024-01-15'
        },
        {
          id: 2,
          userName: '王同学',
          rating: 4,
          content: 'Java学习的好书，卖家服务态度也很好。',
          time: '2024-01-10'
        }
      ]
    }
  },

  onLoad(options: any) {
    const productId = options.id
    if (productId) {
      this.loadProductDetail(productId)
    }
  },

  loadProductDetail(productId: string) {
    // 这里应该根据productId从服务器加载商品详情
    // 目前使用模拟数据
    console.log('加载商品详情:', productId)
  },

  onImageChange(e: any) {
    this.setData({
      currentImageIndex: e.detail.current
    })
  },

  toggleFavorite() {
    const isFavorite = !this.data.product.isFavorite
    this.setData({
      'product.isFavorite': isFavorite
    })
    
    wx.showToast({
      title: isFavorite ? '已收藏' : '已取消收藏',
      icon: 'success'
    })
  },

  selectAddress() {
    // 保存当前页面实例到全局，用于回调
    getApp().globalData = getApp().globalData || {}
    getApp().globalData.productDetailPage = this
    
    wx.navigateTo({
      url: '/pages/address/address?type=select'
    })
  },

  // 添加用于接收地址选择结果的方法
  onAddressSelected(address: string) {
    this.setData({ selectedAddress: address })
    wx.showToast({
      title: '地址设置成功',
      icon: 'success'
    })
  },

  addToCart() {
    wx.showLoading({ title: '添加中...' })
    
    // 模拟加入购物车
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '已加入购物车',
        icon: 'success'
      })
    }, 1000)
  },

  buyNow() {
    if (!this.data.selectedAddress) {
      wx.showToast({
        title: '请先选择收货地址',
        icon: 'none'
      })
      return
    }

    // 跳转到订单确认页面
    const orderData = {
      items: [{
        id: this.data.product.id,
        title: this.data.product.title,
        price: this.data.product.price,
        quantity: 1,
        seller: this.data.product.seller
      }],
      totalPrice: this.data.product.price,
      address: this.data.selectedAddress
    }

    wx.navigateTo({
      url: `/pages/checkout/checkout?data=${encodeURIComponent(JSON.stringify(orderData))}`
    })
  },

  contactSeller() {
    wx.showModal({
      title: '联系卖家',
      content: '是否要联系卖家"' + this.data.product.seller.name + '"?',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '正在连接卖家...',
            icon: 'loading'
          })
        }
      }
    })
  },

  goToSellerProfile() {
    wx.navigateTo({
      url: `/pages/seller-profile/seller-profile?id=${this.data.product.seller.id}`
    })
  },

  goToAllReviews() {
    wx.navigateTo({
      url: `/pages/reviews/reviews?productId=${this.data.product.id}`
    })
  },

  onShare() {
    return {
      title: this.data.product.title,
      path: `/pages/product-detail/product-detail?id=${this.data.product.id}`
    }
  },

  showMore() {
    wx.showActionSheet({
      itemList: ['举报商品', '联系客服'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.showToast({
            title: '感谢举报',
            icon: 'success'
          })
        } else if (res.tapIndex === 1) {
          wx.showToast({
            title: '正在连接客服...',
            icon: 'loading'
          })
        }
      }
    })
  },

  onShareAppMessage() {
    return {
      title: this.data.product.title,
      path: `/pages/product-detail/product-detail?id=${this.data.product.id}`
    }
  }
}) 