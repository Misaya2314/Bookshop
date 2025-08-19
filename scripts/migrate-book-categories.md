# 图书分类数据迁移指南

## 概述

此脚本用于将现有的图书分类系统从"图书类型分类"迁移到"学院专业分类"。

## 迁移步骤

### 1. 数据库字段迁移

需要为现有的 `books` 集合添加新字段：

```javascript
// 在微信云开发控制台的数据库中执行以下操作

// 1. 为所有现有图书添加新的学院分类字段
db.collection("books")
  .where({})
  .update({
    data: {
      collegeId: 3, // 默认设为计算机科学与工程学院
      collegeName: "计算机科学与工程学院",
      majorId: "all",
      majorName: "全部专业",
    },
  });
```

### 2. 分类映射关系

将旧的分类 ID 映射到新的学院 ID：

| 旧分类 ID | 旧分类名称 | 新学院 ID | 新学院名称           | 建议专业 ID                     |
| --------- | ---------- | --------- | -------------------- | ------------------------------- |
| 1         | 计算机     | 3         | 计算机科学与工程学院 | computer_science_technology     |
| 2         | 医学       | 9         | 药学与生物工程学院   | pharmacy                        |
| 3         | 管理学     | 7         | 管理学院             | business_administration         |
| 4         | 英语       | 10        | 语言与传播学院       | english                         |
| 5         | 法律       | 13        | 重庆知识产权学院     | intellectual_property           |
| 6         | 理工       | 1         | 数学科学学院         | mathematics_applied_mathematics |
| 7         | 艺术       | 10        | 语言与传播学院       | advertising                     |

### 3. 批量更新脚本

```javascript
// 在云函数中执行以下代码进行批量迁移

const db = cloud.database();

// 分类映射表
const categoryMapping = {
  1: {
    collegeId: 3,
    collegeName: "计算机科学与工程学院",
    majorId: "computer_science_technology",
    majorName: "计算机科学与技术",
  },
  2: {
    collegeId: 9,
    collegeName: "药学与生物工程学院",
    majorId: "pharmacy",
    majorName: "药学",
  },
  3: {
    collegeId: 7,
    collegeName: "管理学院",
    majorId: "business_administration",
    majorName: "工商管理",
  },
  4: {
    collegeId: 10,
    collegeName: "语言与传播学院",
    majorId: "english",
    majorName: "英语",
  },
  5: {
    collegeId: 13,
    collegeName: "重庆知识产权学院",
    majorId: "intellectual_property",
    majorName: "知识产权",
  },
  6: {
    collegeId: 1,
    collegeName: "数学科学学院",
    majorId: "mathematics_applied_mathematics",
    majorName: "数学与应用数学",
  },
  7: {
    collegeId: 10,
    collegeName: "语言与传播学院",
    majorId: "advertising",
    majorName: "广告学",
  },
};

// 获取所有需要迁移的图书
const books = await db
  .collection("books")
  .where({
    categoryId: db.command.exists(true),
  })
  .get();

// 批量更新
for (const book of books.data) {
  const mapping = categoryMapping[book.categoryId];
  if (mapping) {
    await db
      .collection("books")
      .doc(book._id)
      .update({
        data: {
          collegeId: mapping.collegeId,
          collegeName: mapping.collegeName,
          majorId: mapping.majorId,
          majorName: mapping.majorName,
        },
      });
  }
}
```

### 4. 验证迁移结果

迁移完成后，验证数据：

```javascript
// 检查所有图书是否都有新字段
const result = await db
  .collection("books")
  .where({
    collegeId: db.command.exists(true),
    collegeName: db.command.exists(true),
    majorId: db.command.exists(true),
    majorName: db.command.exists(true),
  })
  .count();

console.log("已迁移的图书数量:", result.total);
```

### 5. 清理旧字段（可选）

迁移验证无误后，可以选择清理旧的分类字段：

```javascript
// 注意：执行前请确保新系统运行正常
db.collection("books")
  .where({})
  .update({
    data: {
      categoryId: db.command.remove(),
      subCategoryId: db.command.remove(),
    },
  });
```

## 注意事项

1. **备份数据**：执行迁移前请务必备份数据库
2. **逐步迁移**：建议先在测试环境执行，确认无误后再在生产环境执行
3. **兼容性**：新代码已支持向后兼容，可以处理同时存在新旧字段的情况
4. **用户体验**：迁移期间可能需要重新发布小程序版本

## 回滚方案

如果需要回滚到旧分类系统：

```javascript
// 恢复旧分类字段的逆向映射
const reverseMapping = {
  3: 1, // 计算机科学与工程学院 -> 计算机
  9: 2, // 药学与生物工程学院 -> 医学
  7: 3, // 管理学院 -> 管理学
  10: 4, // 语言与传播学院 -> 英语
  13: 5, // 重庆知识产权学院 -> 法律
  1: 6, // 数学科学学院 -> 理工
};

// 执行回滚...
```

