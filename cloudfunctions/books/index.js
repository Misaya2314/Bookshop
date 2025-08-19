const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'getBooks':
        return await getBooks(event)
      case 'getBookDetail':
        return await getBookDetail(event)
      case 'addBook':
        return await addBook(event, wxContext)
      case 'updateBook':
        return await updateBook(event, wxContext)
      case 'deleteBook':
        return await deleteBook(event, wxContext)
      case 'searchBooks':
        return await searchBooks(event)
      case 'getBooksByCategory':
        return await getBooksByCategory(event)
      case 'getBooksByCollege':
        return await getBooksByCollege(event)
      case 'getHotBooks':
        return await getHotBooks(event)
      case 'getRecommendBooks':
        return await getRecommendBooks(event)
      case 'getMerchantBooks':
        return await getMerchantBooks(event, wxContext)
      case 'addToFavorites':
        return await addToFavorites(event, wxContext)
      case 'removeFromFavorites':
        return await removeFromFavorites(event, wxContext)
      case 'getFavorites':
        return await getFavorites(event, wxContext)
      case 'checkFavoriteStatus':
        return await checkFavoriteStatus(event, wxContext)
      default:
        return {
          code: -1,
          message: '无效的操作类型'
        }
    }
  } catch (error) {
    console.error('books云函数执行错误:', error)
    return {
      code: -1,
      message: '服务器错误',
      error: error.message
    }
  }
}

// 获取图书列表（分页）
async function getBooks({ page = 1, pageSize = 20, categoryId, subCategoryId, status = 'active' }) {
  try {
    const skip = (page - 1) * pageSize
    
    // 构建查询条件
    let whereConditions = { status }

    // 同时满足一级分类和二级分类条件
    if (categoryId) {
      whereConditions.categoryId = categoryId
    }
    if (subCategoryId && subCategoryId !== 'all') {
      whereConditions.subCategoryId = subCategoryId
    }
    
    let query = db.collection('books').where(whereConditions)

    // 执行查询
    const result = await query
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取总数
    const countResult = await query.count()

    return {
      code: 0,
      message: '获取图书列表成功',
      data: {
        books: result.data,
        total: countResult.total,
        page,
        pageSize,
        hasMore: result.data.length === pageSize
      }
    }
  } catch (error) {
    console.error('获取图书列表错误:', error)
    throw error
  }
}

// 获取图书详情
async function getBookDetail({ bookId }) {
  if (!bookId) {
    return {
      code: -1,
      message: '图书ID不能为空'
    }
  }

  try {
    const result = await db.collection('books').doc(bookId).get()

    if (!result.data) {
      return {
        code: -1,
        message: '图书不存在'
      }
    }

    return {
      code: 0,
      message: '获取图书详情成功',
      data: result.data
    }
  } catch (error) {
    console.error('获取图书详情错误:', error)
    throw error
  }
}

// 添加图书（商家功能）
async function addBook(bookData, wxContext) {
  const { OPENID } = wxContext

  // 验证用户是否为商家
  const userResult = await db.collection('users').where({ openid: OPENID }).get()
  if (!userResult.data.length || !userResult.data[0].isMerchant) {
    return {
      code: -1,
      message: '只有商家才能添加图书'
    }
  }

  const merchantId = userResult.data[0]._id
  const merchantName = userResult.data[0].nickName

  try {
    const newBook = {
      ...bookData,
      merchantId,
      merchantName,
      // 兼容处理：如果没有传collegeId但有categoryId，进行转换
      collegeId: bookData.collegeId || bookData.categoryId,
      collegeName: bookData.collegeName || '',
      majorId: bookData.majorId || bookData.subCategoryId || 'all',
      majorName: bookData.majorName || '',
      sales: 0,
      rating: 0,
      views: 0,
      status: 'active',
      createTime: new Date(),
      updateTime: new Date()
    }

    const result = await db.collection('books').add({
      data: newBook
    })

    return {
      code: 0,
      message: '添加图书成功',
      data: {
        bookId: result._id,
        ...newBook
      }
    }
  } catch (error) {
    console.error('添加图书错误:', error)
    throw error
  }
}

