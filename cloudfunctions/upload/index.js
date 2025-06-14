const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  
  try {
    switch (action) {
      case 'uploadBookImage':
        return await uploadBookImage(event);
      case 'uploadAvatar':
        return await uploadAvatar(event);
      default:
        return {
          code: -1,
          message: '未知操作类型'
        };
    }
  } catch (error) {
    console.error('云函数执行失败:', error);
    return {
      code: -1,
      message: '服务器内部错误',
      error: error.message
    };
  }
};

// 上传书籍图片
async function uploadBookImage(event) {
  const { fileList, bookId, type = 'cover' } = event;
  
  if (!fileList || !Array.isArray(fileList)) {
    return {
      code: -1,
      message: '文件列表不能为空'
    };
  }
  
  const uploadResults = [];
  
  for (const file of fileList) {
    try {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      
      // 根据类型选择存储路径
      let cloudPath;
      if (type === 'cover') {
        cloudPath = `book-covers/${timestamp}_${random}.jpg`;
      } else if (type === 'detail') {
        cloudPath = `book-details/${timestamp}_${random}.jpg`;
      } else {
        cloudPath = `book-covers/${timestamp}_${random}.jpg`; // 默认封面
      }
      
      const result = await cloud.uploadFile({
        cloudPath: cloudPath,
        fileContent: file.content
      });
      
      uploadResults.push({
        fileID: result.fileID,
        cloudPath: cloudPath
      });
      
    } catch (uploadError) {
      console.error('文件上传失败:', uploadError);
      uploadResults.push({
        error: uploadError.message
      });
    }
  }
  
  return {
    code: 0,
    message: '上传完成',
    data: {
      results: uploadResults
    }
  };
}

// 上传用户头像
async function uploadAvatar(event) {
  const { fileContent, userId } = event;
  
  if (!fileContent || !userId) {
    return {
      code: -1,
      message: '文件内容和用户ID不能为空'
    };
  }
  
  try {
    const timestamp = Date.now();
    const cloudPath = `avatars/${userId}_${timestamp}.jpg`;
    
    const result = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: fileContent
    });
    
    // 更新用户头像信息到数据库
    await db.collection('users').doc(userId).update({
      data: {
        avatar: result.fileID,
        updateTime: new Date()
      }
    });
    
    return {
      code: 0,
      message: '头像上传成功',
      data: {
        fileID: result.fileID,
        cloudPath: cloudPath
      }
    };
    
  } catch (error) {
    console.error('头像上传失败:', error);
    return {
      code: -1,
      message: '头像上传失败',
      error: error.message
    };
  }
} 