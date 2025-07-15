# 微信支付接入部署指南

## 概述

本文档介绍如何在校园书商微信小程序中接入微信云开发支付功能。

## 前置条件

- 已有微信小程序账号（非个人）
- 已开通微信云开发
- 商户号：1716913038
- 云开发环境 ID：cloud1-8gbfcrr39555713f

## 部署步骤

### 1. 上传云函数

#### 1.1 上传支付云函数

```bash
# 在微信开发者工具中
1. 右键点击 cloudfunctions/payment 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成
```

#### 1.2 更新订单云函数

```bash
# 在微信开发者工具中
1. 右键点击 cloudfunctions/orders 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成
```

### 2. 配置微信商户平台

#### 2.1 登录微信商户平台

- 网址：https://pay.weixin.qq.com/
- 使用商户号 1716913038 登录

#### 2.2 配置 API 密钥

1. 进入"账户中心" → "API 安全"
2. 设置 API v3 密钥（32 位）
3. 下载 API 证书

#### 2.3 配置支付目录

1. 进入"产品中心" → "开发配置"
2. 添加支付授权目录：
   - https://servicewechat.com/（小程序支付域名）

#### 2.4 关联小程序

1. 进入"产品中心" → "APPID 授权管理"
2. 添加授权：
   - APPID：你的小程序 APPID
   - 授权类型：JSAPI 支付

### 3. 配置云开发支付

#### 3.1 开通云开发支付

1. 登录微信云开发控制台
2. 选择环境：cloud1-8gbfcrr39555713f
3. 进入"云开发" → "云支付"
4. 点击"开通云支付"

#### 3.2 配置商户信息

```javascript
// 在支付云函数中已配置
{
  subMchId: '1716913038', // 商户号
  envId: 'cloud1-8gbfcrr39555713f', // 环境ID
  functionName: 'payment' // 支付回调云函数
}
```

### 4. 配置支付回调

#### 4.1 云函数回调配置

支付成功后，微信会自动调用 `payment` 云函数的 `paymentNotify` 方法。

#### 4.2 回调处理逻辑

```javascript
// 已在 payment/index.js 中实现
-验证支付结果 - 更新订单状态 - 扣减商品库存 - 记录交易信息;
```

### 5. 测试支付功能

#### 5.1 测试流程

1. 创建测试订单
2. 点击"立即支付"按钮
3. 调起微信支付
4. 完成支付
5. 验证订单状态更新

#### 5.2 测试要点

- 支付金额正确性
- 订单状态流转
- 库存扣减
- 支付回调处理

## 关键文件说明

### 云函数文件

- `cloudfunctions/payment/index.js` - 支付云函数主文件
- `cloudfunctions/payment/package.json` - 支付云函数依赖配置
- `cloudfunctions/orders/index.js` - 订单云函数（已更新支付逻辑）

### 前端文件

- `miniprogram/pages/orders/orders.ts` - 订单页面支付逻辑

## 支付流程图

```
用户点击支付
    ↓
调用orders云函数
    ↓
orders云函数调用payment云函数
    ↓
payment云函数调用微信统一下单API
    ↓
返回支付参数给前端
    ↓
前端调用wx.requestPayment
    ↓
用户完成支付
    ↓
微信服务器回调payment云函数
    ↓
更新订单状态和库存
```

## 注意事项

1. **商户号配置**：确保商户号 1716913038 已正确配置
2. **证书安全**：API 证书需要妥善保管，不要泄露
3. **金额单位**：微信支付金额单位为分，需要转换
4. **回调验证**：支付回调需要验证签名和金额
5. **错误处理**：完善支付失败的错误处理逻辑

## 常见问题

### Q: 支付时提示"商户号配置错误"

A: 检查 payment 云函数中的 subMchId 是否正确设置为 1716913038

### Q: 支付成功但订单状态未更新

A: 检查支付回调云函数是否正常执行，查看云函数日志

### Q: 支付时提示"签名错误"

A: 检查商户平台的 API 密钥配置是否正确

## 相关文档

- [微信支付开发文档](https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml)
- [微信云开发支付文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/wechatpay.html)
- [微信小程序支付 API](https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestPayment.html)
