# TennisLink 腾讯云部署指南

## 部署前准备

### 1. 服务器配置
- 腾讯云服务器：建议 2核4GB内存或更高
- 操作系统：Ubuntu 20.04 LTS 或 22.04 LTS
- 安全组：开放 22(SSH)、80(HTTP)、443(HTTPS)、5432(PostgreSQL) 端口

### 2. 本地准备
- 确保本地安装了 Git、Node.js 18+
- 确保可以通过 SSH 连接到服务器
- 准备好域名（可选）

## 部署步骤

### 步骤 1: 服务器环境配置

1. **连接到服务器**
   ```bash
   ssh root@your-server-ip
   ```

2. **运行服务器配置脚本**
   ```bash
   # 上传脚本到服务器
   scp scripts/setup-server.sh root@your-server-ip:/root/
   
   # 在服务器上执行
   chmod +x /root/setup-server.sh
   bash /root/setup-server.sh
   ```

### 步骤 2: 数据库配置

1. **创建数据库用户和数据库**
   ```bash
   # 登录 PostgreSQL
   sudo -u postgres psql
   
   # 创建用户
   CREATE USER tennis_link_user WITH PASSWORD 'your-strong-password';
   
   # 创建数据库
   CREATE DATABASE tennis_link_db OWNER tennis_link_user;
   
   # 授予权限
   GRANT ALL PRIVILEGES ON DATABASE tennis_link_db TO tennis_link_user;
   ALTER USER tennis_link_user WITH SUPERUSER;
   
   # 退出
   \q
   ```

### 步骤 3: 上传项目代码

1. **打包项目**
   ```bash
   # 本地执行
   tar --create --gzip --file=tennis-link-deploy.tar.gz --exclude=.git --exclude=node_modules --exclude=.next --exclude=*.log --exclude=backups --exclude=uploads --exclude=logs --exclude=.env.local --exclude=tests .
   ```

2. **上传到服务器**
   ```bash
   scp tennis-link-deploy.tar.gz root@your-server-ip:/root/
   ```

### 步骤 4: 部署应用

1. **解压并部署**
   ```bash
   # 服务器上执行
   cd /root
   
   # 解压文件
   mkdir -p tennis-link
   tar -xzf tennis-link-deploy.tar.gz -C tennis-link
   cd tennis-link
   
   # 安装依赖
   npm install --production
   
   # 构建项目
   npm run build
   
   # 配置 Nginx
   sudo cp nginx.conf /etc/nginx/sites-available/tennis-link
   sudo ln -sf /etc/nginx/sites-available/tennis-link /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   
   # 启动应用
   sudo pm2 delete tennis-link 2>/dev/null || true
   sudo pm2 start "npm run start" --name "tennis-link"
   sudo pm2 save
   
   # 运行数据库迁移
   npm run db:migrate || echo "数据库迁移可能需要手动执行"
   ```

### 步骤 5: 环境变量配置

1. **创建 .env.production 文件**
   ```bash
   # 服务器上执行
   cd /root/tennis-link
   cp .env.production.example .env.production
   
   # 编辑配置文件
   nano .env.production
   ```

   填写以下配置：
   - 数据库连接信息
   - JWT 密钥
   - 腾讯云 COS 配置
   - 邮件服务配置
   - 其他必要的环境变量

### 步骤 6: SSL 证书配置

1. **申请 SSL 证书**（使用 Let's Encrypt）
   ```bash
   # 服务器上执行
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

2. **配置自动续期**
   ```bash
   sudo crontab -e
   # 添加以下行
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

### 步骤 7: 安全配置

1. **运行安全扫描**
   ```bash
   # 服务器上执行
   cd /root/tennis-link
   npm run security:scan
   ```

2. **配置防火墙**
   ```bash
   sudo ufw status
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

### 步骤 8: 监控和日志配置

1. **配置 PM2 日志**
   ```bash
   sudo pm2 install pm2-logrotate
   sudo pm2 logrotate -c "{\"max_size\": \"10M\", \"retain\": 5, \"compress\": true}"
   ```

2. **查看应用日志**
   ```bash
   pm2 logs tennis-link
   ```

### 步骤 9: 备份配置

1. **配置数据库备份**
   ```bash
   # 创建备份脚本
   nano /root/backup-database.sh
   ```

   添加以下内容：
   ```bash
   #!/bin/bash
   
   BACKUP_DIR="/root/backups"
   DATE=$(date +%Y%m%d_%H%M%S)
   
   mkdir -p $BACKUP_DIR
   
   # 备份数据库
   pg_dump -U tennis_link_user -d tennis_link_db > $BACKUP_DIR/db_backup_$DATE.sql
   
   # 压缩备份
   gzip $BACKUP_DIR/db_backup_$DATE.sql
   
   # 删除 7 天前的备份
   find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
   
   echo "备份完成: $BACKUP_DIR/db_backup_$DATE.sql.gz"
   ```

2. **设置定时备份**
   ```bash
   chmod +x /root/backup-database.sh
   sudo crontab -e
   # 添加以下行（每天凌晨 2 点执行）
   0 2 * * * /root/backup-database.sh
   ```

## 验证部署

### 1. 检查服务状态
```bash
# 检查 Nginx 状态
sudo systemctl status nginx

# 检查 PM2 应用状态
pm2 status

# 检查 PostgreSQL 状态
sudo systemctl status postgresql
```

### 2. 访问应用
- 通过 IP 访问：http://your-server-ip
- 通过域名访问：http://your-domain.com（如果配置了域名）

### 3. 测试功能
- 注册新用户
- 登录系统
- 测试核心功能（如预订场地、教练管理等）

## 故障排查

### 常见问题

1. **应用无法启动**
   - 检查 PM2 日志：`pm2 logs tennis-link`
   - 检查环境变量配置：`cat .env.production`
   - 检查端口占用：`netstat -tulpn | grep :3000`

2. **数据库连接失败**
   - 检查数据库服务状态：`sudo systemctl status postgresql`
   - 检查数据库连接字符串：`cat .env.production | grep DATABASE_URL`
   - 测试数据库连接：`psql -U tennis_link_user -d tennis_link_db`

3. **Nginx 配置错误**
   - 检查 Nginx 配置：`sudo nginx -t`
   - 检查 Nginx 日志：`sudo tail -f /var/log/nginx/error.log`

4. **SSL 证书问题**
   - 检查证书状态：`sudo certbot certificates`
   - 重新申请证书：`sudo certbot --nginx -d your-domain.com`

## 维护建议

1. **定期更新系统**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **定期更新依赖**
   ```bash
   cd /root/tennis-link
   npm update
   ```

3. **定期备份数据**
   - 数据库备份（已配置定时任务）
   - 文件备份：`tar -czf /root/backups/files_backup_$(date +%Y%m%d).tar.gz /root/tennis-link`

4. **监控系统性能**
   ```bash
   # 安装 htop
   sudo apt install htop
   
   # 查看系统资源使用情况
   htop
   ```

## 技术支持

如果遇到部署问题，请联系技术支持：
- 邮箱：support@tennislink.com
- 文档：https://tennislink.com/docs
- 社区：https://tennislink.com/community
