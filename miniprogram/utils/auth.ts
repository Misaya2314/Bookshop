/**
 * 用户认证工具函数
 */

// 检查本地登录状态
export function isUserLoggedIn(): boolean {
  const userInfo = wx.getStorageSync('userInfo')
  return !!(userInfo && userInfo.openid)
}

// 获取当前用户信息
export function getCurrentUser(): any {
  return wx.getStorageSync('userInfo')
}

// 检查登录状态并处理未登录情况
export function checkLoginStatus(options: {
  redirectToLogin?: boolean,
  showModal?: boolean,
  modalTitle?: string,
  modalContent?: string
} = {}): boolean {
  const {
    redirectToLogin = false,
    showModal = false,
    modalTitle = '需要登录',
    modalContent = '请先登录后再使用此功能'
  } = options

  if (!isUserLoggedIn()) {
    if (showModal) {
      wx.showModal({
        title: modalTitle,
        content: modalContent,
        showCancel: false,
        success: () => {
          if (redirectToLogin) {
            wx.navigateTo({
              url: '/pages/login/login'
            })
          }
        }
      })
    } else if (redirectToLogin) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }
    return false
  }
  return true
}

// 验证云端登录状态
export async function verifyCloudLoginStatus(): Promise<boolean> {
  if (!isUserLoggedIn()) {
    return false
  }

  try {
    const result = await wx.cloud.callFunction({
      name: 'login',
      data: {
        action: 'getUserInfo'
      }
    })

    if (result.result.code === 0) {
      return true
    } else {
      // 登录状态无效，清除本地存储
      wx.removeStorageSync('userInfo')
      return false
    }
  } catch (error) {
    console.error('验证云端登录状态失败:', error)
    // 网络错误时暂时认为登录有效
    return true
  }
}

// 退出登录
export function logout(): void {
  wx.removeStorageSync('userInfo')
  wx.showToast({
    title: '已退出登录',
    icon: 'success'
  })
  
  // 跳转到登录页
  setTimeout(() => {
    wx.redirectTo({
      url: '/pages/login/login'
    })
  }, 1000)
}

// 检查用户是否为商家
export function isMerchant(): boolean {
  const userInfo = getCurrentUser()
  return !!(userInfo && userInfo.isMerchant)
}

// 检查商家状态
export function getMerchantStatus(): string {
  const userInfo = getCurrentUser()
  return userInfo?.merchantStatus || ''
} 