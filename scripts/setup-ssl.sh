#!/bin/bash

# SSL 证书部署脚本
# 支持 Let's Encrypt 和腾讯云 SSL 证书

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取域名
read -p "请输入你的域名 (例如: tennislink.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    print_error "域名不能为空"
    exit 1
fi

print_info "配置域名: $DOMAIN"

# 创建 SSL 目录
mkdir -p /root/tennis-link/ssl
cd /root/tennis-link

# 选择 SSL 方式
echo ""
echo "请选择 SSL 证书获取方式:"
echo "1) Let's Encrypt (免费，自动续期)"
echo "2) 腾讯云 SSL 证书"
echo "3) 已有证书文件"
read -p "请选择 (1-3): " SSL_CHOICE

case $SSL_CHOICE in
    1)
        print_info "使用 Let's Encrypt 获取证书..."
        
        # 安装 Certbot
        if ! command -v certbot &> /dev/null; then
            print_info "安装 Certbot..."
            apt-get update
            apt-get install -y certbot
        fi
        
        # 获取证书
        print_info "正在获取证书，请确保域名已解析到本服务器..."
        certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --agree-tos -n --email admin@$DOMAIN || {
            print_error "证书获取失败，请检查:"
            print_error "1. 域名是否正确解析到本服务器 IP"
            print_error "2. 80 端口是否被占用"
            print_error "3. 防火墙是否放行 80 端口"
            exit 1
        }
        
        # 复制证书
        cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/
        cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/
        
        # 设置自动续期
        print_info "设置自动续期..."
        (crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --quiet --deploy-hook 'systemctl restart nginx'") | crontab -
        
        print_success "Let's Encrypt 证书配置完成！"
        print_info "证书会自动续期，无需手动操作"
        ;;
        
    2)
        print_info "使用腾讯云 SSL 证书..."
        print_info "请确保已通过 WinSCP 上传证书文件到 /root/tennis-link/ssl/"
        print_info "需要的文件:"
        print_info "  - fullchain.pem (证书文件)"
        print_info "  - privkey.pem (私钥文件)"
        
        read -p "证书文件已上传? (y/n): " CONFIRM
        if [ "$CONFIRM" != "y" ]; then
            print_error "请先上传证书文件"
            exit 1
        fi
        
        if [ ! -f "ssl/fullchain.pem" ] || [ ! -f "ssl/privkey.pem" ]; then
            print_error "证书文件不存在，请检查文件是否已上传到 ssl/ 目录"
            exit 1
        fi
        
        print_success "腾讯云证书配置完成！"
        ;;
        
    3)
        print_info "使用已有证书..."
        print_info "请确保证书文件已上传到 /root/tennis-link/ssl/"
        print_info "需要的文件:"
        print_info "  - fullchain.pem (证书文件，包含中间证书)"
        print_info "  - privkey.pem (私钥文件)"
        
        read -p "证书文件已上传? (y/n): " CONFIRM
        if [ "$CONFIRM" != "y" ]; then
            print_error "请先上传证书文件"
            exit 1
        fi
        
        if [ ! -f "ssl/fullchain.pem" ] || [ ! -f "ssl/privkey.pem" ]; then
            print_error "证书文件不存在"
            exit 1
        fi
        
        print_success "已有证书配置完成！"
        ;;
        
    *)
        print_error "无效的选择"
        exit 1
        ;;
esac

# 设置证书权限
chmod 600 ssl/*.pem
print_info "证书权限已设置"

# 更新 .env.production 中的域名
if [ -f ".env.production" ]; then
    sed -i "s/^DOMAIN=.*/DOMAIN=$DOMAIN/" .env.production
    print_info ".env.production 中的域名已更新"
fi

# 检查证书是否有效
print_info "验证证书..."
if openssl x509 -in ssl/fullchain.pem -text -noout > /dev/null 2>&1; then
    print_success "证书验证通过！"
    
    # 显示证书信息
    echo ""
    print_info "证书信息:"
    openssl x509 -in ssl/fullchain.pem -noout -subject -dates
else
    print_error "证书验证失败，请检查证书文件"
    exit 1
fi

# 重启 Nginx 服务（如果正在运行）
if systemctl is-active --quiet nginx; then
    print_info "重启 Nginx 服务..."
    systemctl restart nginx
    print_success "Nginx 已重启"
fi

echo ""
print_success "SSL 证书部署完成！"
echo "=========================================="
echo "访问地址:"
echo "  - HTTP:  http://$DOMAIN"
echo "  - HTTPS: https://$DOMAIN"
echo "=========================================="
