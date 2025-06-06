/**
 * 微信小程序 API 类型扩展
 */

declare namespace WechatMiniprogram {
  interface ShowModalSuccessCallbackResult {
    /** 用户输入的内容 */
    content?: string
  }

  interface ShowToastOption {
    /** 图标类型 */
    icon?: 'success' | 'loading' | 'none' | 'error'
  }

  interface Wx {
    /** 获取用户信息 */
    getUserProfile(option: {
      desc: string
      success?: (result: {
        userInfo: any
      }) => void
      fail?: () => void
      complete?: () => void
    }): void
  }
} 