// 购物车数据类型定义
interface CartItem {
  id: string;
  bookId: string;
  title: string;
  price: number;
  originalPrice?: number;
  images?: string[];
  quantity: number;
  stock: number;
  checked: boolean;
  createTime?: Date;
}

interface Merchant {
  id: string;
  name: string;
  checked: boolean;
  items: CartItem[];
}



Page({
  data: {
    isEditing: false,
    allChecked: false,
    totalPrice: '0.00',
    checkedCount: 0,
    cartItems: [] as CartItem[],
    merchants: [] as Merchant[],
    loading: true
  },

  onLoad() {
    this.checkLoginStatus()
    this.loadCartData()
  },

  onShow() {
    this.checkLoginStatus()
    this.loadCartData() // 每次显示都重新加载购物车数据
    
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      })
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.openid) {
      wx.showModal({
        title: '需要登录',
        content: '请先登录后再使用购物车功能',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/profile/profile'
          })
        }
      })
    }
  },

  // 加载购物车数据
  async loadCartData() {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.openid) {
      this.setData({ loading: false })
      return
    }

    this.setData({ loading: true })

    try {
      const result = await wx.cloud.callFunction({
        name: 'cart',
        data: {
          action: 'getCart'
        }
      })

      const response = result.result as any
      console.log('购物车数据:', response)

      if (response.code === 0) {
        // 处理数据，确保商家选中状态正确
        let merchants = (response.data || []).map((merchant: Merchant) => {
          console.log('处理商家数据:', merchant.name, '商品数量:', merchant.items.length)
          merchant.items.forEach((item: CartItem) => {
            console.log('商品数据:', item.title, '选中状态:', item.checked, 'type:', typeof item.checked, '价格:', item.price)
          })
          // 根据商品选中状态计算商家选中状态
          merchant.checked = merchant.items.length > 0 && merchant.items.every((item: CartItem) => item.checked === true)
          console.log('商家选中状态:', merchant.name, merchant.checked)
          return merchant
        })
        
        // 清理数据，确保所有checked值都是boolean
        merchants = this.cleanupDataCheckedValues(merchants)
        console.log('清理后的商家数据:', merchants)
        
        this.setData({ 
          merchants: merchants,
          loading: false
        })
        this.updateCartItems()
        this.calculateTotal()
        this.checkAllSelected()
      } else {
        console.error('获取购物车失败:', response)
        this.setData({ loading: false })
        if (response.message !== '获取失败') { // 避免网络错误时显示过多toast
          wx.showToast({
            title: response.message || '加载失败',
            icon: 'none'
          })
        }
      }
    } catch (error) {
      console.error('加载购物车数据失败:', error)
      this.setData({ loading: false })
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    }
  },

  // 数据清理函数，确保checked值都是boolean
  cleanupDataCheckedValues(merchants: Merchant[]): Merchant[] {
    return merchants.map((merchant: Merchant) => {
      merchant.checked = Boolean(merchant.checked)
      merchant.items = merchant.items.map((item: CartItem) => {
        item.checked = Boolean(item.checked)
        return item
      })
      return merchant
    })
  },

  updateCartItems() {
    const cartItems: CartItem[] = []
    this.data.merchants.forEach((merchant: Merchant) => {
      cartItems.push(...merchant.items)
    })
    console.log('更新购物车商品列表，总数量:', cartItems.length)
    this.setData({ cartItems })
  },

  toggleEdit() {
    this.setData({
      isEditing: !this.data.isEditing
    })
  },

  async onMerchantCheck(e: any) {
    const merchantId = e.currentTarget.dataset.id
    console.log('完整事件对象:', e)
    console.log('e.detail:', e.detail)
    console.log('e.detail.value:', e.detail.value)
    console.log('e.detail.checked:', e.detail.checked)
    
    // 修复TDesign checkbox事件值问题 - 尝试多种可能的事件格式
    let checked = e.detail.value
    if (checked === undefined || checked === null) {
      checked = e.detail.checked
    }
    if (checked === undefined || checked === null) {
      checked = e.detail
    }
    if (checked === undefined || checked === null) {
      // 如果获取不到值，则根据当前状态取反
      const currentMerchant = this.data.merchants.find((m: Merchant) => m.id === merchantId)
      checked = currentMerchant ? !currentMerchant.checked : true
    }
    // 确保checked是boolean类型
    checked = Boolean(checked)
    console.log('商家选中状态改变:', merchantId, 'checked:', checked, 'type:', typeof checked)
    
    // 先更新本地状态
    const merchants = this.data.merchants.map((merchant: Merchant) => {
      if (merchant.id === merchantId) {
        merchant.checked = checked
        merchant.items.forEach((item: CartItem) => {
          console.log('更新商家商品:', item.title, '到选中状态:', checked)
          item.checked = checked
        })
      }
      return merchant
    })

    // 清理数据确保checked值都是boolean
    const cleanedMerchants = this.cleanupDataCheckedValues(merchants)
    this.setData({ merchants: cleanedMerchants })
    this.updateCartItems()
    this.calculateTotal()
    this.checkAllSelected()

    // 批量更新云端商品选中状态
    try {
      const selectedMerchant = merchants.find((m: Merchant) => m.id === merchantId)
      if (selectedMerchant) {
        const updatePromises = selectedMerchant.items.map((item: CartItem) => 
          wx.cloud.callFunction({
            name: 'cart',
            data: {
              action: 'updateCartItem',
              itemId: item.id,
              checked: checked
            }
          })
        )
        await Promise.all(updatePromises)
        console.log('商家商品云端状态更新完成:', merchantId)
      }
    } catch (error) {
      console.error('更新商家选中状态失败:', error)
    }
  },

  async onItemCheck(e: any) {
    const { merchantId, itemId } = e.currentTarget.dataset
    console.log('商品完整事件对象:', e)
    console.log('商品e.detail:', e.detail)
    console.log('商品e.detail.value:', e.detail.value)
    console.log('商品e.detail.checked:', e.detail.checked)
    
    // 修复TDesign checkbox事件值问题 - 尝试多种可能的事件格式
    let checked = e.detail.value
    if (checked === undefined || checked === null) {
      checked = e.detail.checked
    }
    if (checked === undefined || checked === null) {
      checked = e.detail
    }
    if (checked === undefined || checked === null) {
      // 如果获取不到值，则根据当前状态取反
      let currentItem: CartItem | undefined
      this.data.merchants.forEach((merchant: Merchant) => {
        if (merchant.id === merchantId) {
          currentItem = merchant.items.find((item: CartItem) => item.id === itemId)
        }
      })
      checked = currentItem ? !currentItem.checked : true
    }
    // 确保checked是boolean类型
    checked = Boolean(checked)
    console.log('单个商品选中状态改变:', itemId, 'checked:', checked, 'type:', typeof checked)
    
    // 先更新本地状态
    const merchants = this.data.merchants.map((merchant: Merchant) => {
      if (merchant.id === merchantId) {
        merchant.items.forEach((item: CartItem) => {
          if (item.id === itemId) {
            console.log('更新商品:', item.title, '从', item.checked, '到', checked)
            item.checked = checked
          }
        })
        // 检查商家是否全选（只有当所有商品都被选中时，商家才被选中）
        merchant.checked = merchant.items.length > 0 && merchant.items.every((item: CartItem) => item.checked === true)
        console.log('商家选中状态:', merchant.name, merchant.checked)
      }
      return merchant
    })

    // 清理数据确保checked值都是boolean
    const cleanedMerchants = this.cleanupDataCheckedValues(merchants)
    this.setData({ merchants: cleanedMerchants })
    this.updateCartItems()
    this.calculateTotal()
    this.checkAllSelected()

    // 更新云端商品选中状态
    try {
      await wx.cloud.callFunction({
        name: 'cart',
        data: {
          action: 'updateCartItem',
          itemId: itemId,
          checked: checked
        }
      })
      console.log('云端商品状态更新完成:', itemId, checked)
    } catch (error) {
      console.error('更新商品选中状态失败:', error)
    }
  },

  async onQuantityChange(e: any) {
    const { merchantId, itemId } = e.currentTarget.dataset
    const quantity = e.detail.value
    
    if (quantity <= 0) {
      wx.showToast({
        title: '数量必须大于0',
        icon: 'none'
      })
      return
    }

    // 先更新本地状态
    const merchants = this.data.merchants.map((merchant: Merchant) => {
      if (merchant.id === merchantId) {
        merchant.items.forEach((item: CartItem) => {
          if (item.id === itemId) {
            if (quantity > item.stock) {
              wx.showToast({
                title: '库存不足',
                icon: 'none'
              })
              return
            }
            item.quantity = quantity
          }
        })
      }
      return merchant
    })

    // 清理数据确保checked值都是boolean
    const cleanedMerchants = this.cleanupDataCheckedValues(merchants)
    this.setData({ merchants: cleanedMerchants })
    this.updateCartItems()
    this.calculateTotal()

    // 更新云端商品数量
    try {
      const result = await wx.cloud.callFunction({
        name: 'cart',
        data: {
          action: 'updateCartItem',
          itemId: itemId,
          quantity: quantity
        }
      })

      const response = result.result as any
      if (response.code !== 0) {
        wx.showToast({
          title: response.message || '更新失败',
          icon: 'none'
        })
        // 重新加载购物车数据
        this.loadCartData()
      }
    } catch (error) {
      console.error('更新商品数量失败:', error)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
      // 重新加载购物车数据
      this.loadCartData()
    }
  },

  async onSelectAll(e: any) {
    console.log('全选完整事件对象:', e)
    console.log('全选e.detail:', e.detail)
    console.log('全选e.detail.value:', e.detail.value)
    console.log('全选e.detail.checked:', e.detail.checked)
    
    // 修复TDesign checkbox事件值问题 - 尝试多种可能的事件格式
    let checked = e.detail.value
    if (checked === undefined || checked === null) {
      checked = e.detail.checked
    }
    if (checked === undefined || checked === null) {
      checked = e.detail
    }
    if (checked === undefined || checked === null) {
      // 如果获取不到值，则根据当前全选状态取反
      checked = !this.data.allChecked
    }
    // 确保checked是boolean类型
    checked = Boolean(checked)
    console.log('全选状态改变:', checked, 'type:', typeof checked)
    
    // 先更新本地状态
    const merchants = this.data.merchants.map((merchant: Merchant) => {
      merchant.checked = checked
      merchant.items.forEach((item: CartItem) => {
        console.log('更新商品选中状态:', item.title, 'checked:', checked)
        item.checked = checked
      })
      return merchant
    })

    console.log('更新后的商家数据:', merchants)

    // 清理数据确保checked值都是boolean
    const cleanedMerchants = this.cleanupDataCheckedValues(merchants)
    this.setData({ 
      merchants: cleanedMerchants,
      allChecked: Boolean(checked)
    })
    this.updateCartItems()
    this.calculateTotal()

    // 批量更新云端所有商品选中状态
    try {
      const updatePromises: Promise<any>[] = []
      merchants.forEach((merchant: Merchant) => {
        merchant.items.forEach((item: CartItem) => {
          updatePromises.push(
            wx.cloud.callFunction({
              name: 'cart',
              data: {
                action: 'updateCartItem',
                itemId: item.id,
                checked: checked
              }
            })
          )
        })
      })
      await Promise.all(updatePromises)
      console.log('云端状态更新完成')
    } catch (error) {
      console.error('批量更新选中状态失败:', error)
    }
  },

  checkAllSelected() {
    const allItems = this.data.cartItems
    if (!allItems || allItems.length === 0) {
      this.setData({ allChecked: false })
      return
    }
    
    const checkedItems = allItems.filter((item: CartItem) => item.checked === true)
    const allChecked = checkedItems.length === allItems.length
    
    console.log('检查全选状态:', { 
      allItemsLength: allItems.length, 
      checkedItemsLength: checkedItems.length, 
      allChecked 
    })

    this.setData({ allChecked: allChecked })
  },

  calculateTotal() {
    let totalPrice = 0
    let checkedCount = 0

    console.log('开始计算总价，商家数量:', this.data.merchants.length)

    this.data.merchants.forEach((merchant: Merchant) => {
      console.log('商家:', merchant.name, '商品数量:', merchant.items.length)
      merchant.items.forEach((item: CartItem) => {
        console.log('商品:', item.title, '选中状态:', item.checked, 'type:', typeof item.checked, '价格:', item.price, '数量:', item.quantity)
        // 确保checked是真正的boolean值
        if (item.checked === true) {
          totalPrice += item.price * item.quantity
          checkedCount += item.quantity
          console.log('添加到总价:', item.title, item.price * item.quantity)
        }
      })
    })

    console.log('计算结果 - 总价:', totalPrice, '选中数量:', checkedCount)

    this.setData({ 
      totalPrice: totalPrice.toFixed(2),
      checkedCount 
    })
  },



  // 删除单个商品
  async removeItem(e: any) {
    const { merchantId, itemId } = e.currentTarget.dataset
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这件商品吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          
          try {
            const result = await wx.cloud.callFunction({
              name: 'cart',
              data: {
                action: 'removeCartItem',
                itemId: itemId
              }
            })

            const response = result.result as any
            if (response.code === 0) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              // 重新加载购物车数据
              this.loadCartData()
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
        }
      }
    })
  },

  moveToFavorites() {
    wx.showToast({
      title: '已移入收藏',
      icon: 'success'
    })
  },

  deleteSelected() {
    if (this.data.checkedCount === 0) {
      wx.showToast({
        title: '请选择要删除的商品',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除选中的 ${this.data.checkedCount} 件商品吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          
          try {
            const result = await wx.cloud.callFunction({
              name: 'cart',
              data: {
                action: 'removeSelected'
              }
            })

            const response = result.result as any
            if (response.code === 0) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              // 重新加载购物车数据
              this.loadCartData()
            } else {
              wx.showToast({
                title: response.message || '删除失败',
                icon: 'none'
              })
            }
          } catch (error) {
            console.error('删除选中商品失败:', error)
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
    this.data.merchants.forEach((merchant: Merchant) => {
      const items = merchant.items.filter((item: CartItem) => item.checked === true)
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