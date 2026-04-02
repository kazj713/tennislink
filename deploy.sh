#!/bin/bash

# ============================================# TennisLink 部署脚本# 用于将项目部署到腾讯云服务器# ============================================

# 服务器配置SERVER_IP="your-server-ip"USERNAME="your-username"DOMAIN="ydtenhub.online"
# 本地项目路径LOCAL_PROJECT_PATH="."# 服务器项目路径SERVER_PROJECT_PATH="/var/www/tennis-link"
# 颜色定义RED='\033[0;31m'GREEN='\033[0;32m'YELLOW='\033[1;33m'NC='\033[0m' # No Color
# 显示信息函数info() {    echo -e "${GREEN}[INFO]${NC} $1"}
warning() {    echo -e "${YELLOW}[WARNING]${NC} $1"}
error() {    echo -e "${RED}[ERROR]${NC} $1"}
# 检查本地环境check_local_environment() {    info "检查本地环境..."
    # 检查是否安装了 rsync    if ! command -v rsync &> /dev/null; then        error "未安装 rsync，请先安装 rsync: apt-get install rsync 或 brew install rsync"        exit 1    fi
    # 检查是否存在构建产物    if [ ! -d "$LOCAL_PROJECT_PATH/.next" ]; then        error "未找到构建产物，请先运行 npm run build"        exit 1    fi
    # 检查是否存在环境变量文件    if [ ! -f "$LOCAL_PROJECT_PATH/.env.production" ]; then        error "未找到 .env.production 文件"        exit 1    fi
    info "本地环境检查通过"
}

# 连接服务器并准备环境prepare_server() {    info "连接服务器并准备环境..."
    # 创建项目目录    ssh $USERNAME@$SERVER_IP "mkdir -p $SERVER_PROJECT_PATH"
    # 检查 Node.js 是否安装    ssh $USERNAME@$SERVER_IP "if ! command -v node &> /dev/null; then        echo 'Node.js 未安装，正在安装...'        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -        sudo apt-get install -y nodejs    fi"
    # 检查 npm 是否安装    ssh $USERNAME@$SERVER_IP "if ! command -v npm &> /dev/null; then        echo 'npm 未安装，正在安装...'        sudo apt-get install -y npm    fi"
    info "服务器环境准备完成"
}

# 上传项目文件upload_files() {    info "上传项目文件..."
    # 排除不需要上传的文件    rsync -avz --exclude=".git" --exclude=".env.local" --exclude="node_modules" --exclude=".next/cache" $LOCAL_PROJECT_PATH/ $USERNAME@$SERVER_IP:$SERVER_PROJECT_PATH/
    if [ $? -eq 0 ]; then        info "文件上传成功"
    else        error "文件上传失败"
        exit 1    fi
}

# 安装依赖并构建install_dependencies() {    info "安装依赖并构建..."
    ssh $USERNAME@$SERVER_IP "cd $SERVER_PROJECT_PATH && npm install --production"
    if [ $? -eq 0 ]; then        info "依赖安装成功"
    else        error "依赖安装失败"
        exit 1    fi
}

# 配置 Nginxconfigure_nginx() {    info "配置 Nginx..."
    # 创建 Nginx 配置文件    ssh $USERNAME@$SERVER_IP "cat > /etc/nginx/sites-available/tennis-link << 'EOF'
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF"
    # 启用站点    ssh $USERNAME@$SERVER_IP "ln -sf /etc/nginx/sites-available/tennis-link /etc/nginx/sites-enabled/"
    # 测试 Nginx 配置    ssh $USERNAME@$SERVER_IP "nginx -t"
    if [ $? -eq 0 ]; then        # 重启 Nginx        ssh $USERNAME@$SERVER_IP "sudo systemctl restart nginx"
        info "Nginx 配置成功"
    else        error "Nginx 配置失败"
        exit 1    fi
}

# 配置 PM2configure_pm2() {    info "配置 PM2 进程管理..."
    # 安装 PM2    ssh $USERNAME@$SERVER_IP "npm install -g pm2"
    # 创建 PM2 配置文件    ssh $USERNAME@$SERVER_IP "cat > $SERVER_PROJECT_PATH/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'tennis-link',
      script: 'npm',
      args: 'run start',
      cwd: '/var/www/tennis-link',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF"
    # 启动应用    ssh $USERNAME@$SERVER_IP "cd $SERVER_PROJECT_PATH && pm2 start ecosystem.config.js"
    # 设置 PM2 开机自启    ssh $USERNAME@$SERVER_IP "pm2 save && pm2 startup"
    info "PM2 配置成功"
}

# 配置 SSL 证书configure_ssl() {    info "配置 SSL 证书..."
    # 安装 certbot    ssh $USERNAME@$SERVER_IP "sudo apt-get install -y certbot python3-certbot-nginx"
    # 申请 SSL 证书    ssh $USERNAME@$SERVER_IP "sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN"
    if [ $? -eq 0 ]; then        info "SSL 证书配置成功"
    else        warning "SSL 证书配置失败，可能需要手动配置"
    fi
}

# 健康检查health_check() {    info "进行健康检查..."
    sleep 10    # 检查应用是否运行    ssh $USERNAME@$SERVER_IP "pm2 status"
    # 检查 Nginx 是否运行    ssh $USERNAME@$SERVER_IP "sudo systemctl status nginx"
    info "健康检查完成"
}

# 主函数main() {    info "开始部署 TennisLink 项目..."
    
    # 检查本地环境    check_local_environment
    
    # 准备服务器环境    prepare_server
    
    # 上传项目文件    upload_files
    
    # 安装依赖    install_dependencies
    
    # 配置 Nginx    configure_nginx
    
    # 配置 SSL 证书    configure_ssl
    
    # 配置 PM2    configure_pm2
    
    # 健康检查    health_check
    
    info "部署完成！您的应用已成功部署到 https://$DOMAIN"
    info "请确保服务器安全组已开放 80 和 443 端口"
}

# 运行主函数main