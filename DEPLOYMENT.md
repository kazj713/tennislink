# TennisLink 生产环境部署指南

本文档指导将 TennisLink 部署到自有 Linux 服务器上，使用 PM2 + Nginx 方案。

---

## 一、部署架构概览

```
用户 → Nginx (SSL/反向代理) → PM2 (Node.js 进程管理) → Next.js 应用
                              ↓
                         PostgreSQL 数据库
                         Redis 缓存 (可选)
```

**技术栈：**
- Node.js 20+
- PostgreSQL 16
- Nginx 1.24+
- PM2 5.x

---

## 二、服务器环境准备

### 2.1 安装 Node.js 20

```bash
# 使用 nvm 安装（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# 验证
node -v   # v20.x.x
npm -v    # 10.x.x
```

### 2.2 安装 PostgreSQL 16

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql
```

在 psql 中执行：
```sql
CREATE USER tennislink WITH PASSWORD '你的强密码';
CREATE DATABASE tennis_link_production OWNER tennislink;
GRANT ALL PRIVILEGES ON DATABASE tennis_link_production TO tennislink;
\q
```

### 2.3 安装 Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.4 安装 PM2

```bash
npm install -g pm2
pm2 startup systemd  # 设置开机自启（按输出提示执行）
pm2 save
```

### 2.5 安装 SSL 证书（Let's Encrypt）

```bash
# 安装 certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书（替换为你的域名）
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 3 * * * certbot renew --quiet
```

---

## 三、项目部署

### 3.1 上传代码到服务器

```bash
# 在本地打包代码
cd /path/to/tennislink
tar czf tennislink.tar.gz --exclude='node_modules' --exclude='.next' .

# 上传到服务器
scp tennislink.tar.gz user@your-server:/opt/
ssh user@your-server

# 在服务器上解压
cd /opt
mkdir -p tennislink && cd tennislink
tar xzf ../tennislink.tar.gz
npm ci --production=false  # 安装所有依赖（含 devDependencies 用于构建）
```

### 3.2 配置环境变量

```bash
cp .env.example .env.production
nano .env.production
```

#### 必须配置的环境变量（⚠️ 不配置无法启动）

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://tennislink:密码@localhost:5432/tennis_link_production` |
| `JWT_SECRET` | JWT 签名密钥 | 用 `openssl rand -base64 32` 生成 |
| `ENCRYPTION_KEY` | 数据加密密钥 | 用 `openssl rand -base64 32` 生成 |
| `NEXT_PUBLIC_DOMAIN` | 你的域名 | `https://your-domain.com` |

#### 管理员账号配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `SEED_ADMIN_EMAIL` | 管理员邮箱 | `admin@tennislink.com` |
| `SEED_ADMIN_PASSWORD` | 管理员密码 | `admin123456`（生产请修改！）|

> ⚠️ **生产环境务必修改 SEED_ADMIN_PASSWORD 为强密码！**

#### 支付功能（可选）

| 变量名 | 说明 |
|--------|------|
| `ALIPAY_APP_ID` | 支付宝应用 ID |
| `ALIPAY_PRIVATE_KEY` | 支付宝 RSA2 私钥 |
| `ALIPAY_PUBLIC_KEY` | 支付宝公钥 |
| `ALIPAY_GATEWAY` | 支付宝网关地址（沙箱或正式） |
| `WECHAT_PAY_MCH_ID` | 微信商户号 |
| `WECHAT_PAY_API_V3_KEY` | 微信支付 APIv3 密钥 |
| `WECHAT_PAY_APPID` | 微信应用 AppID |

#### 注册验证（可选）

| 变量名 | 说明 |
|--------|------|
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP 邮件服务配置 |
| `ALIYUN_ACCESS_KEY_ID` / `ALIYUN_ACCESS_KEY_SECRET` | 阿里云短信服务 |
| `ALIYUN_SMS_SIGN_NAME` / `ALIYUN_SMS_TEMPLATE_CODE` | 短信签名和模板 |

