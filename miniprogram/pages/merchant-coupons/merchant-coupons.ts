import { checkLoginStatus, isMerchant } from '../../utils/auth'
import { formatRelativeTime } from '../../utils/util'

Page({
  data: {
    loading: true,
    coupons: [] as any[],
    statistics: {
      totalCoupons: 0,
      totalUsage: 0,
      activeCoupons: 0
    },
    // 模态框状态
    showModal: false,
    editingCoupon: null as any,
    form: {
      code: '',
      discount: '',
      description: ''
    },
    saving: false,
    // 删除确认对话框
    showDeleteDialog: false,
    deletingCouponId: ''
  },

  async onLoad() {
    // 权限验证
    if (!checkLoginStatus()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/profile/profile' })
      }, 1500)
      return
    }

    if (!isMerchant()) {
      wx.showToast({
        title: '您不是商家用户',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    await this.loadCoupons()
    await this.loadStatistics()
    this.setData({ loading: false })
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (!this.data.loading) {
      this.loadCoupons()
      this.loadStatistics()
    }
  },

  // 加载优惠券列表
  async loadCoupons() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'coupons',
        data: {
          action: 'getCoupons',
          data: {
            page: 1,
            pageSize: 50,
            status: 'active'
          }
        }
      })

      if (result.result && (result.result as any).success) {
        const coupons = (result.result as any).data.map((coupon: any) => ({
          ...coupon,
          discountText: this.formatDiscount(coupon.discount),
          createTimeText: formatRelativeTime(coupon.createTime)
        }))
        
        this.setData({ coupons })
      } else {
        wx.showToast({
          title: (result.result as any)?.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载优惠券失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 加载统计数据
  async loadStatistics() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'coupons',
        data: {
          action: 'getCouponStats'
        }
      })

      if (result.result && (result.result as any).success) {
        const stats = (result.result as any).data
        this.setData({
          statistics: {
            totalCoupons: stats.totalCoupons,
            totalUsage: stats.totalUsage,
            activeCoupons: stats.totalCoupons
          }
        })
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  },

  // 格式化折扣显示
  formatDiscount(discount: number): string {
    const percentage = Math.round(discount * 10)
    return `${percentage}折`
  },


  // 显示创建/编辑模态框
  showCreateModal() {
    this.setData({
      showModal: true,
      editingCoupon: null,
      form: {
        code: '',
        discount: '',
        description: ''
      }
    })
  },

  // 编辑优惠券
  editCoupon(e: any) {
    const couponId = e.currentTarget.dataset.id
    const coupon = this.data.coupons.find(c => c._id === couponId)
    
    if (coupon) {
      this.setData({
        showModal: true,
        editingCoupon: coupon,
        form: {
          code: coupon.code,
          discount: coupon.discount.toString(),
          description: coupon.description || ''
        }
      })
    }
  },

  // 隐藏模态框
  hideModal() {
    this.setData({ showModal: false })
  },

  // 模态框显示状态变化
  onModalVisibleChange(e: any) {
    this.setData({ showModal: e.detail.visible })
  },

  // 表单输入处理
  onCodeChange(e: any) {
    this.setData({
      'form.code': e.detail.value.toUpperCase()
    })
  },

  onDiscountChange(e: any) {
    this.setData({
      'form.discount': e.detail.value
    })
  },

  onDescriptionChange(e: any) {
    this.setData({
      'form.description': e.detail.value
    })
  },

  // 保存优惠券
  async saveCoupon() {
    const { form, editingCoupon } = this.data
    
    // 表单验证
    if (!form.code.trim()) {
      wx.showToast({
        title: '请输入优惠券代码',
        icon: 'none'
      })
      return
    }

    if (!form.discount.trim()) {
      wx.showToast({
        title: '请输入折扣力度',
        icon: 'none'
      })
      return
    }

    const discount = parseFloat(form.discount)
    if (isNaN(discount) || discount < 0.1 || discount > 1) {
      wx.showToast({
        title: '折扣力度必须在0.1-1之间',
        icon: 'none'
      })
      return
    }

    this.setData({ saving: true })

    try {
      const action = editingCoupon ? 'updateCoupon' : 'createCoupon'
      const requestData: any = {
        code: form.code.trim(),
        discount: discount,
        description: form.description.trim()
      }

      if (editingCoupon) {
        requestData.couponId = editingCoupon._id
      }

      const result = await wx.cloud.callFunction({
        name: 'coupons',
        data: {
          action: action,
          data: requestData
        }
      })

      if (result.result && (result.result as any).success) {
        wx.showToast({
          title: editingCoupon ? '更新成功' : '创建成功',
          icon: 'success'
        })
        
        this.hideModal()
        await this.loadCoupons()
        await this.loadStatistics()
      } else {
        wx.showToast({
          title: (result.result as any)?.message || '操作失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('保存优惠券失败:', error)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    } finally {
      this.setData({ saving: false })
    }
  },

  // 删除优惠券
  deleteCoupon(e: any) {
    const couponId = e.currentTarget.dataset.id
    this.setData({
      showDeleteDialog: true,
      deletingCouponId: couponId
    })
  },

  // 确认删除
  async confirmDelete() {
    const { deletingCouponId } = this.data
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'coupons',
        data: {
          action: 'deleteCoupon',
          data: {
            couponId: deletingCouponId
          }
        }
      })

      if (result.result && (result.result as any).success) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
        
        await this.loadCoupons()
        await this.loadStatistics()
      } else {
        wx.showToast({
          title: (result.result as any)?.message || '删除失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('删除优惠券失败:', error)
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      })
    } finally {
      this.setData({ 
        showDeleteDialog: false,
        deletingCouponId: ''
      })
    }
  },

  // 取消删除
  cancelDelete() {
    this.setData({ 
      showDeleteDialog: false,
      deletingCouponId: ''
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  }
})
