#!/bin/bash

# TennisLink 服务器环境配置脚本
# 用于在腾讯云服务器上安装和配置必要的服务

# 颜色函数
echo_info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
echo_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }
echo_warning() { echo -e "\033[0;33m[WARNING]\033[0m $1"; }
echo_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }

echo_info "开始配置服务器环境..."

# 更新系统
echo_info "更新系统包..."
sudo apt update && sudo apt upgrade -y

# 安装必要的工具
echo_info "安装必要的工具..."
sudo apt install -y curl wget git unzip build-essential

# 安装 Node.js 18+
echo_info "安装 Node.js 18+..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证 Node.js 安装
echo_info "验证 Node.js 安装..."
node -v
npm -v

# 安装 Nginx
echo_info "安装 Nginx..."
sudo apt install -y nginx

# 启动并启用 Nginx
echo_info "启动并启用 Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# 安装 PostgreSQL 14+
echo_info "安装 PostgreSQL 14+..."
sudo apt install -y postgresql postgresql-contrib

# 启动并启用 PostgreSQL
echo_info "启动并启用 PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 配置 PostgreSQL
echo_info "配置 PostgreSQL..."

# 创建数据库用户
echo_info "请输入数据库用户密码："
read -s db_password
sudo -u postgres psql -c "CREATE USER tennis_link_user WITH PASSWORD '$db_password';"

# 创建数据库
sudo -u postgres psql -c "CREATE DATABASE tennis_link_db OWNER tennis_link_user;"

# 配置数据库权限
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tennis_link_db TO tennis_link_user;"
sudo -u postgres psql -c "ALTER USER tennis_link_user WITH SUPERUSER;"

# 配置 PostgreSQL 远程访问（可选）
echo_warning "配置 PostgreSQL 远程访问..."
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/14/main/postgresql.conf
sudo echo "host all all 0.0.0.0/0 md5" >> /etc/postgresql/14/main/pg_hba.conf
sudo systemctl restart postgresql

# 配置防火墙
echo_info "配置防火墙..."
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw allow 5432/tcp # PostgreSQL
sudo ufw allow 5000/tcp # 应用端口
sudo ufw --force enable

# 安装 PM2
echo_info "安装 PM2..."
sudo npm install -g pm2
sudo npm install -g pm2-logrotate
sudo npm install -g pm2-windows-service 2>/dev/null || true

# 启动并启用 PM2 服务
echo_info "启动并启用 PM2 服务..."
sudo pm2 startup systemd
sudo pm2 save

# 验证服务状态
echo_info "验证服务状态..."
systemctl status nginx --no-pager
systemctl status postgresql --no-pager

# 显示配置结果
echo_success "服务器环境配置完成！"
echo_success "========================================"
echo_success "已安装的服务："
echo_success "- Node.js: $(node -v)"
echo_success "- Nginx: 已安装并运行"
echo_success "- PostgreSQL: 已安装并运行"
echo_success "- PM2: 已安装"
echo_success "========================================"
echo_success "防火墙已配置，开放端口：22, 80, 443, 5432, 5000"
echo_success "========================================"
echo_info "下一步：执行部署脚本部署项目"
