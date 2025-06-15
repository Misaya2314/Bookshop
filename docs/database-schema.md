# 数据库集合结构文档

## 项目概述

本文档描述了校园二手书店微信小程序的数据库集合结构，包括图书管理、用户管理、购物车等核心功能的数据模型。

**云开发环境 ID**: `cloud1-8gbfcrr39555713f`

---

## 📚 集合列表

| 集合名称 | 说明         | 记录数量（估算） |
| -------- | ------------ | ---------------- |
| `books`  | 图书信息管理 | 500+             |
| `users`  | 用户信息管理 | 1000+            |
| `cart`   | 购物车管理   | 动态             |

---

## 📖 books 集合

**用途**: 存储图书商品信息，包括图书详情、价格、库存、商家信息等

### 字段结构

| 字段名          | 类型   | 必填 | 说明                   | 示例值                                |
| --------------- | ------ | ---- | ---------------------- | ------------------------------------- |
| `_id`           | String | ✅   | 图书唯一标识           | `"2ed3518f6843b1f7021c27270..."`      |
| `title`         | String | ✅   | 图书标题               | `"算法导论"`                          |
| `author`        | String | ✅   | 作者                   | `"Thomas H. Cormen"`                  |
| `price`         | Number | ✅   | 现价（元）             | `45.00`                               |
| `originalPrice` | Number | ❌   | 原价（元）             | `50.00`                               |
| `stock`         | Number | ✅   | 库存数量               | `20`                                  |
| `categoryId`    | Number | ✅   | 分类 ID                | `1`                                   |
| `subCategoryId` | String | ❌   | 子分类标识             | `"textbook"`                          |
| `description`   | String | ✅   | 图书描述               | `"经典算法教材，适合计算机专业学生"`  |
| `condition`     | String | ✅   | 图书状态               | `"良好"` / `"全新"` / `"一般"`        |
| `publisher`     | String | ❌   | 出版社                 | `"机械工业出版社"`                    |
| `isbn`          | String | ❌   | ISBN 号                | `"9787111407010"`                     |
| `icon`          | String | ✅   | emoji 图标             | `"📚"`                                |
| `images`        | Array  | ❌   | 图片数组               | `["cloud://xxx/book-covers/xxx.jpg"]` |
| `merchantId`    | String | ✅   | 商家 ID（用户 openid） | `"system"`                            |
| `merchantName`  | String | ✅   | 商家名称               | `"系统管理员"`                        |
| `sales`         | Number | ✅   | 销量                   | `156`                                 |
| `rating`        | Number | ✅   | 评分（1-5 分）         | `4.5`                                 |
| `views`         | Number | ✅   | 浏览量                 | `0`                                   |
| `status`        | String | ✅   | 状态                   | `"active"` / `"deleted"`              |
| `createTime`    | Date   | ✅   | 创建时间               | `2025-06-15T18:38:36.000Z`            |
| `updateTime`    | Date   | ✅   | 更新时间               | `2025-06-15T18:40:05.000Z`            |

### 分类说明

#### 主分类（categoryId）

| ID  | 名称   | 说明                   |
| --- | ------ | ---------------------- |
| 1   | 计算机 | 编程、算法、数据结构等 |
| 2   | 医学   | 医学教材、临床指南等   |
| 3   | 管理学 | 管理理论、案例分析等   |
| 4   | 英语   | 英语教材、考试资料等   |
| 5   | 法律   | 法学教材、法规汇编等   |
| 6   | 理工   | 数学、物理、化学等     |
| 7   | 艺术   | 美术、音乐、设计等     |

#### 子分类（subCategoryId）

| 标识        | 名称     | 说明         |
| ----------- | -------- | ------------ |
| `textbook`  | 教材     | 正式教学用书 |
| `reference` | 参考书   | 辅助学习资料 |
| `exam`      | 考研资料 | 考试复习材料 |

---

## 👤 users 集合

**用途**: 存储用户基本信息、学籍信息、商家认证状态等

### 字段结构

