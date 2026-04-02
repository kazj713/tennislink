# TennisLink - 网球预约平台

TennisLink 是一个专业的网球预约平台，连接网球教练和学员，提供课程预约、场地预订、社区交流等功能。

## 🎾 功能特性

- **用户管理**：学员、教练、管理员多角色系统
- **课程预约**：在线预约网球课程，支持多种课程类型
- **场地预订**：预订网球场地，查看场地可用时间
- **教练管理**：教练入驻、认证、课程管理
- **支付系统**：集成支付宝支付，支持退款和提现
- **社区功能**：帖子发布、评论、点赞
- **后台管理**：数据统计、用户管理、订单管理

## 🚀 技术栈

- **前端**：Next.js 16 + React 19 + TypeScript 6 + Tailwind CSS 4
- **后端**：Next.js API Routes + Node.js
- **数据库**：PostgreSQL + Drizzle ORM
- **支付**：支付宝 SDK + 微信支付
- **部署**：Nginx + PM2

## 📦 安装部署

### 环境要求

- Node.js 18+
- PostgreSQL 14+
- npm 或 pnpm

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/tennis-link.git
   cd tennis-link
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 文件，填写必要的配置
   ```

4. **数据库迁移**
   ```bash
   npm run db:migrate
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

6. **生产构建**
   ```bash
   npm run build
   npm run start
   ```

## 🔧 配置说明

### 支付宝支付配置

详细配置请参考 [PAYMENT_SETUP.md](./PAYMENT_SETUP.md)

### 环境变量

| 变量名 | 说明 | 必需 |
|-------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | ✅ |
| `JWT_SECRET` | JWT 签名密钥 | ✅ |
| `ALIPAY_APP_ID` | 支付宝应用 ID | ✅ |
| `ALIPAY_PRIVATE_KEY` | 支付宝应用私钥 | ✅ |
| `ALIPAY_PUBLIC_KEY` | 支付宝公钥 | ✅ |
| `NEXT_PUBLIC_DOMAIN` | 网站域名 | ✅ |

## 📖 文档

- [部署指南](./DEPLOYMENT_GUIDE.md)
- [支付配置](./PAYMENT_SETUP.md)

## 🛡️ 安全

- 所有敏感信息通过环境变量配置
- JWT Token 身份验证
- 支付签名验证
- 速率限制保护
- SQL 注入防护

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 联系

- 邮箱：support@tennislink.com
- 网站：https://tennislink.com

---

**版本**：1.0.0  
**最后更新**：2026-03-31
