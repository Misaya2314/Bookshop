interface ProductData {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  sales: number;
  stock: number;
  isFavorite: boolean;
  images: string[];
  params: Array<{label: string; value: string}>;
  seller: {
    id: string;
    name: string;
    college: string;
    grade: string;
    rating: number;
    totalSales: number;
  };
  description: string;
  reviews: any[];
}

Page({
  data: {
    currentImageIndex: 0,
    selectedAddress: '',
    loading: true,
    product: null as ProductData | null
  },

  onLoad(options: any) {
    console.log('商品详情页onLoad, options:', options)
    const productId = options.id
    if (productId) {
      this.loadProductDetail(productId)
    } else {
      console.error('缺少商品ID参数')
      this.setData({ loading: false })
    }
  },

  async loadProductDetail(productId: string) {
    console.log('开始加载商品详情, ID:', productId)
    wx.showLoading({ title: '加载中...' })
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'books',
        data: {
          action: 'getBookDetail',
          bookId: productId
        }
      })

      console.log('云函数返回结果:', result)
      const response = result.result as any
      
      if (response.code === 0) {
        // 将数据格式化为页面需要的格式，匹配实际数据库字段
        const bookData = response.data
        console.log('原始商品数据:', bookData) // 调试用
        
        // 简化数据格式化逻辑，确保所有字段都有默认值
        const formattedProduct = {
          id: bookData._id || '',
          title: bookData.title || '暂无标题',
          subtitle: bookData.description || '暂无描述',
          price: Number(bookData.price) || 0,
          originalPrice: Number(bookData.originalPrice || bookData.price) || 0,
          discount: bookData.originalPrice ? Math.round((bookData.price / bookData.originalPrice) * 10) : 10,
          rating: Number(bookData.rating) || 0,
          sales: Number(bookData.sales) || 0,
          stock: Number(bookData.stock) || 0,
          isFavorite: false,
          images: this.processImages(bookData.images, bookData.icon),
          params: [
            { label: '书籍状态', value: bookData.condition || '良好' },
            { label: '出版社', value: bookData.publisher || '未知' },
            { label: '作者', value: bookData.author || '未知' },
            { label: 'ISBN', value: bookData.isbn || '未知' },
            { label: '分类', value: this.getCategoryName(bookData.categoryId || 0) },
            { label: '子分类', value: this.getSubCategoryName(bookData.subCategoryId || '') }
          ],
          seller: {
            id: bookData.merchantId || '',
            name: bookData.merchantName || '商家',
            college: '未知',
            grade: '未知',
            rating: 5.0,
            totalSales: Number(bookData.sales) || 0
          },
          description: bookData.description || '暂无描述',
          reviews: [] // 后续可以添加评价功能
        }
        
        console.log('格式化后的商品数据:', formattedProduct) // 调试用
        
        this.setData({ 
          product: formattedProduct, 
          loading: false 
        })
        
        console.log('页面数据设置完成, this.data.product:', this.data.product)
      } else {
        console.error('加载商品详情失败:', response)
        this.setData({ loading: false })
        wx.showToast({
          title: response.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载商品详情失败:', error)
      this.setData({ loading: false })
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 重试加载
  retry() {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const options = currentPage.options
    if (options.id) {
      this.setData({ loading: true })
      this.loadProductDetail(options.id)
    }
  },

  // 获取分类名称
  getCategoryName(categoryId: number) {
    const categories = [
      { id: 1, name: '计算机' },
      { id: 2, name: '医学' },
      { id: 3, name: '管理学' },
      { id: 4, name: '英语' },
      { id: 5, name: '法律' },
      { id: 6, name: '理工' },
      { id: 7, name: '艺术' }
    ]
    const category = categories.find(c => c.id === categoryId)
    return category ? category.name : '其他'
  },

  // 获取子分类名称
  getSubCategoryName(subCategoryId: string) {
    const subCategories: { [key: string]: string } = {
      'textbook': '教材',
      'reference': '参考书',
      'exam': '考研资料'
    }
    return subCategories[subCategoryId] || '其他'
  },

  // 处理图片数据
  processImages(images: any, icon: string) {
    console.log('处理图片数据:', { images, icon })
    console.log('images类型:', typeof images)
    console.log('images是否为数组:', Array.isArray(images))
    
    // 如果有images数组且不为空
    if (Array.isArray(images) && images.length > 0) {
      // 过滤掉空值和无效值
      const validImages = images.filter(img => {
        const isValid = img && typeof img === 'string' && img.trim() !== ''
        console.log(`图片 "${img}" 是否有效:`, isValid)
        return isValid
      })
      
      if (validImages.length > 0) {
        console.log('有效图片列表:', validImages)
        // 检查是否是云存储路径
        validImages.forEach((img, index) => {
          console.log(`图片${index + 1}: ${img}`)
          if (img.startsWith('cloud://')) {
            console.log(`图片${index + 1}是云存储路径`)
          } else if (img.length === 1 || img.length === 2) {
            console.log(`图片${index + 1}是emoji: ${img}`)
          } else {
            console.log(`图片${index + 1}是其他类型的URL`)
          }
        })
        return validImages
      }
    }
    
    // 如果没有有效的图片数组，使用icon
    const fallbackIcon = icon || '📚'
    console.log('使用默认图标:', fallbackIcon)
    return [fallbackIcon]
  },

  onImageChange(e: any) {
    this.setData({
      currentImageIndex: e.detail.current
    })
  },

  toggleFavorite() {
    if (!this.data.product) return;
    
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
    if (!this.data.product) {
      wx.showToast({
        title: '商品信息加载中',
        icon: 'none'
      })
      return
    }
    
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
    if (!this.data.product) return;
    
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
    if (!this.data.product) return;
    
    wx.navigateTo({
      url: `/pages/seller-profile/seller-profile?id=${this.data.product.seller.id}`
    })
  },

  goToAllReviews() {
    if (!this.data.product) return;
    
    wx.navigateTo({
      url: `/pages/reviews/reviews?productId=${this.data.product.id}`
    })
  },

  onShare() {
    if (!this.data.product) return {};
    
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
    if (!this.data.product) return {};
    
    return {
      title: this.data.product.title,
      path: `/pages/product-detail/product-detail?id=${this.data.product.id}`
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const options = currentPage.options
    if (options.id) {
      this.loadProductDetail(options.id).finally(() => {
        wx.stopPullDownRefresh()
      })
    } else {
      wx.stopPullDownRefresh()
    }
  },

  // 图片加载成功
  onImageLoad(e: any) {
    console.log('图片加载成功:', e.detail)
  },

  // 图片加载失败
  onImageError(e: any) {
    console.log('图片加载失败:', e.detail)
    wx.showToast({
      title: '图片加载失败',
      icon: 'none',
      duration: 2000
    })
  }
}) 