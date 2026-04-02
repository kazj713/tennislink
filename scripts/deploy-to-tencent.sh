#!/bin/bash

# TennisLink 腾讯云部署脚本 (Bash 版本)

# 颜色函数
echo_info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
echo_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }
echo_warning() { echo -e "\033[0;33m[WARNING]\033[0m $1"; }
echo_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }

if [ $# -ne 1 ]; then
    echo_error "用法: ./scripts/deploy-to-tencent.sh <服务器IP>"
    exit 1
fi

SERVER_IP=$1
USERNAME="root"

set -e

echo_info "开始部署到腾讯云服务器..."
echo_info "服务器 IP: $SERVER_IP"
echo_info "用户名：$USERNAME"

# 检查 SSH 连接
echo_info "检查 SSH 连接..."
if ! nc -z $SERVER_IP 22; then
    echo_error "无法连接到服务器的 22 端口"
    echo_error "请检查："
    echo_error "  1. 服务器 IP 是否正确"
    echo_error "  2. SSH 服务是否运行"
    echo_error "  3. 安全组是否开放 22 端口"
    exit 1
fi
echo_success "SSH 连接正常"

# 检查环境变量文件
if [ ! -f ".env.production" ]; then
    echo_warning ".env.production 文件不存在"
    if [ -f ".env.production.example" ]; then
        echo_info "复制 .env.production.example 到 .env.production"
        cp .env.production.example .env.production
        echo_error "请先编辑 .env.production 文件，配置正确的值后重新运行"
        exit 1
    fi
fi

# 创建临时打包文件
TEMP_FILE="/tmp/tennis-link-deploy.tar.gz"
echo_info "打包项目文件到：$TEMP_FILE"

# 排除的文件和目录
EXCLUDE_PATTERNS=("--exclude=.git" "--exclude=node_modules" "--exclude=.next" "--exclude=*.log" "--exclude=backups" "--exclude=uploads" "--exclude=logs" "--exclude=.env.local" "--exclude=tests")

echo_info "开始打包..."
tar --create --gzip --file=$TEMP_FILE --force-local "${EXCLUDE_PATTERNS[@]}" --directory=$(pwd) .

FILE_SIZE=$(ls -lh $TEMP_FILE | awk '{print $5}')
echo_success "打包完成，大小：$FILE_SIZE"

# 上传到服务器
echo_info "上传到服务器..."
scp $TEMP_FILE "${USERNAME}@${SERVER_IP}:/root/"
echo_success "上传成功"

# 在服务器上执行部署
echo_info "在服务器上执行部署脚本..."

ssh "${USERNAME}@${SERVER_IP}" << 'EOF'
set -e
cd /root

echo "正在解压文件..."

# 备份旧版本
if [ -d "tennis-link" ]; then
    echo "备份旧版本..."
    mv tennis-link tennis-link.backup.$(date +%Y%m%d_%H%M%S)
fi

# 创建并解压
mkdir -p tennis-link
tar -xzf tennis-link-deploy.tar.gz -C tennis-link
cd tennis-link

# 安装依赖
echo "安装依赖..."
npm install --production

# 构建项目
echo "构建项目..."
npm run build

# 配置 Nginx
echo "配置 Nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/tennis-link
sudo ln -sf /etc/nginx/sites-available/tennis-link /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 启动应用
echo "启动应用..."
sudo pm2 delete tennis-link 2>/dev/null || true
sudo pm2 start "npm run start" --name "tennis-link"
sudo pm2 save

# 数据库迁移
echo "运行数据库迁移..."
npm run db:migrate || echo "数据库迁移可能需要手动执行"

# 清理
rm -f /root/tennis-link-deploy.tar.gz

echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo "访问地址：http://${SERVER_IP}"
echo "查看日志：pm2 logs tennis-link"
echo ""
EOF

# 清理临时文件
rm -f $TEMP_FILE

echo_success "部署脚本执行完毕！"