| 字段名           | 类型    | 必填 | 说明         | 示例值                                           |
| ---------------- | ------- | ---- | ------------ | ------------------------------------------------ |
| `_id`            | String  | ✅   | 用户唯一标识 | `"2ed3518f6843b1f7021c27270..."`                 |
| `openid`         | String  | ✅   | 微信用户标识 | `"oYYEH7MKF20_IGr_r0rbcnh2t4Mc"`                 |
| `nickName`       | String  | ✅   | 用户昵称     | `"微信用户"`                                     |
| `avatarUrl`      | String  | ❌   | 头像 URL     | `"cloud://cloud1-8gbfcrr39555713f.636c-..."`     |
| `phone`          | String  | ❌   | 手机号       | `"13678923950"`                                  |
| `campus`         | String  | ❌   | 校区         | `"朝阳区（主校区）"`                             |
| `college`        | String  | ❌   | 学院         | `"计算机学院"`                                   |
| `major`          | String  | ❌   | 专业         | `"软件工程"`                                     |
| `grade`          | String  | ❌   | 年级         | `"大二"`                                         |
| `isMerchant`     | Boolean | ✅   | 是否为商家   | `false`                                          |
| `merchantStatus` | String  | ❌   | 商家认证状态 | `""` / `"pending"` / `"approved"` / `"rejected"` |
| `isFirstLogin`   | Boolean | ✅   | 是否首次登录 | `false`                                          |
| `createTime`     | Date    | ✅   | 注册时间     | `2025-06-07T11:28:55.000Z`                       |
| `updateTime`     | Date    | ✅   | 更新时间     | `2025-06-14T20:17:54.000Z`                       |

### 商家状态说明

| 状态值       | 说明           |
| ------------ | -------------- |
| `""`         | 未申请商家认证 |
| `"pending"`  | 申请审核中     |
| `"approved"` | 认证通过       |
| `"rejected"` | 认证被拒绝     |

---

## 🛒 cart 集合

**用途**: 存储用户购物车信息，支持多商家、多商品管理

### 字段结构

| 字段名          | 类型    | 必填 | 说明             | 示例值                            |
| --------------- | ------- | ---- | ---------------- | --------------------------------- |
| `_id`           | String  | ✅   | 购物车项唯一标识 | `"29dca3d5684ea2ac02dc44297..."`  |
| `openid`        | String  | ✅   | 用户标识         | `"oYYEH7MKF20_IGr_r0rbcnh2t4Mc"`  |
| `bookId`        | String  | ✅   | 图书 ID          | `"adea466684390360218c80c6b15ca"` |
| `title`         | String  | ✅   | 图书标题         | `"算法导论"`                      |
| `price`         | Number  | ✅   | 商品价格         | `68`                              |
| `originalPrice` | Number  | ❌   | 商品原价         | `68`                              |
| `images`        | Array   | ❌   | 商品图片         | `[]`                              |
| `quantity`      | Number  | ✅   | 购买数量         | `1`                               |
| `stock`         | Number  | ✅   | 库存数量         | `15`                              |
| `checked`       | Boolean | ✅   | 是否选中         | `true`                            |
| `merchantId`    | String  | ✅   | 商家 ID          | `"system"`                        |
| `merchantName`  | String  | ✅   | 商家名称         | `"系统管理员"`                    |
| `createTime`    | Date    | ✅   | 加入购物车时间   | `2025-06-15T18:38:36.000Z`        |
| `updateTime`    | Date    | ✅   | 最后更新时间     | `2025-06-15T18:40:05.000Z`        |

### 业务逻辑说明

1. **购物车分组**: 按 `merchantId` 分组显示，同一商家的商品归为一组
2. **选中状态**: 支持单选、商家全选、全选功能
3. **库存控制**: `quantity` 不能超过 `stock`
4. **价格计算**: 基于 `price` × `quantity` 计算总价
5. **数据同步**: 商品信息从 `books` 集合同步，避免数据不一致

---

## 🗂️ 云存储结构

**云存储路径**: `cloud://cloud1-8gbfcrr39555713f/`

