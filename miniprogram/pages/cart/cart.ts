Page({
  data: {
    isEditing: false,
    allChecked: false,
    totalPrice: '0',
    checkedCount: 0,
    cartItems: [] as any[],
    merchants: [
      {
        id: 1,
        name: '李同学的店',
        checked: false,
        items: [
          {
            id: 1,
            title: 'Java核心技术 卷I',
            description: '9成新，几乎无笔记',
            price: 45,
            quantity: 1,
            stock: 5,
            checked: false,
            icon: '📖'
          },
          {
            id: 2,
            title: '算法导论',
            description: '8成新，有少量笔记',
            price: 68,
            quantity: 1,
            stock: 3,
            checked: false,
            icon: '📘'
          }
        ]
      },
      {
        id: 2,
        name: '王同学的店',
        checked: false,
        items: [
          {
            id: 3,
            title: '医学统计学',
            description: '9成新，保存完好',
            price: 32,
            quantity: 2,
            stock: 8,
            checked: false,
            icon: '📚'
          }
        ]
      }
    ],
    recommendItems: [
      {
        id: 4,
        title: '线性代数',
        price: 25,
        icon: '📗'
      },
      {
        id: 5,
        title: '高等数学',
        price: 35,
        icon: '📙'
      }
    ]
  },

  onLoad() {
    this.updateCartItems()
    this.calculateTotal()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      })
    }
  },

  updateCartItems() {
    const cartItems: any[] = []
    this.data.merchants.forEach(merchant => {
      cartItems.push(...merchant.items)
    })
    this.setData({ cartItems })
  },

  toggleEdit() {
    this.setData({
      isEditing: !this.data.isEditing
    })
  },

  onMerchantCheck(e: any) {
    const merchantId = e.currentTarget.dataset.id
    const checked = e.detail.value
    const merchants = this.data.merchants.map(merchant => {
      if (merchant.id === merchantId) {
        merchant.checked = checked
        merchant.items.forEach(item => {
          item.checked = checked
        })
      }
      return merchant
    })

    this.setData({ merchants })
    this.updateCartItems()
    this.calculateTotal()
    this.checkAllSelected()
  },

  onItemCheck(e: any) {
    const { merchantId, itemId } = e.currentTarget.dataset
    const checked = e.detail.value
    const merchants = this.data.merchants.map(merchant => {
      if (merchant.id === merchantId) {
        merchant.items.forEach(item => {
          if (item.id === itemId) {
            item.checked = checked
          }
        })
        // 检查商家是否全选
        merchant.checked = merchant.items.every(item => item.checked)
      }
      return merchant
    })

    this.setData({ merchants })
    this.updateCartItems()
    this.calculateTotal()
    this.checkAllSelected()
  },

  onQuantityChange(e: any) {
    const { merchantId, itemId } = e.currentTarget.dataset
    const quantity = e.detail.value
    const merchants = this.data.merchants.map(merchant => {
      if (merchant.id === merchantId) {
        merchant.items.forEach(item => {
          if (item.id === itemId) {
            item.quantity = quantity
          }
        })
      }
      return merchant
    })

    this.setData({ merchants })
    this.updateCartItems()
    this.calculateTotal()
  },

  onSelectAll(e: any) {
    const checked = e.detail.value
    const merchants = this.data.merchants.map(merchant => {
      merchant.checked = checked
      merchant.items.forEach(item => {
        item.checked = checked
      })
      return merchant
    })

    this.setData({ 
      merchants,
      allChecked: checked
    })
    this.updateCartItems()
    this.calculateTotal()
  },

  checkAllSelected() {
    const allItems = this.data.cartItems
    const checkedItems = allItems.filter(item => item.checked)
    const allChecked = allItems.length > 0 && checkedItems.length === allItems.length

    this.setData({ allChecked })
  },

  calculateTotal() {
    let totalPrice = 0
    let checkedCount = 0

    this.data.merchants.forEach(merchant => {
      merchant.items.forEach(item => {
        if (item.checked) {
          totalPrice += item.price * item.quantity
          checkedCount += item.quantity
        }
      })
    })

    this.setData({ 
      totalPrice: totalPrice.toFixed(2),
      checkedCount 
    })
  },

  addToCart(e: any) {
    const itemId = e.currentTarget.dataset.id
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    })
  },

  moveToFavorites() {
    wx.showToast({
      title: '已移入收藏',
      icon: 'success'
    })
  },

  deleteSelected() {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除选中的 ${this.data.checkedCount} 件商品吗？`,
      success: (res) => {
        if (res.confirm) {
          const merchants = this.data.merchants.map(merchant => {
            merchant.items = merchant.items.filter(item => !item.checked)
            merchant.checked = false
            return merchant
          }).filter(merchant => merchant.items.length > 0)

          this.setData({ 
            merchants,
            allChecked: false
          })
          this.updateCartItems()
          this.calculateTotal()

          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  },

  checkout() {
    if (this.data.checkedCount === 0) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      })
      return
    }

    // 收集选中的商品信息
    const selectedItems: any[] = []
    this.data.merchants.forEach(merchant => {
      const items = merchant.items.filter(item => item.checked)
      if (items.length > 0) {
        selectedItems.push({
          merchantId: merchant.id,
          merchantName: merchant.name,
          items
        })
      }
    })

    // 跳转到订单确认页面
    wx.navigateTo({
      url: `/pages/checkout/checkout?data=${encodeURIComponent(JSON.stringify(selectedItems))}`
    })
  },

  goToDetail(e: any) {
    const bookId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product-detail/product-detail?id=${bookId}`
    })
  },

  goShopping() {
    wx.switchTab({
      url: '/pages/home/home'
    })
  }
}) 