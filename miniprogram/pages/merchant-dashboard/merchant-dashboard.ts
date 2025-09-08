import { ProductForm } from '../../types/product-form'
import { checkLoginStatus, isMerchant } from '../../utils/auth'

Page({
  data: {
    currentTab: 'all',
    loading: true,
    merchantId: '',
    userInfo: {} as any,
    shopInfo: {
      name: '我的书店',
      description: '精品商品，品质保证',
      status: 'active',
      statusText: '营业中',
      avatarUrl: ''
    },
    // 统计数据
    stats: [
      { type: 'sales', label: '总销量', value: '0', trend: 0, unit: '件' },
      { type: 'orders', label: '订单数', value: '0', trend: 0, unit: '单' },
      { type: 'revenue', label: '总收入', value: '0', trend: 0, unit: '元' },
      { type: 'stock', label: '库存数', value: '0', trend: 0, unit: '件' }
    ],
    // 快捷操作
    quickActions: [
      { id: 1, name: '添加商品', icon: 'add-circle', action: 'addProduct', bgColor: '#3b82f6' },
      { id: 2, name: '订单管理', icon: 'order', action: 'orders', bgColor: '#10b981' },
      { id: 3, name: '库存管理', icon: 'shop', action: 'inventory', bgColor: '#f59e0b' },
      { id: 4, name: '优惠券管理', icon: 'coupon', action: 'coupons', bgColor: '#ef4444' },
      { id: 5, name: '营收统计', icon: 'chart-bar', action: 'analytics', bgColor: '#8b5cf6' }
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
      collegeId: 1,
      collegeIndex: 0,
      collegeName: '数学科学学院',
      majorId: 'all',
      majorIndex: 0,
      majorName: '全部专业',
      description: '',
      condition: '良好',
      conditionIndex: 1,
      icon: '📚',
      images: [] as string[]
    } as ProductForm,
    // 学院和专业选项
    collegeOptions: [] as any[],
    majorOptions: [] as any[],
    conditionOptions: ['全新', '良好', '一般'],
    saving: false
  },

  async onLoad() {
    // 权限验证：检查登录状态
    if (!checkLoginStatus()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/login/login'
        })
      }, 2000)
      return
    }

    // 权限验证：检查商家身份
    if (!isMerchant()) {
      wx.showModal({
        title: '访问受限',
        content: '您还不是商家，是否申请成为商家？',
        showCancel: true,
        confirmText: '申请',
        cancelText: '返回',
        success: (res) => {
          if (res.confirm) {
            wx.redirectTo({
              url: '/pages/merchant-apply/merchant-apply'
            })
          } else {
            wx.switchTab({
              url: '/pages/profile/profile'
            })
          }
        }
      })
      return
    }

    await this.loadUserInfo()
    await this.initCollegeData()
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

  // 初始化学院数据
  async initCollegeData() {
    try {
      // 使用 require 替代动态 import
      const collegeDataModule = require('../../utils/college-data')
      const { collegeData, getMajorsByCollegeId } = collegeDataModule
      
      console.log('学院数据导入成功:', collegeData)
      console.log('学院数据长度:', collegeData.length)
      
      const collegeOptions = collegeData.map((college: any) => ({
        id: college.id,
        name: college.name
      }))
      
      const majorOptions = getMajorsByCollegeId(1) // 默认第一个学院的专业
      
      console.log('学院选项:', collegeOptions)
      console.log('专业选项:', majorOptions)
      
      this.setData({
        collegeOptions,
        majorOptions
      })
    } catch (error) {
      console.error('初始化学院数据失败:', error)
      console.error('错误详情:', (error as Error).stack)
      wx.showToast({
        title: '初始化数据失败',
        icon: 'none'
      })
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
      // 获取商品统计
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

  // 加载商家商品
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
      case 'coupons':
        this.goToCouponManagement()
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
        collegeId: 1,
        collegeIndex: 0,
        collegeName: '数学科学学院',
        majorId: 'all',
        majorIndex: 0,
        majorName: '全部专业',
        description: '',
        condition: '良好',
        conditionIndex: 1,
        icon: '📚',
        images: []
      } as ProductForm
    })
  },

  // 编辑商品
  async editProduct(e: any) {
    const productId = e.currentTarget.dataset.id
    const product = this.data.allProducts.find(p => p._id === productId)
    
    if (!product) {
      wx.showToast({
        title: '商品不存在',
        icon: 'none'
      })
      return
    }

    // 找到学院和专业的索引
    const collegeIndex = this.data.collegeOptions.findIndex(college => college.id === product.collegeId)
    
    // 获取该学院的专业列表
    let majorOptions = this.data.majorOptions
    if (product.collegeId) {
      try {
        const collegeDataModule = require('../../utils/college-data')
        const { getMajorsByCollegeId } = collegeDataModule
        majorOptions = getMajorsByCollegeId(product.collegeId)
      } catch (error) {
        console.error('获取专业列表失败:', error)
      }
    }
    
    const majorIndex = majorOptions.findIndex(major => major.id === product.majorId)
    const conditionIndex = this.data.conditionOptions.findIndex(cond => cond === product.condition)

    this.setData({
      showProductModal: true,
      editingProduct: product,
      majorOptions: majorOptions,
      productForm: {
        title: product.title || '',
        author: product.author || '',
        price: product.price ? product.price.toString() : '',
        originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
        stock: product.stock ? product.stock.toString() : '',
        collegeId: product.collegeId || 1,
        collegeIndex: collegeIndex >= 0 ? collegeIndex : 0,
        collegeName: this.data.collegeOptions[collegeIndex >= 0 ? collegeIndex : 0]?.name || '数学科学学院',
        majorId: product.majorId || 'all',
        majorIndex: majorIndex >= 0 ? majorIndex : 0,
        majorName: majorOptions[majorIndex >= 0 ? majorIndex : 0]?.name || '全部专业',
        description: product.description || '',
        condition: product.condition || '良好',
        conditionIndex: conditionIndex >= 0 ? conditionIndex : 1,
        icon: product.icon || '📚',
        images: product.images || []
      } as ProductForm
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

  // 学院选择改变
  async onCollegeChange(e: any) {
    const collegeOptions = this.data.collegeOptions
    const selectedCollege = collegeOptions[e.detail.value]
    
    if (!selectedCollege) {
      console.error('未找到选中的学院')
      return
    }
    
    try {
      // 使用 require 替代动态 import
      const collegeDataModule = require('../../utils/college-data')
      const { getMajorsByCollegeId } = collegeDataModule
      const majorOptions = getMajorsByCollegeId(selectedCollege.id)
      
      this.setData({
        'productForm.collegeId': selectedCollege.id,
        'productForm.collegeIndex': e.detail.value,
        'productForm.collegeName': selectedCollege.name,
        'productForm.majorId': 'all',
        'productForm.majorIndex': 0,
        'productForm.majorName': '全部专业',
        majorOptions: majorOptions
      })
    } catch (error) {
      console.error('更新专业列表失败:', error)
      wx.showToast({
        title: '更新专业列表失败',
        icon: 'none'
      })
    }
  },

  // 专业选择改变
  onMajorChange(e: any) {
    const majorOptions = this.data.majorOptions
    const majorIndex = e.detail.value
    
    // 边界检查
    if (!majorOptions || !Array.isArray(majorOptions) || majorIndex < 0 || majorIndex >= majorOptions.length) {
      console.error('专业选择器索引越界:', { majorOptions, majorIndex })
      wx.showToast({
        title: '专业选择失败',
        icon: 'none'
      })
      return
    }
    
    const selectedMajor = majorOptions[majorIndex]
    if (!selectedMajor || !selectedMajor.id) {
      console.error('选中的专业数据无效:', selectedMajor)
      wx.showToast({
        title: '专业数据错误',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      'productForm.majorId': selectedMajor.id,
      'productForm.majorIndex': majorIndex,
      'productForm.majorName': selectedMajor.name
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
      const bookData: any = {
        title: productForm.title.trim(),
        author: productForm.author.trim(), // 商品简要描述
        price: parseFloat(productForm.price),
        originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        collegeId: productForm.collegeId,
        collegeName: productForm.collegeName,
        majorId: productForm.majorId,
        majorName: productForm.majorName,
        description: productForm.description.trim(),
        condition: productForm.condition,
        icon: productForm.icon,
        images: productForm.images,
        status: 'active'
      }

      const action = editingProduct ? 'updateBook' : 'addBook'
      const data = editingProduct 
        ? { ...bookData, bookId: editingProduct._id }
        : bookData

      console.log('保存商品请求数据:', { action, ...data })

      const result = await wx.cloud.callFunction({
        name: 'books',
        data: { action, ...data }
      })

      console.log('云函数返回结果:', result)

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
      content: '删除后无法恢复，确定要删除这件商品吗？',
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

  goToCouponManagement() {
    wx.navigateTo({
      url: '/pages/merchant-coupons/merchant-coupons'
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