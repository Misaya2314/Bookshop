# 轮播图修改指南

## 📖 概述

本指南详细说明如何修改首页轮播图的图片和内容。

## 🎯 轮播图配置位置

轮播图的配置位置在：`miniprogram/pages/home/home.ts` 文件中的 `banners` 数组。

```typescript
banners: [
  {
    id: 1,
    title: "新学期优惠",
    subtitle: "专业教材 9折起",
    bgColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    image:
      "cloud://cloud1-8gbfcrr39555713f.636c-cloud1-8gbfcrr39555713f-1355783267/book-covers/1749909745183_yptr84wow.jpg",
    link: "/pages/category/category",
  },
  // ... 更多轮播图
];
```

## 🖼️ 修改轮播图片的步骤

### 方法一：使用云存储（推荐）

1. **上传图片到云存储**

   - 在微信开发者工具中打开 "云开发" 控制台
   - 进入 "存储" 面板
   - 创建文件夹 `banners`（如果不存在）
   - 上传图片文件（建议使用 JPG 或 PNG 格式，尺寸：750x300 像素）

2. **获取云存储路径**

   - 上传完成后，右键点击图片文件
   - 选择 "复制文件 ID"
   - 得到类似格式：`cloud://环境ID.云环境标识/banners/your-image.jpg`

3. **更新代码中的图片路径**
   ```typescript
   {
     id: 1,
     title: '你的标题',
     subtitle: '你的副标题',
     bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
     image: 'cloud://你的环境ID/banners/your-image.jpg', // 替换为新的云存储路径
     link: '/pages/category/category'
   }
   ```

### 方法二：使用网络图片

如果图片托管在其他服务器上：

```typescript
{
  id: 1,
  title: '你的标题',
  subtitle: '你的副标题',
  bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  image: 'https://your-domain.com/path/to/image.jpg', // 网络图片URL
  link: '/pages/category/category'
}
```

**注意：** 使用网络图片需要在 `project.config.json` 中配置域名白名单。

### 方法三：仅使用渐变背景

如果不使用图片，仅使用渐变背景：

```typescript
{
  id: 1,
  title: '你的标题',
  subtitle: '你的副标题',
  bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  image: '', // 空字符串表示不使用图片
  link: '/pages/category/category'
}
```

## 🎨 自定义轮播图内容

### 修改文字内容

```typescript
{
  id: 1,
  title: '主标题文字',        // 大标题
  subtitle: '副标题描述文字',  // 小标题/描述
  bgColor: '背景渐变色',
  image: '图片路径',
  link: '跳转链接'
}
```

### 修改背景渐变

常用的渐变色配置：

```typescript
// 蓝紫渐变
bgColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

// 粉红渐变
bgColor: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";

// 蓝色渐变
bgColor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";

// 绿色渐变
bgColor: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)";

// 橙色渐变
bgColor: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)";

// 紫色渐变
bgColor: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)";
```

### 修改跳转链接

```typescript
{
  // 跳转到分类页面
  link: "/pages/category/category";

  // 跳转到搜索页面
  link: "/pages/search/search";

  // 跳转到商品详情页
  link: "/pages/product-detail/product-detail?id=BOOK_ID";

  // 跳转到其他页面
  link: "/pages/其他页面/页面名称";
}
```

## 🔧 图片规格建议

### 尺寸要求

- **推荐尺寸**: 750px × 300px
- **最小尺寸**: 600px × 240px
- **宽高比**: 2.5:1

### 文件要求

- **格式**: JPG、PNG
- **大小**: 建议小于 500KB
- **分辨率**: 72-144 DPI

### 设计建议

- 图片左侧留出文字区域
- 确保文字在图片上清晰可读
- 使用高质量图片避免模糊
- 考虑移动端显示效果

## 📱 添加新轮播图

在 `banners` 数组中添加新的轮播图：

```typescript
banners: [
  // 现有轮播图...
  {
    id: 4, // 确保ID唯一
    title: "新轮播图标题",
    subtitle: "新轮播图描述",
    bgColor: "linear-gradient(135deg, #your-color1 0%, #your-color2 100%)",
    image: "your-image-path",
    link: "/pages/target/page",
  },
];
```

## 🗑️ 删除轮播图

直接从 `banners` 数组中删除对应的对象即可。

## ⚠️ 注意事项

1. **图片加载失败处理**: 系统会自动显示背景渐变色
2. **点击事件**: 所有轮播图点击后都会跳转到分类页面
3. **自动播放**: 轮播图会每 3 秒自动切换
4. **缓存清理**: 修改图片后可能需要清除小程序缓存
5. **测试**: 修改后务必在多种设备上测试显示效果

## 🚀 部署步骤

1. 修改 `home.ts` 文件中的轮播图配置
2. 上传图片到云存储（如果使用云存储）
3. 在微信开发者工具中编译预览
4. 确认效果无误后上传代码
5. 发布新版本

## 🎯 示例配置

```typescript
// 完整的轮播图配置示例
banners: [
  {
    id: 1,
    title: "春季大促销",
    subtitle: "全场图书8折起售",
    bgColor: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    image: "cloud://your-env.your-id/banners/spring-sale.jpg",
    link: "/pages/category/category",
  },
  {
    id: 2,
    title: "新书上架",
    subtitle: "最新教材抢先看",
    bgColor: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    image: "cloud://your-env.your-id/banners/new-books.jpg",
    link: "/pages/category/category",
  },
  {
    id: 3,
    title: "学霸推荐",
    subtitle: "优质二手书精选",
    bgColor: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    image: "cloud://your-env.your-id/banners/recommend.jpg",
    link: "/pages/category/category",
  },
];
```

---

**提示**: 修改轮播图后，建议在不同尺寸的设备上测试，确保文字和图片显示效果最佳！