```
cloud://cloud1-8gbfcrr39555713f/
├── book-covers/                    # 📚 图书封面
│   └── {timestamp}_{random}.jpg   # 格式：1749909745183_yptr84wow.jpg
├── book-details/                   # 📖 图书详情图片
│   └── {timestamp}_{random}.jpg   # 商品详情页多图展示
├── banners/                        # 🎨 轮播图
│   └── banner1.jpg                # 首页轮播图片
└── avatars/                        # 👤 用户头像
    └── {userId}_{timestamp}.jpg   # 用户自定义头像
```

### 文件命名规范

| 目录            | 命名格式                   | 说明               | 示例                          |
| --------------- | -------------------------- | ------------------ | ----------------------------- |
| `book-covers/`  | `{timestamp}_{random}.jpg` | 时间戳+随机字符串  | `1749909745183_yptr84wow.jpg` |
| `book-details/` | `{timestamp}_{random}.jpg` | 同上，支持多图     | `1749909745184_abc123.jpg`    |
| `banners/`      | `banner{n}.jpg`            | 固定命名，便于管理 | `banner1.jpg`, `banner2.jpg`  |
| `avatars/`      | `{userId}_{timestamp}.jpg` | 用户 ID+时间戳     | `user123_1749909745183.jpg`   |

### 存储容量规划

| 文件类型 | 单文件大小 | 预估数量 | 总容量     |
| -------- | ---------- | -------- | ---------- |
| 图书封面 | 100KB      | 500+     | ~50MB      |
| 图书详情 | 200KB      | 1000+    | ~200MB     |
| 轮播图   | 500KB      | 10       | ~5MB       |
| 用户头像 | 100KB      | 1000+    | ~100MB     |
| **总计** | -          | -        | **~355MB** |

---

## 🔧 数据库索引建议

### books 集合

```javascript
// 商品查询索引
db.collection("books").createIndex({
  status: 1,
  categoryId: 1,
  createTime: -1,
});

// 商家商品索引
db.collection("books").createIndex({
  merchantId: 1,
  status: 1,
});

// 搜索索引
db.collection("books").createIndex({
  title: "text",
  author: "text",
  description: "text",
});
```

### cart 集合

```javascript
// 用户购物车索引
db.collection("cart").createIndex({
  openid: 1,
  createTime: -1,
});

// 商品关联索引
db.collection("cart").createIndex({
  bookId: 1,
});
```

### users 集合

```javascript
// 用户查询索引
db.collection("users").createIndex(
  {
    openid: 1,
  },
  { unique: true }
);

// 商家查询索引
db.collection("users").createIndex({
  isMerchant: 1,
  merchantStatus: 1,
});
```

---

## 📊 数据统计字段

### 自动更新字段

以下字段通过云函数自动维护：

| 集合    | 字段         | 更新时机            | 说明         |
| ------- | ------------ | ------------------- | ------------ |
| `books` | `sales`      | 订单完成时          | 累计销量     |
| `books` | `views`      | 商品详情页访问时    | 浏览次数     |
| `books` | `updateTime` | 任何修改时          | 最后更新时间 |
| `cart`  | `updateTime` | 数量/选中状态变更时 | 最后更新时间 |

---

## 🔒 数据权限说明

### 集合权限配置

| 集合名  | 读权限   | 写权限        | 说明             |
| ------- | -------- | ------------- | ---------------- |
| `books` | 所有用户 | 仅管理员/商家 | 商品信息公开可读 |
| `users` | 仅创建者 | 仅创建者      | 用户隐私信息保护 |
| `cart`  | 仅创建者 | 仅创建者      | 购物车个人数据   |

### 云函数权限

所有数据操作通过云函数进行，确保：

- 数据访问权限控制
- 业务逻辑一致性
- 数据安全性验证

---

## 📝 维护说明

### 数据清理策略

1. **购物车数据**: 超过 30 天未更新的记录自动清理
2. **图片文件**: 定期清理未关联的图片文件
3. **用户数据**: 遵循用户隐私保护政策

### 备份策略

1. **数据库**: 每日自动备份
2. **云存储**: 重要图片异地备份
3. **日志记录**: 保留最近 30 天的操作日志

---

_最后更新时间: 2025 年 6 月 15 日_
_文档版本: v1.0_