#### 文件存储（可选）

| 变量名 | 说明 |
|--------|------|
| `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET` | 阿里云 OSS |
| `OSS_BUCKET` / `OSS_REGION` | OSS 存储桶和区域 |

#### 微信登录（扫码登录需要）

| 变量名 | 说明 |
|--------|------|
| `WECHAT_APP_ID` | 微信小程序 AppID |
| `WECHAT_APP_SECRET` | 微信小程序 AppSecret |

### 3.3 初始化数据库

**方式 A：使用 API 初始化（推荐）**

启动开发模式后访问：
```bash
# 先临时启动一次用于初始化
npm run dev &
sleep 5

# 调用初始化 API
curl http://localhost:5000/api/dev/init-db
# 输出: {"success":true,"message":"数据库初始化完成"}

# 插入种子数据（管理员账号等）
curl http://localhost:5000/api/dev/seed
# 输出: {"success":true,...}

# 停止开发模式
kill %1
```

**方式 B：使用 Drizzle ORM 命令行**

```bash
# 推送 schema 到数据库（开发/测试环境）
npx drizzle-kit push

# 或使用迁移文件（生产环境推荐）
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 3.4 构建生产版本

```bash
# 构建
npm run build

# 或使用自定义脚本（如果 package.json 中有 prod:build）
NODE_ENV=production npm run prod:build
```

### 3.5 配置 PM2

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [
    {
      name: 'tennislink',
      script: './node_modules/.bin/next',
      args: 'start',
      cwd: '/opt/tennislink',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        HOSTNAME: '0.0.0.0',
      },
      env_file: '.env.production',
      instances: 1, // Next.js 不建议多实例（除非配置共享 session store）
      autorestart: true,
      max_memory_restart: '512M',
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/tennislink/error.log',
      out_file: '/var/log/tennislink/out.log',
      merge_logs: true,
    },
  ],
};
```

启动：
```bash
# 创建日志目录
sudo mkdir -p /var/log/tennislink

# 启动
pm2 start ecosystem.config.js

# 查看状态
pm2 status
pm2 logs tennislink --lines 50

# 保存进程列表
pm2 save
```

---

## 四、Nginx 配置

编辑 `/etc/nginx/sites-available/tennislink`：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 证书（certbot 自动配置）
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # 反向代理到 PM2
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # 静态资源缓存
    location /_next/static {
        proxy_pass http://127.0.0.1:5000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # 图片资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://127.0.0.1:5000;
        expires 30d;
        add_header Cache-Control "public";
    }

    # 限制上传大小
    client_max_body_size 20M;

    # 安全头（如果 Next.js 未配置）
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

启用并重载：
```bash
sudo ln -sf /etc/nginx/sites-available/tennislink /etc/nginx/sites-enabled/
sudo nginx -t          # 测试配置
sudo systemctl reload nginx
```

---

## 五、日常运维

### 5.1 更新部署

```bash
cd /opt/tennislink
git pull origin main           # 或重新上传代码包
npm ci                          # 更新依赖
npm run build                   # 重新构建
pm2 restart tennislink          # 重启服务
pm2 logs tennislink --lines 30  # 检查日志
```

### 5.2 备份数据库

```bash
# 手动备份
pg_dump -U tennislink tennis_link_production > backup_$(date +%Y%m%d).sql

# 定时备份（crontab）
# 0 2 * * * pg_dump -U tennislink tennis_link_production > /backup/tennis_$(date +\%Y\%m\%d).sql
```

### 5.3 查看 PM2 监控

```bash
pm2 monit       # 实时监控面板
pm2 list        # 进程列表
pm2 info tennislink # 详细信息
```

---

## 六、常见问题排查

