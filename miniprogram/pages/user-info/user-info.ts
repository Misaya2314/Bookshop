import { getCurrentUser, checkLoginStatus } from '../../utils/auth'

Page({
  data: {
    isLoading: false,
    avatarUrl: '',
    userInfo: {
      nickName: '',
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
      '花溪校区',
      '两江校区'
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
    // 检查登录状态
    if (!checkLoginStatus({ redirectToLogin: true })) {
      return
    }
    this.loadUserInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    const currentUser = getCurrentUser()
    if (currentUser) {
      this.setData({
        avatarUrl: currentUser.avatarUrl || '',
        'userInfo.nickName': currentUser.nickName || '',
        'userInfo.phone': currentUser.phone || '',
        'userInfo.college': currentUser.college || '',
        'userInfo.major': currentUser.major || '',
        'userInfo.grade': currentUser.grade || '',
        'userInfo.campus': currentUser.campus || ''
      })
    }
  },

  // 选择头像
  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadAvatar(tempFilePath)
      },
      fail: (error) => {
        console.error('选择图片失败:', error)
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    })
  },

  // 从微信头像选择
  chooseWechatAvatar() {
    // 微信已经不再提供avatarUrl，提示用户使用自定义头像
    wx.showModal({
      title: '提示',
      content: '微信已不再提供头像获取服务，请选择从相册上传或拍照上传自定义头像',
      showCancel: false,
      confirmText: '知道了',
      success: () => {
        this.chooseAvatar()
      }
    })
  },

  // 上传头像到云存储
  async uploadAvatar(filePath: string) {
    wx.showLoading({
      title: '上传头像中...'
    })

    try {
      const currentUser = getCurrentUser()
      const oldAvatarUrl = this.data.avatarUrl
      const cloudPath = `avatars/${currentUser.openid}_${Date.now()}.jpg`
      
      // 上传新头像
      const result = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath
      })

      if (result.fileID) {
        // 删除旧头像（如果是云存储文件）
        if (oldAvatarUrl && oldAvatarUrl.startsWith('cloud://')) {
          try {
            await wx.cloud.deleteFile({
              fileList: [oldAvatarUrl]
            })
            console.log('旧头像已删除:', oldAvatarUrl)
          } catch (deleteError) {
            console.warn('删除旧头像失败:', deleteError)
          }
        }

        this.setData({
          avatarUrl: result.fileID
        })
        wx.showToast({
          title: '头像上传成功',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('上传头像失败:', error)
      wx.showToast({
        title: '上传头像失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 显示头像选择选项
  showAvatarOptions() {
    wx.showActionSheet({
      itemList: ['从相册选择', '拍照'],
      success: (res) => {
        this.chooseAvatar()
      }
    })
  },

  // 输入昵称
  onNickNameInput(e: any) {
    this.setData({
      'userInfo.nickName': e.detail.value
    })
  },

  // 输入手机号
  onPhoneInput(e: any) {
    this.setData({
      'userInfo.phone': e.detail.value
    })
  },

  // 选择学院
  onCollegeChange(e: any) {
    const index = e.detail.value
    this.setData({
      'userInfo.college': this.data.colleges[index]
    })
  },

  // 输入专业
  onMajorInput(e: any) {
    this.setData({
      'userInfo.major': e.detail.value
    })
  },

  // 选择年级
  onGradeChange(e: any) {
    const index = e.detail.value
    this.setData({
      'userInfo.grade': this.data.grades[index]
    })
  },

  // 选择校区
  onCampusChange(e: any) {
    const index = e.detail.value
    this.setData({
      'userInfo.campus': this.data.campuses[index]
    })
  },

  // 表单验证
  validateForm() {
    const { nickName, phone, college, major, grade, campus } = this.data.userInfo
    
    if (!nickName.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return false
    }

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

    if (!major.trim()) {
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

  // 保存用户信息
  async saveUserInfo() {
    if (!this.validateForm()) {
      return
    }

    this.setData({ isLoading: true })

    try {
      // 准备更新的数据
      const updateData = {
        ...this.data.userInfo,
        avatarUrl: this.data.avatarUrl
      }

      // 调用云函数更新用户信息
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {
          action: 'updateProfile',
          userInfo: updateData
        }
      })

      const response = result.result as any

      if (response.code === 0) {
        // 更新本地存储的用户信息
        const currentUser = getCurrentUser()
        const updatedUser = {
          ...currentUser,
          ...updateData
        }
        wx.setStorageSync('userInfo', updatedUser)

        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })

        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        throw new Error(response.message || '保存失败')
      }
    } catch (error) {
      console.error('保存用户信息失败:', error)
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  // 重置信息
  resetInfo() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置所有信息吗？',
      success: (res) => {
        if (res.confirm) {
          this.loadUserInfo()
          wx.showToast({
            title: '已重置',
            icon: 'success'
          })
        }
      }
    })
  }
}) 