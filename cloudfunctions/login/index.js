const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, userInfo } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'login':
        return await handleLogin(wxContext, userInfo)
      case 'updateProfile':
        return await updateUserProfile(wxContext, userInfo)
      case 'getUserInfo':
        return await getUserInfo(wxContext)
      default:
        return {
          code: -1,
          message: '无效的操作类型'
        }
    }
  } catch (error) {
    console.error('云函数执行错误:', error)
    return {
      code: -1,
      message: '服务器错误',
      error: error.message
    }
  }
}

// 处理用户登录
async function handleLogin(wxContext, userInfo) {
  const { OPENID } = wxContext
  
  try {
    // 查询用户是否已存在
    const userQuery = await db.collection('users').where({
      openid: OPENID
    }).get()

    let userData
    const currentTime = new Date()

    if (userQuery.data.length === 0) {
      // 新用户，创建用户记录
      const newUser = {
        openid: OPENID,
        nickName: userInfo?.nickName || '',
        avatarUrl: userInfo?.avatarUrl || '',
        phone: '',
        college: '',
        major: '',
        grade: '',
        campus: '',
        isMerchant: false,
        merchantStatus: '', // pending, approved, rejected
        isFirstLogin: true,
        createTime: currentTime,
        updateTime: currentTime
      }

      const addResult = await db.collection('users').add({
        data: newUser
      })

      userData = {
        ...newUser,
        _id: addResult._id
      }
    } else {
      // 老用户，更新登录信息
      userData = userQuery.data[0]
      
      // 更新用户头像和昵称（可能会变化）
      await db.collection('users').doc(userData._id).update({
        data: {
          nickName: userInfo?.nickName || userData.nickName,
          avatarUrl: userInfo?.avatarUrl || userData.avatarUrl,
          updateTime: currentTime
        }
      })

      userData.nickName = userInfo?.nickName || userData.nickName
      userData.avatarUrl = userInfo?.avatarUrl || userData.avatarUrl
      userData.updateTime = currentTime
    }

    return {
      code: 0,
      message: '登录成功',
      data: {
        userInfo: userData,
        isFirstLogin: userData.isFirstLogin
      }
    }
  } catch (error) {
    console.error('登录处理错误:', error)
    throw error
  }
}

// 更新用户资料
async function updateUserProfile(wxContext, profileData) {
  const { OPENID } = wxContext
  
  try {
    const updateData = {
      updateTime: new Date()
    }

    // 更新允许的字段
    const allowedFields = ['phone', 'college', 'major', 'grade', 'campus']
    allowedFields.forEach(field => {
      if (profileData[field] !== undefined) {
        updateData[field] = profileData[field]
      }
    })

    // 如果是首次完善资料，标记不再是首次登录
    if (profileData.phone && profileData.college) {
      updateData.isFirstLogin = false
    }

    await db.collection('users').where({
      openid: OPENID
    }).update({
      data: updateData
    })

    return {
      code: 0,
      message: '资料更新成功',
      data: updateData
    }
  } catch (error) {
    console.error('更新用户资料错误:', error)
    throw error
  }
}

// 获取用户信息
async function getUserInfo(wxContext) {
  const { OPENID } = wxContext
  
  try {
    const userQuery = await db.collection('users').where({
      openid: OPENID
    }).get()

    if (userQuery.data.length === 0) {
      return {
        code: -1,
        message: '用户不存在'
      }
    }

    return {
      code: 0,
      message: '获取用户信息成功',
      data: userQuery.data[0]
    }
  } catch (error) {
    console.error('获取用户信息错误:', error)
    throw error
  }
} 