// 更新图书信息（商家功能）
async function updateBook({ bookId, ...updateData }, wxContext) {
  const { OPENID } = wxContext

  if (!bookId) {
    return {
      code: -1,
      message: '图书ID不能为空'
    }
  }

  try {
    // 验证图书是否属于当前用户
    const bookResult = await db.collection('books').doc(bookId).get()
    if (!bookResult.data) {
      return {
        code: -1,
        message: '图书不存在'
      }
    }

    const userResult = await db.collection('users').where({ openid: OPENID }).get()
    if (!userResult.data.length || userResult.data[0]._id !== bookResult.data.merchantId) {
      return {
        code: -1,
        message: '只能修改自己发布的图书'
      }
    }

    // 更新图书信息
    const updates = {
      ...updateData,
      updateTime: new Date()
    }

    await db.collection('books').doc(bookId).update({
      data: updates
    })

    return {
      code: 0,
      message: '更新图书成功',
      data: updates
    }
  } catch (error) {
    console.error('更新图书错误:', error)
    throw error
  }
}

// 删除图书（商家功能）
async function deleteBook({ bookId }, wxContext) {
  const { OPENID } = wxContext

  if (!bookId) {
    return {
      code: -1,
      message: '图书ID不能为空'
    }
  }

  try {
    // 验证图书是否属于当前用户
    const bookResult = await db.collection('books').doc(bookId).get()
    if (!bookResult.data) {
      return {
        code: -1,
        message: '图书不存在'
      }
    }

    const userResult = await db.collection('users').where({ openid: OPENID }).get()
    if (!userResult.data.length || userResult.data[0]._id !== bookResult.data.merchantId) {
      return {
        code: -1,
        message: '只能删除自己发布的图书'
      }
    }

    // 软删除：将状态设为deleted
    await db.collection('books').doc(bookId).update({
      data: {
        status: 'deleted',
        updateTime: new Date()
      }
    })

    return {
      code: 0,
      message: '删除图书成功'
    }
  } catch (error) {
    console.error('删除图书错误:', error)
    throw error
  }
}

// 搜索图书
async function searchBooks({ keyword, page = 1, pageSize = 20 }) {
  if (!keyword) {
    return {
      code: -1,
      message: '搜索关键词不能为空'
    }
  }

  try {
    const skip = (page - 1) * pageSize
    
    // 使用正则表达式进行模糊搜索
    const result = await db.collection('books')
      .where({
        status: 'active',
        // 搜索标题或作者
        $or: [
          { title: db.RegExp({ regexp: keyword, options: 'i' }) },
          { author: db.RegExp({ regexp: keyword, options: 'i' }) }
        ]
      })
      .orderBy('sales', 'desc') // 按销量排序
      .skip(skip)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      message: '搜索成功',
      data: {
        books: result.data,
        keyword,
        page,
        pageSize,
        hasMore: result.data.length === pageSize
      }
    }
  } catch (error) {
    console.error('搜索图书错误:', error)
    throw error
  }
}

// 按分类获取图书（保留兼容性）
async function getBooksByCategory({ categoryId, subCategoryId = 'all', page = 1, pageSize = 20 }) {
  return await getBooks({ page, pageSize, categoryId, subCategoryId })
}

// 按学院获取图书
async function getBooksByCollege({ collegeId, majorId = 'all', page = 1, pageSize = 20 }) {
  try {
    const skip = (page - 1) * pageSize
    
    // 构建查询条件
    let whereConditions = { status: 'active' }

    // 按学院筛选
    if (collegeId) {
      whereConditions.collegeId = collegeId
    }
    
    // 按专业筛选（如果不是"全部专业"）
    if (majorId && majorId !== 'all') {
      whereConditions.majorId = majorId
    }
    
    let query = db.collection('books').where(whereConditions)

    // 执行查询
    const result = await query
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取总数
    const countResult = await query.count()

    return {
      code: 0,
      message: '获取图书列表成功',
      data: {
        books: result.data,
        total: countResult.total,
        page,
        pageSize,
        hasMore: result.data.length === pageSize
      }
    }
  } catch (error) {
    console.error('按学院获取图书错误:', error)
    throw error
  }
}

// 获取热门图书
async function getHotBooks({ limit = 10 }) {
  try {
    const result = await db.collection('books')
      .where({ status: 'active' })
      .orderBy('sales', 'desc')
      .limit(limit)
      .get()

    return {
      code: 0,
      message: '获取热门图书成功',
      data: result.data
    }
  } catch (error) {
    console.error('获取热门图书错误:', error)
    throw error
  }
}

// 获取推荐图书
async function getRecommendBooks({ userId, limit = 10 }) {
  try {
    // 简单推荐逻辑：按创建时间倒序
    const result = await db.collection('books')
      .where({ status: 'active' })
      .orderBy('createTime', 'desc')
      .limit(limit)
      .get()

    return {
      code: 0,
      message: '获取推荐图书成功',
      data: result.data
    }
  } catch (error) {
    console.error('获取推荐图书错误:', error)
    throw error
  }
}

