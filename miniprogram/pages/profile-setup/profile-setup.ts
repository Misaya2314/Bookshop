Page({
  data: {
    isLoading: false,
    formData: {
      phone: '',
      college: '',
      major: '',
      grade: '',
      campus: ''
    },
    colleges: [
      '计算机学院',
      '电子信息学院', 
      '机械工程学院',
      '化学化工学院',
      '材料科学与工程学院',
      '生命科学学院',
      '医学院',
      '管理学院',
      '经济学院',
      '外国语学院',
      '文学院',
      '法学院',
      '教育学院',
      '体育学院',
      '艺术学院',
      '数学学院',
      '物理学院'
    ],
    campuses: [
      'A校区（主校区）',
      'B校区（东校区）',
      'C校区（南校区）'
    ],
    grades: [
      '大一',
      '大二',
      '大三',
      '大四',
      '研一',
      '研二',
      '研三',
      '博士'
    ]
  },

  onLoad() {
    // 获取当前用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    // 预填充已有信息
    this.setData({
      'formData.phone': userInfo.phone || '',
      'formData.college': userInfo.college || '',
      'formData.major': userInfo.major || '',
      'formData.grade': userInfo.grade || '',
      'formData.campus': userInfo.campus || ''
    })
  },

  // 输入手机号
  onPhoneInput(e: any) {
    this.setData({
      'formData.phone': e.detail.value
    })
  },

  // 选择学院
  onCollegeChange(e: any) {
    const index = e.detail.value
    this.setData({
      'formData.college': this.data.colleges[index]
    })
  },

  // 输入专业
  onMajorInput(e: any) {
    this.setData({
      'formData.major': e.detail.value
    })
  },

  // 选择年级
  onGradeChange(e: any) {
    const index = e.detail.value
    this.setData({
      'formData.grade': this.data.grades[index]
    })
  },

  // 选择校区
  onCampusChange(e: any) {
    const index = e.detail.value
    this.setData({
      'formData.campus': this.data.campuses[index]
    })
  },

  // 表单验证
  validateForm() {
    const { phone, college, major, grade, campus } = this.data.formData
    
    if (!phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return false
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      })
      return false
    }

    if (!college) {
      wx.showToast({
        title: '请选择所在学院',
        icon: 'none'
      })
      return false
    }

    if (!major) {
      wx.showToast({
        title: '请输入专业',
        icon: 'none'
      })
      return false
    }

    if (!grade) {
      wx.showToast({
        title: '请选择年级',
        icon: 'none'
      })
      return false
    }

    if (!campus) {
      wx.showToast({
        title: '请选择校区',
        icon: 'none'
      })
      return false
    }

    return true
  },

  // 提交表单
  async submitForm() {
    if (!this.validateForm()) {
      return
    }

    this.setData({ isLoading: true })

    try {
      // 调用云函数更新用户资料
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {
          action: 'updateProfile',
          userInfo: this.data.formData
        }
      })

      const response = result.result as any

      if (response.code === 0) {
        // 更新本地存储的用户信息
        const userInfo = wx.getStorageSync('userInfo')
        const updatedUserInfo = {
          ...userInfo,
          ...this.data.formData,
          isFirstLogin: false
        }
        wx.setStorageSync('userInfo', updatedUserInfo)

        wx.showToast({
          title: '资料完善成功',
          icon: 'success'
        })

        // 跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/home/home'
          })
        }, 1500)
      } else {
        throw new Error(response.message || '更新失败')
      }
    } catch (error) {
      console.error('更新用户资料失败:', error)
      wx.showToast({
        title: '更新失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  // 跳过完善资料（暂时使用，后续可以在其他地方提醒完善）
  skipSetup() {
    wx.showModal({
      title: '提示',
      content: '跳过资料完善可能影响您的使用体验，确定要跳过吗？',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/home/home'
          })
        }
      }
    })
  }
}) 