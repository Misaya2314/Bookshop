Page({
  data: {
    isLoading: false,
    isAgreed: false
  },

  onLoad() {
    this.checkLoginStatus()
  },

  // 切换隐私政策同意状态
  toggleAgreement() {
    this.setData({
      isAgreed: !this.data.isAgreed
    })
  },

  // 兼容旧的方法名（如果其他地方有调用）
  onPrivacyAgreeChange(e: any) {
    this.setData({
      isAgreed: e.detail.checked
    })
  },

  async checkLoginStatus() {
    // 检查用户是否已经登录
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.openid) {
      // 验证登录状态是否有效
      try {
        const result = await wx.cloud.callFunction({
          name: 'login',
          data: {
            action: 'getUserInfo'
          }
        })

        if ((result.result as any).code === 0) {
          // 登录状态有效，跳转到首页
      wx.switchTab({
        url: '/pages/home/home'
      })
        } else {
          // 登录状态无效，清除本地存储
          wx.removeStorageSync('userInfo')
        }
      } catch (error) {
        console.error('检查登录状态失败:', error)
        wx.removeStorageSync('userInfo')
      }
    }
  },

  wxLogin() {
    // 检查是否已同意隐私政策
    if (!this.data.isAgreed) {
      wx.showToast({
        title: '请先同意用户协议和隐私政策',
        icon: 'none'
      })
      return
    }

    this.setData({ isLoading: true })

          // 获取用户信息
          wx.getUserProfile({
            desc: '用于完善用户资料',
            success: (userRes) => {
        this.handleCloudLogin(userRes.userInfo)
      },
      fail: () => {
        this.setData({ isLoading: false })
        wx.showToast({
          title: '需要授权才能使用',
          icon: 'none'
        })
      }
    })
  },

  async handleCloudLogin(userInfo: any) {
    try {
      // 调用云函数进行登录
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {
          action: 'login',
          userInfo: userInfo
        }
      })

      const response = result.result as any
      
      if (response.code === 0) {
        const { userInfo: cloudUserInfo, isFirstLogin } = response.data

      // 保存用户信息到本地存储
        wx.setStorageSync('userInfo', cloudUserInfo)

      this.setData({ isLoading: false })

      wx.showToast({
        title: '登录成功',
          icon: 'success'
        })

        // 根据是否首次登录决定跳转页面
          setTimeout(() => {
          if (isFirstLogin || !cloudUserInfo.phone || !cloudUserInfo.college) {
            // 首次登录或资料不完整，跳转到资料完善页面
            wx.navigateTo({
              url: '/pages/profile-setup/profile-setup'
            })
          } else {
            // 直接跳转到首页
            wx.switchTab({
              url: '/pages/home/home'
            })
          }
          }, 1000)
      } else {
        throw new Error(response.message || '登录失败')
        }
    } catch (error) {
      console.error('云函数登录失败:', error)
      this.setData({ isLoading: false })
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
    }
  },

  viewAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/agreement'
    })
  },

  viewPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    })
  }
}) 