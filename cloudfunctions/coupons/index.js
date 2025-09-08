// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event;
  const wxContext = cloud.getWXContext();
  
  try {
    switch (action) {
      case 'createCoupon':
        return await createCoupon(data, wxContext);
      case 'getCoupons':
        return await getCoupons(data, wxContext);
      case 'updateCoupon':
        return await updateCoupon(data, wxContext);
      case 'deleteCoupon':
        return await deleteCoupon(data, wxContext);
      case 'validateCoupon':
        return await validateCoupon(data, wxContext);
      case 'useCoupon':
        return await useCoupon(data, wxContext);
      case 'getCouponStats':
        return await getCouponStats(data, wxContext);
      default:
        return {
          success: false,
          message: '未知操作'
        };
    }
  } catch (error) {
    console.error('优惠券云函数错误:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// 创建优惠券
async function createCoupon(data, wxContext) {
  const { code, discount, description } = data;
  
  // 参数验证
  if (!code || !discount) {
    throw new Error('优惠券代码和折扣不能为空');
  }
  
  if (discount < 0.1 || discount > 1) {
    throw new Error('折扣比例必须在0.1-1之间');
  }
  
  // 获取用户信息，验证商家权限
  const userResult = await db.collection('users').where({
    openid: wxContext.OPENID
  }).get();
  
  if (userResult.data.length === 0) {
    throw new Error('用户不存在');
  }
  
  const user = userResult.data[0];
  if (!user.isMerchant) {
    throw new Error('只有商家才能创建优惠券');
  }
  
  // 检查优惠券代码是否已存在
  const existResult = await db.collection('coupons').where({
    merchantId: user._id,
    code: code,
    status: 'active'
  }).get();
  
  if (existResult.data.length > 0) {
    throw new Error('优惠券代码已存在');
  }
  
  // 创建优惠券
  const now = new Date();
  const couponData = {
    code: code.toUpperCase(),
    merchantId: user._id, // 使用用户数据库ID，与商品保持一致
    merchantName: user.nickName || '商家',
    discount: parseFloat(discount),
    description: description || '',
    usageCount: 0,
    status: 'active',
    createTime: now,
    updateTime: now
  };
  
  const result = await db.collection('coupons').add({
    data: couponData
  });
  
  return {
    success: true,
    message: '优惠券创建成功',
    data: {
      _id: result._id,
      ...couponData
    }
  };
}

// 获取商家的优惠券列表
async function getCoupons(data, wxContext) {
  const { page = 1, pageSize = 10, status = 'active' } = data;
  
  // 获取用户信息，验证商家权限
  const userResult = await db.collection('users').where({
    openid: wxContext.OPENID
  }).get();
  
  if (userResult.data.length === 0) {
    throw new Error('用户不存在');
  }
  
  const user = userResult.data[0];
  if (!user.isMerchant) {
    throw new Error('只有商家才能查看优惠券');
  }
  
  const skip = (page - 1) * pageSize;
  
  // 查询优惠券
  const result = await db.collection('coupons')
    .where({
      merchantId: user._id,
      status: status
    })
    .orderBy('createTime', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get();
  
  // 获取总数
  const countResult = await db.collection('coupons')
    .where({
      merchantId: user._id,
      status: status
    })
    .count();
  
  return {
    success: true,
    data: result.data,
    total: countResult.total,
    page,
    pageSize
  };
}

// 更新优惠券
async function updateCoupon(data, wxContext) {
  const { couponId, discount, description } = data;
  
  if (!couponId) {
    throw new Error('优惠券ID不能为空');
  }
  
  // 获取用户信息，验证商家权限
  const userResult = await db.collection('users').where({
    openid: wxContext.OPENID
  }).get();
  
  if (userResult.data.length === 0) {
    throw new Error('用户不存在');
  }
  
  const user = userResult.data[0];
  if (!user.isMerchant) {
    throw new Error('只有商家才能更新优惠券');
  }
  
  // 验证优惠券所有权
  const couponResult = await db.collection('coupons').doc(couponId).get();
  if (couponResult.data.merchantId !== user._id) {
    throw new Error('只能更新自己的优惠券');
  }
  
  const updateData = {
    updateTime: new Date()
  };
  
  if (discount !== undefined) {
    if (discount < 0.1 || discount > 1) {
      throw new Error('折扣比例必须在0.1-1之间');
    }
    updateData.discount = parseFloat(discount);
  }
  
  if (description !== undefined) {
    updateData.description = description;
  }
  
  await db.collection('coupons').doc(couponId).update({
    data: updateData
  });
  
  return {
    success: true,
    message: '优惠券更新成功'
  };
}

// 删除优惠券（软删除）
async function deleteCoupon(data, wxContext) {
  const { couponId } = data;
  
  if (!couponId) {
    throw new Error('优惠券ID不能为空');
  }
  
  // 获取用户信息，验证商家权限
  const userResult = await db.collection('users').where({
    openid: wxContext.OPENID
  }).get();
  
  if (userResult.data.length === 0) {
    throw new Error('用户不存在');
  }
  
  const user = userResult.data[0];
  if (!user.isMerchant) {
    throw new Error('只有商家才能删除优惠券');
  }
  
  // 验证优惠券所有权
  const couponResult = await db.collection('coupons').doc(couponId).get();
  if (couponResult.data.merchantId !== user._id) {
    throw new Error('只能删除自己的优惠券');
  }
  
  await db.collection('coupons').doc(couponId).update({
    data: {
      status: 'deleted',
      updateTime: new Date()
    }
  });
  
  return {
    success: true,
    message: '优惠券删除成功'
  };
}

// 验证优惠券（用户使用时调用）
async function validateCoupon(data, wxContext) {
  const { code, merchantId } = data;
  
  if (!code || !merchantId) {
    throw new Error('优惠券代码和商家ID不能为空');
  }
  
  // 查找优惠券
  const result = await db.collection('coupons').where({
    code: code.toUpperCase(),
    merchantId: merchantId,
    status: 'active'
  }).get();
  
  if (result.data.length === 0) {
    return {
      success: false,
      message: '优惠券不存在或已失效'
    };
  }
  
  const coupon = result.data[0];
  
  return {
    success: true,
    message: '优惠券验证成功',
    data: {
      _id: coupon._id,
      code: coupon.code,
      discount: coupon.discount,
      description: coupon.description
    }
  };
}

// 使用优惠券（支付成功后调用）
async function useCoupon(data, wxContext) {
  const { couponId } = data;
  
  if (!couponId) {
    throw new Error('优惠券ID不能为空');
  }
  
  // 增加使用次数
  await db.collection('coupons').doc(couponId).update({
    data: {
      usageCount: _.inc(1),
      updateTime: new Date()
    }
  });
  
  return {
    success: true,
    message: '优惠券使用次数已更新'
  };
}

// 获取优惠券使用统计
async function getCouponStats(data, wxContext) {
  // 获取用户信息，验证商家权限
  const userResult = await db.collection('users').where({
    openid: wxContext.OPENID
  }).get();
  
  if (userResult.data.length === 0) {
    throw new Error('用户不存在');
  }
  
  const user = userResult.data[0];
  if (!user.isMerchant) {
    throw new Error('只有商家才能查看统计');
  }
  
  // 获取所有优惠券的统计信息
  const result = await db.collection('coupons')
    .where({
      merchantId: user._id,
      status: 'active'
    })
    .field({
      code: true,
      discount: true,
      description: true,
      usageCount: true,
      createTime: true
    })
    .orderBy('usageCount', 'desc')
    .get();
  
  // 计算总使用次数
  const totalUsage = result.data.reduce((sum, coupon) => sum + coupon.usageCount, 0);
  
  return {
    success: true,
    data: {
      coupons: result.data,
      totalCoupons: result.data.length,
    totalUsage: totalUsage
  }
};

}