### Q1: 启动报错 "JWT_SECRET is required"
**原因**: 环境变量未配置 JWT_SECRET
**解决**: 在 .env.production 中添加 `JWT_SECRET=xxx`（用 openssl 生成）

### Q2: 页面显示 "获取数据失败"
**原因**: 数据库未连接或表不存在
**解决**: 
1. 检查 DATABASE_URL 是否正确
2. 访问 `/api/dev/init-db` 初始化表
3. 查看 PM2 日志 `pm2 logs tennislink`

### Q3: 502 Bad Gateway
**原因**: PM2 进程未运行或端口不对
**解决**:
```bash
pm2 status          # 检查进程状态
pm2 restart all     # 重启
netstat -tlnp | grep 5000  # 检查端口占用
```

### Q4: 支付回调失败
**原因**: 支付回调 URL 无法从外网访问
**解决**: 
1. 确保 ALIPAY_NOTIFY_URL 和 WECHAT_PAY_NOTIFY_URL 配置为公网可访问的 HTTPS 地址
2. Nginx 的 443 端口已开放
3. 服务器防火墙放行 80/443 端口

### Q5: 内存不足导致进程重启
**原因**: max_memory_restart 触发
**解决**:
```bash
# 增加内存限制
# 在 ecosystem.config.js 中修改 max_memory_restart: '1G'

# 或优化 Node.js 内存
export NODE_OPTIONS="--max-old-space-size=1024"
pm2 restart tennislink
```

### Q6: 微信扫码登录不工作
**原因**: WECHAT_APP_ID / WECHAT_APP_SECRET 未配置或错误
**解决**:
1. 确保微信小程序已发布且 AppID 正确
2. 小程序中 login/index 页面需处理 scene 参数并调用后端 wechat-login API
3. 开发模式下会显示占位二维码，生产环境需配置真实凭证

### Q7: 邮件/短信验证码收不到
**原因**: SMTP 或阿里云 SMS 未配置
**解决**: 
1. 邮箱：检查 SMTP_HOST/PORT/USER/PASS 是否正确，确保发件邮箱开启了 SMTP 服务
2. 短信：检查阿里云 AccessKey、签名是否通过审核、模板是否审核通过

---

## 七、安全检查清单

- [ ] JWT_SECRET 和 ENCRYPTION_KEY 使用了随机生成的强密钥
- [ ] SEED_ADMIN_PASSWORD 已修改为非默认密码
- [ ] PostgreSQL 使用了独立用户和强密码
- [ ] Nginx 配置了 SSL/TLS（HTTPS）
- [ ] 防火墙仅开放 22(SSH)、80(HTTP)、443(HTTPS) 端口
- [ ] 数据库端口 5432 仅允许 localhost 访问
- [ ] 定期备份数据库
- [ ] PM2 日志定期轮转（logrotate）
- [ ] Node.js 版本保持更新
- [ ] 依赖定期更新（`npm audit`）

---

## 八、快速部署脚本（一键部署参考）

```bash
#!/bin/bash
set -e

echo "=== TennisLink 一键部署 ==="

# 1. 安装依赖
echo "[1/6] 安装依赖..."
npm ci

# 2. 构建项目
echo "[2/6] 构建项目..."
npm run build

# 3. 初始化数据库
echo "[3/6] 初始化数据库..."
timeout 30s npm run dev &
PID=$!
sleep 8
curl -sf http://localhost:5000/api/dev/init-db || echo "警告: init-db 可能失败"
curl -sf http://localhost:5000/api/dev/seed || echo "警告: seed 可能失败"
kill $PID 2>/dev/null || true

# 4. 重启 PM2
echo "[4/6] 启动服务..."
pm2 restart tennislink || pm2 start ecosystem.config.js
pm2 save

# 5. 重载 Nginx
echo "[5/6] 重载 Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=== 部署完成 ==="
echo "访问: https://your-domain.com"
echo "管理员: admin@tennislink.com"
echo "查看日志: pm2 logs tennislink"
```
