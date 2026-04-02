# TennisLink 支付功能配置指南

## 📋 功能概览

TennisLink 支持以下支付功能：
- ✅ 支付宝支付（生产环境支持）
- ✅ 微信支付（模拟实现，需后续集成）
- ✅ 支付订单管理
- ✅ 支付状态回调
- ✅ 退款功能
- ✅ 提现功能（支付宝转账）

## 🔧 支付配置

### 1. 环境变量配置

在 `.env.production` 文件中添加以下配置：

```env
# ============================================
# 支付宝支付配置（必需）
# ============================================
ALIPAY_APP_ID=2021000000000000  # 替换为真实的支付宝应用ID
ALIPAY_PRIVATE_KEY=your-private-key-here  # 替换为真实的应用私钥
ALIPAY_PUBLIC_KEY=your-public-key-here  # 替换为真实的支付宝公钥
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do  # 生产环境网关
ALIPAY_NOTIFY_URL=https://your-domain.com/api/payments/notify/alipay  # 替换为真实域名

# ============================================
# 微信支付配置（可选）
# ============================================
WECHAT_PAY_MCH_ID=your-mch-id-here
WECHAT_PAY_API_V3_KEY=your-api-v3-key-here
WECHAT_PAY_APPID=your-wechat-appid-here
WECHAT_PAY_NOTIFY_URL=https://your-domain.com/api/payments/notify/wechat

# ============================================
# 基础配置
# ============================================
NEXT_PUBLIC_DOMAIN=https://your-domain.com  # 替换为真实域名
```

### 2. 支付宝开放平台配置

1. **注册支付宝开放平台账号**：
   - 访问 https://open.alipay.com
   - 注册企业账号并完成实名认证

2. **创建应用**：
   - 进入「开发者中心」→「创建应用」
   - 应用类型选择「自开发应用」
   - 填写应用信息并提交审核

3. **获取应用信息**：
   - 应用审核通过后，获取 `APPID`
   - 在「开发设置」中设置「接口加签方式」
   - 生成并下载应用私钥和公钥

4. **配置回调地址**：
   - 在「开发设置」→「授权回调地址」中添加：
     ```
     https://your-domain.com/api/payments/notify/alipay
     ```

5. **添加接口权限**：
   - 申请以下接口权限：
     - 电脑网站支付
     - 手机网站支付
     - 交易退款
     - 资金转账

### 3. 服务器配置

#### Nginx 配置
确保 Nginx 正确配置了 HTTPS 和路由转发：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 支付回调地址
    location /api/payments/notify/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🚀 支付流程

### 1. 创建支付订单

**API**: `POST /api/payment/create`

**请求参数**:
```json
{
  "amount": 1000,  // 支付金额（分）
  "orderId": "ORDER_20260331_001",  // 订单ID
  "description": "网球课程预约",  // 订单描述
  "paymentMethod": "alipay",  // 支付方式: alipay 或 wechat
  "userId": "user-001",  // 用户ID
  "returnUrl": "https://your-domain.com/payment/success"  // 支付成功跳转地址
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "transactionId": "ALIPAY_1620000000000_ABCDEF",
    "orderId": "ORDER_20260331_001",
    "amount": 1000,
    "status": "pending",
    "paymentMethod": "alipay",
    "paymentUrl": "https://openapi.alipay.com/gateway.do?charset=utf-8&..."  // 支付宝收银台URL
  },
  "message": "支付宝支付订单创建成功"
}
```

### 2. 支付回调处理

**支付宝异步回调**：`POST /api/payments/notify/alipay`
- 支付宝服务器会向此地址发送支付结果通知
- 系统自动验证签名并更新订单状态
- 触发相应的业务逻辑（如预约确认、会员激活等）

**支付宝同步回调**：`GET /api/payments/notify/alipay`
- 用户支付完成后跳转到的地址
- 系统验证签名并跳转到支付成功页面

### 3. 查询支付状态

**API**: `GET /api/payment/query?transactionId=ALIPAY_1620000000000_ABCDEF`

**响应**:
```json
{
  "success": true,
  "data": {
    "transactionId": "ALIPAY_1620000000000_ABCDEF",
    "orderId": "ORDER_20260331_001",
    "amount": 1000,
    "status": "paid",
    "paymentMethod": "alipay",
    "paidAt": "2026-03-31T12:00:00Z"
  },
  "message": "查询成功"
}
```

### 4. 退款处理

**API**: `POST /api/payment/refund`

**请求参数**:
```json
{
  "transactionId": "ALIPAY_1620000000000_ABCDEF",
  "amount": 1000,  // 退款金额（分）
  "reason": "课程取消"
}
```

## 🔍 配置检查

### 检查支付配置状态

**API**: `GET /api/payment/config-check`

**响应**:
```json
{
  "success": true,
  "ready": true,
  "configured": ["ALIPAY_APP_ID", "ALIPAY_PRIVATE_KEY", "ALIPAY_PUBLIC_KEY", "ALIPAY_GATEWAY", "NEXT_PUBLIC_DOMAIN"],
  "missing": [],
  "message": "支付宝支付配置完整，可以正常使用"
}
```

### 测试支付功能

1. **访问支付测试页面**：
   - 地址：`https://your-domain.com/payment/test`
   - 填写测试订单信息
   - 点击「创建订单并支付」

2. **使用支付宝沙箱测试**：
   - 在 `.env.sandbox` 中配置沙箱环境
   - 使用沙箱账号进行测试支付

## 📊 支付功能集成点

### 1. 课程预约支付
- 用户预约课程时，系统自动创建支付订单
- 支付成功后，预约状态更新为「已确认」
- 发送预约确认通知给用户和教练

### 2. 会员资格支付
- 用户购买会员时，系统创建支付订单
- 支付成功后，会员资格激活
- 发送会员激活通知

### 3. 商品购买支付
- 用户购买商品时，系统创建支付订单
- 支付成功后，更新商品库存
- 发送订单确认通知

### 4. 教练提现
- 教练申请提现时，系统创建提现订单
- 管理员审核后，通过支付宝转账
- 发送提现成功通知

## 🔒 安全措施

1. **数据加密**：
   - 支付宝私钥和公钥安全存储
   - 敏感信息不直接存储在代码中

2. **签名验证**：
   - 所有支付宝回调都进行签名验证
   - 防止伪造支付通知

3. **错误处理**：
   - 完善的错误处理和日志记录
   - 支付失败时的重试机制

4. **速率限制**：
   - 对支付API进行速率限制
   - 防止恶意请求

## 🛠 故障排查

### 常见问题

1. **支付配置不完整**：
   - 检查环境变量是否正确设置
   - 访问 `/api/payment/config-check` 查看配置状态

2. **支付回调失败**：
   - 检查回调地址是否可访问
   - 查看服务器日志中的错误信息
   - 确保 Nginx 配置正确

3. **签名验证失败**：
   - 检查支付宝公钥是否正确
   - 确认私钥格式是否正确

4. **支付状态更新失败**：
   - 检查数据库连接是否正常
   - 查看支付管理器的日志

## 📞 技术支持

如有问题，请联系技术支持：
- 邮箱：support@tennislink.com
- 电话：400-123-4567

---

**最后更新时间**：2026-03-31
**版本**：1.0.0
