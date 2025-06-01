Page({
  data: {
    submitting: false,
    agreedToTerms: false,
    canSubmit: false,
    formData: {
      realName: '',
      studentId: '',
      college: '',
      major: '',
      phone: '',
      shopName: '',
      category: '',
      bookCount: '',
      studentCardImage: '',
      idCardImage: '',
      description: ''
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
    categories: [
      '计算机类',
      '医学类',
      '工程技术类',
      '经济管理类',
      '文学语言类',
      '法律政治类',
      '理学类',
      '艺术设计类',
      '教育类',
      '其他类别'
    ]
  },

  onLoad() {
    this.checkCanSubmit()
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { formData, agreedToTerms } = this.data
    const requiredFields = [
      'realName', 'studentId', 'college', 'major', 'phone',
      'shopName', 'category', 'studentCardImage', 'idCardImage'
    ] as (keyof typeof formData)[]
    
    const isFormComplete = requiredFields.every(field => formData[field])
    const canSubmit = isFormComplete && agreedToTerms
    
    this.setData({ canSubmit })
  },

  // 输入姓名
  inputName() {
    wx.showModal({
      title: '请输入真实姓名',
      editable: true,
      placeholderText: '请输入姓名',
      success: (res) => {
        if (res.confirm && res.content) {
          this.setData({
            'formData.realName': res.content
          })
          this.checkCanSubmit()
        }
      }
    })
  },

  // 输入学号
  inputStudentId() {
    wx.showModal({
      title: '请输入学号',
      editable: true,
      placeholderText: '请输入学号',
      success: (res) => {
        if (res.confirm && res.content) {
          this.setData({
            'formData.studentId': res.content
          })
          this.checkCanSubmit()
        }
      }
    })
  },

  // 选择学院
  selectCollege() {
    wx.showActionSheet({
      itemList: this.data.colleges,
      success: (res) => {
        this.setData({
          'formData.college': this.data.colleges[res.tapIndex]
        })
        this.checkCanSubmit()
      }
    })
  },

  // 选择专业
  selectMajor() {
    wx.showModal({
      title: '请输入年级专业',
      editable: true,
      placeholderText: '如：2021级软件工程',
      success: (res) => {
        if (res.confirm && res.content) {
          this.setData({
            'formData.major': res.content
          })
          this.checkCanSubmit()
        }
      }
    })
  },

  // 输入手机号
  inputPhone() {
    wx.showModal({
      title: '请输入手机号',
      editable: true,
      placeholderText: '请输入11位手机号',
      success: (res) => {
        if (res.confirm && res.content) {
          // 验证手机号格式
          const phoneRegex = /^1[3-9]\d{9}$/
          if (phoneRegex.test(res.content)) {
            this.setData({
              'formData.phone': res.content
            })
            this.checkCanSubmit()
          } else {
            wx.showToast({
              title: '手机号格式不正确',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 输入店铺名称
  inputShopName() {
    wx.showModal({
      title: '请输入店铺名称',
      editable: true,
      placeholderText: '2-20个字符',
      success: (res) => {
        if (res.confirm && res.content) {
          if (res.content.length >= 2 && res.content.length <= 20) {
            this.setData({
              'formData.shopName': res.content
            })
            this.checkCanSubmit()
          } else {
            wx.showToast({
              title: '店铺名称长度应为2-20个字符',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 选择经营类别
  selectCategory() {
    wx.showActionSheet({
      itemList: this.data.categories,
      success: (res) => {
        this.setData({
          'formData.category': this.data.categories[res.tapIndex]
        })
        this.checkCanSubmit()
      }
    })
  },

  // 输入书籍数量
  inputBookCount() {
    wx.showModal({
      title: '预计上架书籍数量',
      editable: true,
      placeholderText: '请输入数量',
      success: (res) => {
        if (res.confirm && res.content) {
          const count = parseInt(res.content)
          if (count > 0) {
            this.setData({
              'formData.bookCount': res.content + '本'
            })
            this.checkCanSubmit()
          } else {
            wx.showToast({
              title: '请输入有效数量',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 上传学生证
  uploadStudentCard() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          'formData.studentCardImage': res.tempFilePaths[0]
        })
        this.checkCanSubmit()
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        })
      }
    })
  },

  // 上传身份证
  uploadIdCard() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          'formData.idCardImage': res.tempFilePaths[0]
        })
        this.checkCanSubmit()
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        })
      }
    })
  },

  // 输入描述
  onDescInput(e: any) {
    this.setData({
      'formData.description': e.detail.value
    })
  },

  // 切换协议同意状态
  toggleAgreement() {
    this.setData({
      agreedToTerms: !this.data.agreedToTerms
    })
    this.checkCanSubmit()
  },

  // 查看商家协议
  viewMerchantAgreement() {
    wx.navigateTo({
      url: '/pages/merchant-agreement/merchant-agreement'
    })
  },

  // 查看隐私政策
  viewPrivacyPolicy() {
    wx.navigateTo({
      url: '/pages/privacy-policy/privacy-policy'
    })
  },

  // 提交申请
  submitApplication() {
    if (!this.data.canSubmit) {
      wx.showToast({
        title: '请完善必填信息',
        icon: 'none'
      })
      return
    }

    this.setData({ submitting: true })

    // 模拟提交过程
    setTimeout(() => {
      this.setData({ submitting: false })
      
      wx.showModal({
        title: '申请提交成功',
        content: '您的商家申请已提交成功，我们会在1-3个工作日内进行审核，请耐心等待。',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
    }, 2000)
  }
}) 