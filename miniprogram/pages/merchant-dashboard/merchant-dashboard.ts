Page({
  data: {
    currentTab: 'all',
    loading: true,
    merchantId: '',
    userInfo: {} as any,
    shopInfo: {
      name: '我的书店',
      description: '精品图书，品质保证',
      status: 'active',
      statusText: '营业中',
      avatarUrl: ''
    },
    // 统计数据
    stats: [
      { type: 'sales', label: '总销量', value: '0', trend: 0, unit: '本' },
      { type: 'orders', label: '订单数', value: '0', trend: 0, unit: '单' },
      { type: 'revenue', label: '总收入', value: '0', trend: 0, unit: '元' },
      { type: 'stock', label: '库存数', value: '0', trend: 0, unit: '本' }
    ],
    // 快捷操作
    quickActions: [
      { id: 1, name: '添加商品', icon: 'add-circle', action: 'addProduct', bgColor: '#3b82f6' },
      { id: 2, name: '订单管理', icon: 'order', action: 'orders', bgColor: '#10b981' },
      { id: 3, name: '库存管理', icon: 'shop', action: 'inventory', bgColor: '#f59e0b' },
      { id: 4, name: '营收统计', icon: 'chart-bar', action: 'analytics', bgColor: '#8b5cf6' }
    ],
    // 待办事项
    pendingTasks: [
      { 
        id: 1, 
        title: '待发货订单', 
        desc: '有新订单需要处理', 
        icon: 'order', 
        action: 'pendingShipment', 
        count: 0, 
        urgent: true 
      },
      { 
        id: 2, 
        title: '库存预警', 
        desc: '部分商品库存不足', 
        icon: 'error-circle', 
        action: 'lowStock', 
        count: 0, 
        urgent: false 
      }
    ],
    // 商品标签
    productTabs: [
      { label: '全部', value: 'all', count: 0 },
      { label: '在售', value: 'active', count: 0 },
      { label: '下架', value: 'inactive', count: 0 },
      { label: '售罄', value: 'sold_out', count: 0 }
    ],
    // 商品列表
    allProducts: [] as any[],
    products: [] as any[],
    // 最近订单
    recentOrders: [] as any[],
    // 模态框状态
    showProductModal: false,
    editingProduct: null as any,
    productForm: {
      title: '',
      author: '',
      price: '',
      originalPrice: '',
      stock: '',
      categoryId: 1,
      categoryIndex: 0,
      categoryName: '计算机',
      subCategoryId: 'textbook',
      subCategoryIndex: 0,
      subCategoryName: '教材',
      description: '',
      condition: '良好',
      conditionIndex: 1,
      publisher: '',
      isbn: '',
      icon: '📚',
      images: [] as string[]
    },
    // 分类选项
    categoryOptions: [
      { id: 1, name: '计算机' },
      { id: 2, name: '医学' },
      { id: 3, name: '管理学' },
      { id: 4, name: '英语' },
      { id: 5, name: '法律' },
      { id: 6, name: '理工' },
      { id: 7, name: '艺术' }
    ],
    subCategoryOptions: [
      { id: 'textbook', name: '教材' },
      { id: 'reference', name: '参考书' },
      { id: 'exam', name: '考研资料' }
    ],
    conditionOptions: ['全新', '良好', '一般'],
    saving: false
  },

  async onLoad() {
    await this.loadUserInfo()
    await this.loadAllData()
  },

  async onShow() {
    // 页面显示时刷新数据
    await this.loadAllData()
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.setData({ 
          userInfo,
          merchantId: userInfo._id,
          'shopInfo.name': userInfo.nickName + '的书店',
          'shopInfo.avatarUrl': userInfo.avatarUrl || '' // 添加头像URL
        })
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  },

  // 加载所有数据
  async loadAllData() {
    this.setData({ loading: true })
    
    try {
      await Promise.all([
        this.loadMerchantStats(),
        this.loadMerchantBooks(),
        this.loadMerchantOrders(),
        this.loadLowStockAlert()
      ])
    } catch (error) {
      console.error('加载数据失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载商家统计数据
  async loadMerchantStats() {
    try {
      // 获取图书统计
      const bookStatsResult = await wx.cloud.callFunction({
        name: 'books',
        data: {
          action: 'getMerchantBookStats'
        }
      })

      // 获取订单统计
      const orderStatsResult = await wx.cloud.callFunction({
        name: 'orders',
        data: {
          action: 'getMerchantStats',
          merchantId: this.data.merchantId
        }
      })

      const bookStats = (bookStatsResult.result as any)?.data || {}
      const orderStats = (orderStatsResult.result as any)?.data || {}

      const stats = [
        { 
          type: 'sales', 
          label: '总销量', 
          value: bookStats.totalSales?.toString() || '0', 
          trend: 0, 
          unit: '本' 
        },
        { 
          type: 'orders', 
          label: '订单数', 
          value: orderStats.totalOrders?.toString() || '0', 
          trend: 0, 
          unit: '单' 
        },
        { 
          type: 'revenue', 
          label: '总收入', 
          value: orderStats.totalRevenue?.toFixed(2) || '0.00', 
          trend: 0, 
          unit: '元' 
        },
        { 
          type: 'stock', 
          label: '库存数', 
          value: bookStats.totalStock?.toString() || '0', 
          trend: 0, 
          unit: '本' 
        }
      ]

      // 更新待办任务数量
      const pendingTasks = [...this.data.pendingTasks]
      pendingTasks[0].count = orderStats.paidOrders || 0 // 待发货订单数
      pendingTasks[1].count = bookStats.lowStockBooks || 0 // 库存预警数

      this.setData({ 
        stats,
        pendingTasks
      })

    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  },

  // 加载商家图书
  async loadMerchantBooks() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'books',
        data: {
          action: 'getMerchantBooks',
          status: 'all',
          page: 1,
          pageSize: 100
        }
      })

      const response = result.result as any
      if (response.code === 0) {
        const books = response.data.books
        this.setData({
          allProducts: books,
          products: books
        })
        
        // 更新标签页数量统计
        this.updateTabCounts(books)
      }
    } catch (error) {
      console.error('加载商品失败:', error)
    }
  },

  // 加载商家订单
  async loadMerchantOrders() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'orders',
        data: {
          action: 'getMerchantOrders',
          merchantId: this.data.merchantId,
          page: 1,
          limit: 5 // 只加载最近5个订单
        }
      })

      const response = result.result as any
      if (response.code === 0) {
        this.setData({
          recentOrders: response.data
        })
      }
    } catch (error) {
      console.error('加载订单失败:', error)
    }
  },

  // 加载库存预警
  async loadLowStockAlert() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'books',
        data: {
          action: 'getMerchantLowStock',
          threshold: 5
        }
      })

      const response = result.result as any
      if (response.code === 0) {
        const lowStockCount = response.data.count
        const pendingTasks = [...this.data.pendingTasks]
        pendingTasks[1].count = lowStockCount
        this.setData({ pendingTasks })
      }
    } catch (error) {
      console.error('加载库存预警失败:', error)
    }
  },

  // 更新标签页统计
  updateTabCounts(books: any[]) {
    const activeCount = books.filter(book => book.status === 'active').length
    const inactiveCount = books.filter(book => book.status === 'inactive').length
    const soldOutCount = books.filter(book => book.stock === 0 && book.status === 'active').length
    
    this.setData({
      'productTabs[0].count': books.length,
      'productTabs[1].count': activeCount,
      'productTabs[2].count': inactiveCount,
      'productTabs[3].count': soldOutCount
    })
  },

  // 切换商品标签
  switchTab(e: any) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    this.filterProducts(tab)
  },

  // 筛选商品
  filterProducts(tab: string) {
    let products = this.data.allProducts
    
    if (tab === 'active') {
      products = products.filter(product => product.status === 'active')
    } else if (tab === 'inactive') {
      products = products.filter(product => product.status === 'inactive')
    } else if (tab === 'sold_out') {
      products = products.filter(product => product.stock === 0 && product.status === 'active')
    }

    this.setData({ products })
  },

  // 快捷操作处理
  handleQuickAction(e: any) {
    const action = e.currentTarget.dataset.action
    switch (action) {
      case 'addProduct':
        this.addProduct()
        break
      case 'orders':
        this.goToOrderManagement()
        break
      case 'inventory':
        this.goToInventoryManagement()
        break
      case 'analytics':
        this.goToAnalytics()
        break
      default:
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        })
    }
  },

  // 处理待办事项
  handleTask(e: any) {
    const action = e.currentTarget.dataset.action
    switch (action) {
      case 'pendingShipment':
        this.goToPendingShipment()
        break
      case 'lowStock':
        this.goToLowStock()
        break
      default:
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        })
    }
  },

  // 添加商品
  addProduct() {
    this.setData({
      showProductModal: true,
      editingProduct: null,
      productForm: {
        title: '',
        author: '',
        price: '',
        originalPrice: '',
        stock: '',
        categoryId: 1,
        categoryIndex: 0,
        categoryName: '计算机',
        subCategoryId: 'textbook',
        subCategoryIndex: 0,
        subCategoryName: '教材',
        description: '',
        condition: '良好',
        conditionIndex: 1,
        publisher: '',
        isbn: '',
        icon: '📚',
        images: []
      }
    })
  },

  // 编辑商品
  editProduct(e: any) {
    const productId = e.currentTarget.dataset.id
    const product = this.data.allProducts.find(p => p._id === productId)
    
    if (!product) {
      wx.showToast({
        title: '商品不存在',
        icon: 'none'
      })
      return
    }

    // 找到分类和子分类的索引
    const categoryIndex = this.data.categoryOptions.findIndex(cat => cat.id === product.categoryId)
    const subCategoryIndex = this.data.subCategoryOptions.findIndex(sub => sub.id === product.subCategoryId)
    const conditionIndex = this.data.conditionOptions.findIndex(cond => cond === product.condition)

    this.setData({
      showProductModal: true,
      editingProduct: product,
      productForm: {
        title: product.title || '',
        author: product.author || '',
        price: product.price ? product.price.toString() : '',
        originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
        stock: product.stock ? product.stock.toString() : '',
        categoryId: product.categoryId || 1,
        categoryIndex: categoryIndex >= 0 ? categoryIndex : 0,
        categoryName: this.data.categoryOptions[categoryIndex >= 0 ? categoryIndex : 0].name,
        subCategoryId: product.subCategoryId || 'textbook',
        subCategoryIndex: subCategoryIndex >= 0 ? subCategoryIndex : 0,
        subCategoryName: this.data.subCategoryOptions[subCategoryIndex >= 0 ? subCategoryIndex : 0].name,
        description: product.description || '',
        condition: product.condition || '良好',
        conditionIndex: conditionIndex >= 0 ? conditionIndex : 1,
        publisher: product.publisher || '',
        isbn: product.isbn || '',
        icon: product.icon || '📚',
        images: product.images || []
      }
    })
  },

  // 关闭商品模态框
  closeProductModal() {
    this.setData({
      showProductModal: false,
      editingProduct: null,
      saving: false
    })
  },

  // 模态框显示状态变化
  onProductModalChange(e: any) {
    if (!e.detail.visible) {
      this.closeProductModal()
    }
  },

  // 分类选择改变
  onCategoryChange(e: any) {
    const categoryOptions = this.data.categoryOptions
    const selectedCategory = categoryOptions[e.detail.value]
    this.setData({
      'productForm.categoryId': selectedCategory.id,
      'productForm.categoryIndex': e.detail.value,
      'productForm.categoryName': selectedCategory.name
    })
  },

  // 子分类选择改变
  onSubCategoryChange(e: any) {
    const subCategoryOptions = this.data.subCategoryOptions
    const selectedSubCategory = subCategoryOptions[e.detail.value]
    this.setData({
      'productForm.subCategoryId': selectedSubCategory.id,
      'productForm.subCategoryIndex': e.detail.value,
      'productForm.subCategoryName': selectedSubCategory.name
    })
  },

  // 品相选择改变
  onConditionChange(e: any) {
    const conditionOptions = this.data.conditionOptions
    this.setData({
      'productForm.condition': conditionOptions[e.detail.value],
      'productForm.conditionIndex': e.detail.value
    })
  },

  // 输入框变化处理
  onInputChange(e: any) {
    const field = e.currentTarget.dataset.field
    // 处理不同类型的输入组件
    const value = e.detail.value !== undefined ? e.detail.value : e.detail
    
    console.log('输入变化:', { field, value, eventDetail: e.detail })
    
    this.setData({
      [`productForm.${field}`]: value
    })
  },

  // 描述字段变化处理
  onDescriptionChange(e: any) {
    const value = e.detail.value
    this.setData({
      'productForm.description': value
    })
  },

  // 保存商品
  async saveProduct() {
    const { productForm, editingProduct } = this.data
    
    // 基本验证
    if (!productForm.title.trim()) {
      wx.showToast({ title: '请输入书名', icon: 'none' })
      return
    }
    if (!productForm.author.trim()) {
      wx.showToast({ title: '请输入作者', icon: 'none' })
      return
    }
    if (!productForm.price || parseFloat(productForm.price) <= 0) {
      wx.showToast({ title: '请输入正确的价格', icon: 'none' })
      return
    }
    if (!productForm.stock || parseInt(productForm.stock) < 0) {
      wx.showToast({ title: '请输入正确的库存', icon: 'none' })
      return
    }

    this.setData({ saving: true })

    try {
      const bookData = {
        title: productForm.title.trim(),
        author: productForm.author.trim(),
        price: parseFloat(productForm.price),
        originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        categoryId: productForm.categoryId,
        subCategoryId: productForm.subCategoryId,
        description: productForm.description.trim(),
        condition: productForm.condition,
        publisher: productForm.publisher.trim(),
        isbn: productForm.isbn.trim(),
        icon: productForm.icon,
        images: productForm.images,
        status: 'active'
      }

      const action = editingProduct ? 'updateBook' : 'addBook'
      const data = editingProduct 
        ? { ...bookData, bookId: editingProduct._id }
        : bookData

      const result = await wx.cloud.callFunction({
        name: 'books',
        data: { action, ...data }
      })

      const response = result.result as any
      if (response.code === 0) {
        wx.showToast({
          title: editingProduct ? '保存成功' : '添加成功',
          icon: 'success'
        })
        this.closeProductModal()
        this.loadMerchantBooks() // 重新加载商品列表
        this.loadMerchantStats() // 重新加载统计数据
      } else {
        wx.showToast({
          title: response.message || '操作失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('保存商品失败:', error)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    } finally {
      this.setData({ saving: false })
    }
  },

  // 切换商品状态
  toggleProductStatus(e: any) {
    const productId = e.currentTarget.dataset.id
    const product = this.data.allProducts.find(p => p._id === productId)
    
    if (!product) return

    wx.showActionSheet({
      itemList: ['上架', '下架', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 上架
          this.updateProductStatus(productId, 'active')
        } else if (res.tapIndex === 1) {
          // 下架
          this.updateProductStatus(productId, 'inactive')
        } else if (res.tapIndex === 2) {
          // 删除
          this.showDeleteConfirm(productId)
        }
      }
    })
  },

  // 更新商品状态
  async updateProductStatus(productId: string, status: string) {
    wx.showLoading({ title: '处理中...' })
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'books',
        data: {
          action: 'updateBook',
          bookId: productId,
          status: status
        }
      })

      const response = result.result as any
      if (response.code === 0) {
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        })
        this.loadMerchantBooks()
        this.loadMerchantStats()
      } else {
        wx.showToast({
          title: response.message || '更新失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('更新商品状态失败:', error)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 显示删除确认
  showDeleteConfirm(productId: string) {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这本图书吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteProduct(productId)
        }
      }
    })
  },

  // 删除商品
  async deleteProduct(productId: string) {
    wx.showLoading({ title: '删除中...' })
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'books',
        data: {
          action: 'deleteBook',
          bookId: productId
        }
      })

      const response = result.result as any
      if (response.code === 0) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
        this.loadMerchantBooks()
        this.loadMerchantStats()
      } else {
        wx.showToast({
          title: response.message || '删除失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('删除商品失败:', error)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 发货操作
  async shipOrder(e: any) {
    const orderId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认发货',
      content: '确定要发货这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '发货中...' })
            
            const result = await wx.cloud.callFunction({
              name: 'orders',
              data: {
                action: 'merchantShipOrder',
                orderId: orderId
              }
            })

            const response = result.result as any
            if (response.code === 0) {
              wx.showToast({
                title: '发货成功',
                icon: 'success'
              })
              // 重新加载数据
              await this.loadMerchantOrders()
              await this.loadMerchantStats()
            } else {
              wx.showToast({
                title: response.message || '发货失败',
                icon: 'none'
              })
            }
          } catch (error) {
            console.error('发货失败:', error)
            wx.showToast({
              title: '网络错误',
              icon: 'none'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  // 跳转页面方法
  goToOrderManagement() {
    wx.navigateTo({
      url: '/pages/merchant-orders/merchant-orders'
    })
  },

  goToPendingShipment() {
    wx.navigateTo({
      url: '/pages/merchant-orders/merchant-orders?status=paid'
    })
  },

  goToLowStock() {
    wx.navigateTo({
      url: '/pages/merchant-inventory/merchant-inventory?type=lowStock'
    })
  },

  goToInventoryManagement() {
    wx.navigateTo({
      url: '/pages/merchant-inventory/merchant-inventory'
    })
  },

  goToAnalytics() {
    wx.navigateTo({
      url: '/pages/merchant-analytics/merchant-analytics'
    })
  },

  viewOrderDetail(e: any) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    })
  },

  goToSettings() {
    wx.navigateTo({
      url: '/pages/merchant-settings/merchant-settings'
    })
  },

  // 上传图片
  uploadImage() {
    wx.chooseImage({
      count: 3, 
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        wx.showLoading({
          title: '上传中...'
        });
        
        const uploadTasks = res.tempFilePaths.map(filePath => {
          const cloudPath = `book-covers/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
          return wx.cloud.uploadFile({
            cloudPath,
            filePath
          });
        });
        
        Promise.all(uploadTasks)
          .then(results => {
            const fileIDs = results.map(result => result.fileID);
            const currentImages = this.data.productForm.images || [];
            
            this.setData({
              'productForm.images': [...currentImages, ...fileIDs]
            });
            
            wx.hideLoading();
            wx.showToast({
              title: '上传成功',
              icon: 'success'
            });
          })
          .catch(error => {
            wx.hideLoading();
            wx.showToast({
              title: '上传失败',
              icon: 'error'
            });
            console.error('图片上传失败:', error);
          });
      }
    });
  },

  // 删除图片
  deleteImage(e: any) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.productForm.images];
    images.splice(index, 1);
    
    this.setData({
      'productForm.images': images
    });
  }
}) 