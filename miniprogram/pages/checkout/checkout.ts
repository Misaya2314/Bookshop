interface CheckoutItem {
  bookId: string;
  title: string;
  price: number;
  quantity: number;
  images?: string[];
}

interface MerchantData {
  merchantId: string;
  merchantName: string;
  items: CheckoutItem[];
  totalPrice: string;
}

interface AddressOption {
  id: string;
  name: string;
}

Page({
  data: {
    loading: true,
    submitting: false,
    canSubmit: false,
    
    // 订单数据
    merchants: [] as MerchantData[],
    totalPrice: '0.00',
    totalQuantity: 0,
    orderType: 'cart', // cart | direct
    
    // 用户信息
    userInfo: {} as any,
    deliveryAddress: '',
    
    // 备注
    remark: '',
    
    // 地址选择
    showAddressPicker: false,
    selectedAddressIndex: -1,
    addressList: [
      { id: '1', name: 'A校区一号宿舍楼下' },
      { id: '2', name: 'A校区图书馆门口' },
      { id: '3', name: 'A校区教学楼前' },
      { id: '4', name: 'B校区一号宿舍楼下' },
      { id: '5', name: 'B校区图书馆门口' },
      { id: '6', name: 'B校区教学楼前' },
      { id: '7', name: 'C校区一号宿舍楼下' },
      { id: '8', name: 'C校区图书馆门口' },
      { id: '9', name: 'C校区教学楼前' }
    ] as AddressOption[]
  },

  onLoad(options: any) {
    console.log('结算页面onLoad, options:', options)
    
    if (options.data) {
      try {
        const checkoutData = JSON.parse(decodeURIComponent(options.data))
        console.log('解析的结算数据:', checkoutData)
        this.processCheckoutData(checkoutData)
      } catch (error) {
        console.error('解析结算数据失败:', error)
        wx.showToast({
          title: '数据格式错误',
          icon: 'none'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    } else {
      wx.showToast({
        title: '缺少订单数据',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
    
    this.loadUserInfo()
  },

  // 处理结算数据
  processCheckoutData(data: any) {
    console.log('处理结算数据:', data)
    
    // 判断数据类型：购物车结算 或 立即购买
    if (Array.isArray(data)) {
      // 购物车结算数据格式
      this.processCartData(data)
    } else if (data.items) {
      // 立即购买数据格式
      this.processDirectBuyData(data)
    } else {
      console.error('未知的数据格式:', data)
      wx.showToast({
        title: '数据格式错误',
        icon: 'none'
      })
      return
    }
  },

  // 处理购物车结算数据
  processCartData(cartData: any[]) {
    console.log('处理购物车数据:', cartData)
    
    let totalPrice = 0
    let totalQuantity = 0
    
    const merchants = cartData.map((merchant: any) => {
      const merchantTotalPrice = merchant.items.reduce((sum: number, item: any) => {
        totalQuantity += item.quantity
        return sum + (item.price * item.quantity)
      }, 0)
      
      totalPrice += merchantTotalPrice
      
      return {
        merchantId: merchant.merchantId,
        merchantName: merchant.merchantName,
        items: merchant.items.map((item: any) => ({
          bookId: item.bookId || item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          images: item.images || ['📚']
        })),
        totalPrice: merchantTotalPrice.toFixed(2)
      }
    })

    this.setData({
      merchants,
      totalPrice: totalPrice.toFixed(2),
      totalQuantity,
      orderType: 'cart',
      loading: false
    })
    
    this.checkCanSubmit()
  },

  // 处理立即购买数据
  processDirectBuyData(directData: any) {
    console.log('处理立即购买数据:', directData)
    
    // 创建虚拟商家数据
    const merchants = [{
      merchantId: directData.items[0].seller?.id || 'unknown',
      merchantName: directData.items[0].seller?.name || '商家',
      items: directData.items.map((item: any) => ({
        bookId: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        images: ['📚']
      })),
      totalPrice: directData.totalPrice.toFixed(2)
    }]

    this.setData({
      merchants,
      totalPrice: directData.totalPrice.toFixed(2),
      totalQuantity: directData.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      orderType: 'direct',
      deliveryAddress: directData.address || '',
      loading: false
    })
    
    this.checkCanSubmit()
  },

  // 加载用户信息
  async loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
      
      // 如果用户有默认校区，设置为默认地址
      if (userInfo.campus && !this.data.deliveryAddress) {
        const defaultAddress = this.getDefaultAddressByCampus(userInfo.campus)
        if (defaultAddress) {
          this.setData({ 
            deliveryAddress: defaultAddress.name,
            selectedAddressIndex: this.data.addressList.findIndex(addr => addr.id === defaultAddress.id)
          })
          this.checkCanSubmit()
        }
      }
    }
  },

  // 根据校区获取默认地址
  getDefaultAddressByCampus(campus: string) {
    const campusMap: { [key: string]: string } = {
      'A校区': '1',
      'B校区': '4', 
      'C校区': '7'
    }
    
    const addressId = campusMap[campus]
    if (addressId) {
      return this.data.addressList.find(addr => addr.id === addressId)
    }
    
    return null
  },

  // 选择收货地址
  selectAddress() {
    this.setData({ showAddressPicker: true })
  },

  // 地址选择器可见性变化
  onAddressPickerChange(e: any) {
    this.setData({ showAddressPicker: e.detail.visible })
  },

  // 关闭地址选择器
  closeAddressPicker() {
    this.setData({ showAddressPicker: false })
  },

  // 选择地址选项
  selectAddressOption(e: any) {
    const index = e.currentTarget.dataset.index
    this.setData({ selectedAddressIndex: index })
  },

  // 确认地址选择
  confirmAddress() {
    if (this.data.selectedAddressIndex >= 0) {
      const selectedAddress = this.data.addressList[this.data.selectedAddressIndex]
      this.setData({ 
        deliveryAddress: selectedAddress.name,
        showAddressPicker: false 
      })
      this.checkCanSubmit()
    } else {
      wx.showToast({
        title: '请选择地址',
        icon: 'none'
      })
    }
  },

  // 备注变化
  onRemarkChange(e: any) {
    this.setData({ remark: e.detail.value })
  },

  // 选择优惠券
  selectCoupon() {
    wx.showToast({
      title: '暂无可用优惠券',
      icon: 'none'
    })
  },

  // 检查是否可以提交订单
  checkCanSubmit() {
    const canSubmit = this.data.deliveryAddress !== '' && 
                     this.data.merchants.length > 0 && 
                     !this.data.loading
    
    this.setData({ canSubmit })
  },

  // 提交订单
  async submitOrder() {
    if (!this.data.canSubmit) {
      return
    }

    if (!this.data.deliveryAddress) {
      wx.showToast({
        title: '请选择收货地址',
        icon: 'none'
      })
      return
    }

    // 检查用户手机号
    if (!this.data.userInfo.phone) {
      wx.showModal({
        title: '提示',
        content: '请先完善手机号信息',
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: '/pages/user-info/user-info'
          })
        }
      })
      return
    }

    this.setData({ submitting: true })

    try {
      // 准备订单数据
      const orderItems = []
      for (const merchant of this.data.merchants) {
        for (const item of merchant.items) {
          orderItems.push({
            bookId: item.bookId,
            title: item.title,
            price: item.price,
            quantity: item.quantity
          })
        }
      }

      // 调用云函数创建订单
      const result = await wx.cloud.callFunction({
        name: 'orders',
        data: {
          action: 'createOrder',
          items: orderItems,
          totalPrice: parseFloat(this.data.totalPrice),
          deliveryAddress: this.data.deliveryAddress,
          orderType: this.data.orderType,
          remark: this.data.remark
        }
      })

      const response = result.result as any
      console.log('创建订单结果:', response)

      if (response.code === 0) {
        wx.showToast({
          title: '订单创建成功',
          icon: 'success'
        })

        // 延迟跳转到支付页面或订单列表
        setTimeout(() => {
          if (response.data && response.data.length > 0) {
            // 如果只有一个订单，直接跳转到支付页面
            if (response.data.length === 1) {
              this.goToPayment(response.data[0]._id)
            } else {
              // 多个订单，跳转到订单列表
              wx.redirectTo({
                url: '/pages/orders/orders?type=pending'
              })
            }
          } else {
            wx.redirectTo({
              url: '/pages/orders/orders'
            })
          }
        }, 1500)
      } else {
        wx.showToast({
          title: response.message || '创建订单失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('提交订单失败:', error)
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 跳转到支付页面
  goToPayment(orderId: string) {
    // 显示支付确认弹窗
    wx.showModal({
      title: '确认支付',
      content: `支付金额：¥${this.data.totalPrice}`,
      confirmText: '立即支付',
      success: async (res) => {
        if (res.confirm) {
          await this.processPayment(orderId)
        } else {
          // 用户取消支付，跳转到待支付订单列表
          wx.redirectTo({
            url: '/pages/orders/orders?type=pending'
          })
        }
      }
    })
  },

  // 处理支付
  async processPayment(orderId: string) {
    wx.showLoading({ title: '准备支付...' })

    try {
      const result = await wx.cloud.callFunction({
        name: 'orders',
        data: {
          action: 'payOrder',
          orderId: orderId
        }
      })

      const response = result.result as any
      console.log('支付云函数返回:', response)
      
      if (response.code === 0) {
        wx.hideLoading()
        
        // 调用微信支付
        wx.requestPayment({
          timeStamp: response.data.timeStamp,
          nonceStr: response.data.nonceStr,
          package: response.data.package,
          signType: response.data.signType,
          paySign: response.data.paySign,
          success: (payRes) => {
            console.log('微信支付成功:', payRes)
            wx.showToast({
              title: '支付成功',
              icon: 'success'
            })
            
            setTimeout(() => {
              wx.redirectTo({
                url: '/pages/orders/orders?type=paid'
              })
            }, 1500)
          },
          fail: (payErr) => {
            console.error('微信支付失败:', payErr)
            if (payErr.errMsg.includes('cancel')) {
              wx.showToast({
                title: '支付已取消',
                icon: 'none'
              })
            } else {
              wx.showToast({
                title: '支付失败，请重试',
                icon: 'none'
              })
            }
            
            setTimeout(() => {
              wx.redirectTo({
                url: '/pages/orders/orders?type=pending'
              })
            }, 1500)
          }
        })
      } else {
        wx.hideLoading()
        wx.showToast({
          title: response.message || '支付失败',
          icon: 'none'
        })
        
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/orders/orders?type=pending'
          })
        }, 1500)
      }
    } catch (error) {
      console.error('支付失败:', error)
      wx.hideLoading()
      wx.showToast({
        title: '支付失败，请重试',
        icon: 'none'
      })
      
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/orders/orders?type=pending'
        })
      }, 1500)
    }
  }
}) 