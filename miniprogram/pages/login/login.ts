Page({
  data: {
    isLoading: false
  },

  onLoad() {
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    // 检查用户是否已经登录
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.openid) {
      // 已登录，跳转到首页
      wx.switchTab({
        url: '/pages/home/home'
      })
    }
  },

  wxLogin() {
    this.setData({ isLoading: true })

    wx.login({
      success: (res) => {
        if (res.code) {
          // 获取用户信息
          wx.getUserProfile({
            desc: '用于完善用户资料',
            success: (userRes) => {
              this.loginWithCode(res.code, userRes.userInfo)
            },
            fail: () => {
              this.setData({ isLoading: false })
              wx.showToast({
                title: '登录已取消',
                icon: 'none'
              })
            }
          })
        } else {
          this.setData({ isLoading: false })
          wx.showToast({
            title: '登录失败',
            icon: 'error'
          })
        }
      },
      fail: () => {
        this.setData({ isLoading: false })
        wx.showToast({
          title: '登录失败',
          icon: 'error'
        })
      }
    })
  },

  loginWithCode(code: string, userInfo: any) {
    // 这里应该调用云函数或API接口进行登录
    // 目前使用模拟登录
    setTimeout(() => {
      const mockUserInfo = {
        openid: 'mock_openid_' + Date.now(),
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        name: '张同学',
        college: '计算机学院',
        grade: '大三',
        phone: '138****5678',
        isMerchant: false
      }

      // 保存用户信息到本地存储
      wx.setStorageSync('userInfo', mockUserInfo)

      this.setData({ isLoading: false })

      wx.showToast({
        title: '登录成功',
        icon: 'success',
        success: () => {
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/home/home'
            })
          }, 1000)
        }
      })
    }, 2000)
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