// 获取商家的图书
async function getMerchantBooks({ status, page = 1, pageSize = 20 }, wxContext) {
  const { OPENID } = wxContext

  try {
    // 获取当前用户信息
    const userResult = await db.collection('users').where({ openid: OPENID }).get()
    if (!userResult.data.length) {
      return {
        code: -1,
        message: '用户不存在'
      }
    }

    const merchantId = userResult.data[0]._id
    const skip = (page - 1) * pageSize
    
    let query = db.collection('books').where({ merchantId })
    
    // 按状态筛选
    if (status && status !== 'all') {
      query = query.where({ status })
    } else {
      // 排除已删除的图书
      query = query.where({ status: _.neq('deleted') })
    }

    const result = await query
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取总数
    const countResult = await query.count()

    return {
      code: 0,
      message: '获取商家图书成功',
      data: {
        books: result.data,
        total: countResult.total,
        page,
        pageSize,
        hasMore: result.data.length === pageSize
      }
    }
  } catch (error) {
    console.error('获取商家图书错误:', error)
    throw error
  }
}

// 添加到收藏夹
async function addToFavorites({ bookId }, wxContext) {
  const { OPENID } = wxContext

  if (!bookId) {
    return {
      code: -1,
      message: '图书ID不能为空'
    }
  }

  try {
    // 检查图书是否存在
    const bookResult = await db.collection('books').doc(bookId).get()
    if (!bookResult.data) {
      return {
        code: -1,
        message: '图书不存在'
      }
    }

    // 检查是否已经收藏
    const existingFavorite = await db.collection('favorites')
      .where({
        openid: OPENID,
        bookId: bookId
      })
      .get()

    if (existingFavorite.data.length > 0) {
      return {
        code: -1,
        message: '已经收藏过该图书'
      }
    }

    // 添加收藏记录
    const favoriteData = {
      openid: OPENID,
      bookId: bookId,
      title: bookResult.data.title,
      author: bookResult.data.author,
      price: bookResult.data.price,
      originalPrice: bookResult.data.originalPrice,
      images: bookResult.data.images,
      icon: bookResult.data.icon,
      merchantId: bookResult.data.merchantId,
      merchantName: bookResult.data.merchantName,
      createTime: new Date()
    }

    const result = await db.collection('favorites').add({
      data: favoriteData
    })

    return {
      code: 0,
      message: '收藏成功',
      data: {
        favoriteId: result._id
      }
    }
  } catch (error) {
    console.error('添加收藏错误:', error)
    throw error
  }
}

// 从收藏夹移除
async function removeFromFavorites({ bookId }, wxContext) {
  const { OPENID } = wxContext

  if (!bookId) {
    return {
      code: -1,
      message: '图书ID不能为空'
    }
  }

  try {
    const result = await db.collection('favorites')
      .where({
        openid: OPENID,
        bookId: bookId
      })
      .remove()

    if (result.stats.removed === 0) {
      return {
        code: -1,
        message: '该图书未收藏'
      }
    }

    return {
      code: 0,
      message: '取消收藏成功',
      data: {
        removed: result.stats.removed
      }
    }
  } catch (error) {
    console.error('移除收藏错误:', error)
    throw error
  }
}

// 获取收藏夹
async function getFavorites({ page = 1, pageSize = 20 }, wxContext) {
  const { OPENID } = wxContext

  try {
    const skip = (page - 1) * pageSize

    const result = await db.collection('favorites')
      .where({ openid: OPENID })
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取总数
    const countResult = await db.collection('favorites')
      .where({ openid: OPENID })
      .count()

    return {
      code: 0,
      message: '获取收藏列表成功',
      data: {
        favorites: result.data,
        total: countResult.total,
        page,
        pageSize,
        hasMore: result.data.length === pageSize
      }
    }
  } catch (error) {
    console.error('获取收藏列表错误:', error)
    throw error
  }
}

// 检查收藏状态
async function checkFavoriteStatus({ bookId }, wxContext) {
  const { OPENID } = wxContext

  if (!bookId) {
    return {
      code: -1,
      message: '图书ID不能为空'
    }
  }

  try {
    const result = await db.collection('favorites')
      .where({
        openid: OPENID,
        bookId: bookId
      })
      .get()

    return {
      code: 0,
      message: '检查收藏状态成功',
      data: {
        isFavorite: result.data.length > 0
      }
    }
  } catch (error) {
    console.error('检查收藏状态错误:', error)
    throw error
  }
} 