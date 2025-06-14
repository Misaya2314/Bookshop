Page({
  data: {
    currentTab: 'all',
    shopInfo: {
      name: '李同学的店',
      description: '专注计算机类图书，质量保证',
      status: 'active',
      statusText: '营业中'
    },
    stats: [
      { type: 'sales', label: '今日销售', value: '12', trend: 15 },
      { type: 'orders', label: '今日订单', value: '8', trend: -5 },
      { type: 'revenue', label: '今日收入', value: '456', trend: 12 },
      { type: 'views', label: '商品浏览', value: '89', trend: 8 }
    ],
    quickActions: [
      { id: 1, name: '添加商品', icon: 'add', action: 'addProduct', bgColor: '#3b82f6' },
      { id: 2, name: '订单管理', icon: 'order', action: 'orders', bgColor: '#10b981' },
      { id: 3, name: '营销工具', icon: 'discount', action: 'marketing', bgColor: '#f59e0b' },
      { id: 4, name: '数据分析', icon: 'chart', action: 'analytics', bgColor: '#8b5cf6' },
      { id: 5, name: '客服消息', icon: 'chat', action: 'messages', bgColor: '#ef4444' },
      { id: 6, name: '店铺装修', icon: 'edit', action: 'decoration', bgColor: '#06b6d4' }
    ],
    pendingTasks: [
      { 
        id: 1, 
        title: '待发货订单', 
        desc: '有新订单需要处理', 
        icon: 'order', 
        action: 'pendingShipment', 
        count: 3, 
        urgent: true 
      },
      { 
        id: 2, 
        title: '库存预警', 
        desc: '部分商品库存不足', 
        icon: 'error-circle', 
        action: 'lowStock', 
        count: 2, 
        urgent: false 
      },
      { 
        id: 3, 
        title: '客户咨询', 
        desc: '待回复的咨询消息', 
        icon: 'chat', 
        action: 'customerService', 
        count: 5, 
        urgent: false 
      }
    ],
    productTabs: [
      { label: '全部', value: 'all', count: 0 },
      { label: '在售', value: 'active', count: 12 },
      { label: '下架', value: 'inactive', count: 3 },
      { label: '售罄', value: 'sold_out', count: 1 }
    ],
    allProducts: [] as any[], // 将从云端加载真实数据
    mockProducts: [
      {
        id: 1,
        title: 'Java核心技术 卷I',
        price: 45,
        sales: 156,
        stock: 5,
        status: 'active',
        icon: '📖'
      },
      {
        id: 2,
        title: '算法导论',
        price: 68,
        sales: 89,
        stock: 3,
        status: 'active',
        icon: '📘'
      },
      {
        id: 3,
        title: '深入理解计算机系统',
        price: 52,
        sales: 76,
        stock: 2,
        status: 'active',
        icon: '📗'
      },
      {
        id: 4,
        title: '设计模式',
        price: 38,
        sales: 95,
        stock: 0,
        status: 'sold_out',
        icon: '📙'
      },
      {
        id: 5,
        title: '计算机网络',
        price: 35,
        sales: 45,
        stock: 8,
        status: 'inactive',
        icon: '📕'
      }
    ],
    products: [] as any[],
    showProductModal: false,
    editingProduct: null as any,
    productForm: {
      title: '',
      author: '',
      price: '',
      stock: '',
      categoryId: '1',
      description: '',
      icon: '📚',
      images: [] as string[]
    },
    categoryOptions: [
      { id: '1', name: '文学小说' },
      { id: '2', name: '历史传记' },
      { id: '3', name: '科学技术' },
      { id: '4', name: '经济管理' },
      { id: '5', name: '教育考试' }
    ],
    saving: false,
    recentOrders: [
      {
        id: 'order001',
        orderNumber: '2024012012001',
        createTime: '2024-01-20 14:30',
        productNames: 'Java核心技术 卷I, 算法导论',
        totalAmount: '113.00',
        statusText: '待发货',
        statusClass: 'shipping'
      },
      {
        id: 'order002',
        orderNumber: '2024012011001',
        createTime: '2024-01-20 11:15',
        productNames: '深入理解计算机系统',
        totalAmount: '52.00',
        statusText: '已完成',
        statusClass: 'completed'
      },
      {
        id: 'order003',
        orderNumber: '2024011920001',
        createTime: '2024-01-19 20:45',
        productNames: '设计模式',
        totalAmount: '38.00',
        statusText: '待发货',
        statusClass: 'shipping'
      }
    ]
  },

  onLoad() {
    this.loadMerchantBooks()
  },

  // 加载商家图书
  async loadMerchantBooks() {
    wx.showLoading({ title: '加载中...' })
    
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
      wx.hideLoading()
    }
  },

  // 更新标签页统计
  updateTabCounts(books: any[]) {
    const activeCount = books.filter(book => book.status === 'active').length
    const inactiveCount = books.filter(book => book.status === 'inactive').length
    const soldOutCount = books.filter(book => book.status === 'sold_out').length
    
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
    
    if (tab !== 'all') {
      products = products.filter(product => product.status === tab)
    }

    this.setData({ products })
  },

  // 编辑店铺信息
  editShopInfo() {
    wx.navigateTo({
      url: '/pages/shop-edit/shop-edit'
    })
  },

  // 查看统计详情
  viewStatDetail(e: any) {
    const type = e.currentTarget.dataset.type
    wx.navigateTo({
      url: `/pages/stat-detail/stat-detail?type=${type}`
    })
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
      case 'marketing':
        wx.navigateTo({
          url: '/pages/marketing/marketing'
        })
        break
      case 'analytics':
        wx.navigateTo({
          url: '/pages/analytics/analytics'
        })
        break
      case 'messages':
        wx.navigateTo({
          url: '/pages/customer-service/customer-service'
        })
        break
      case 'decoration':
        wx.navigateTo({
          url: '/pages/shop-decoration/shop-decoration'
        })
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
        wx.navigateTo({
          url: '/pages/order-management/order-management?status=shipping'
        })
        break
      case 'lowStock':
        wx.navigateTo({
          url: '/pages/inventory/inventory'
        })
        break
      case 'customerService':
        wx.navigateTo({
          url: '/pages/customer-service/customer-service'
        })
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
        stock: '',
        categoryId: '1',
        description: '',
        icon: '📚',
        images: []
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
    this.setData({
      'productForm.categoryId': categoryOptions[e.detail.value].id
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
        stock: parseInt(productForm.stock),
        categoryId: productForm.categoryId,
        description: productForm.description.trim(),
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

  // 编辑商品
  editProduct(e: any) {
    const productId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product-edit/product-edit?id=${productId}`
    })
  },

  // 切换商品状态
  toggleProductStatus(e: any) {
    const productId = e.currentTarget.dataset.id
    const product = this.data.allProducts.find(p => p._id === productId || p.id === productId)
    
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
        // 重新加载商品列表
        this.loadMerchantBooks()
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
        // 重新加载商品列表
        this.loadMerchantBooks()
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

  // 订单管理
  goToOrderManagement() {
    wx.navigateTo({
      url: '/pages/order-management/order-management'
    })
  },

  // 查看订单详情
  viewOrderDetail(e: any) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    })
  },

  // 前往设置
  goToSettings() {
    wx.navigateTo({
      url: '/pages/merchant-settings/merchant-settings'
    })
  },

  // 上传图片
  uploadImage() {
    wx.chooseImage({
      count: 3, // 最多选择3张图片
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