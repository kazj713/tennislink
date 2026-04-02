# TennisLink 腾讯云部署脚本 (纯 PowerShell 版本)
# 使用方法：.\scripts\deploy-to-tencent-pure.ps1 -ServerIP "你的服务器 IP"

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP
)

# 颜色函数
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Blue }
function Write-Success { Write-Host "[SUCCESS] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

Write-Info "开始部署到腾讯云服务器..."
Write-Info "服务器 IP: $ServerIP"

# 检查环境变量文件
if (-not (Test-Path ".env.production")) {
    Write-Warning ".env.production 文件不存在"
    if (Test-Path ".env.production.example") {
        Write-Info "复制 .env.production.example 到 .env.production"
        Copy-Item ".env.production.example" ".env.production"
        Write-Error "请先编辑 .env.production 文件，配置正确的值后重新运行"
        exit 1
    }
}

# 创建临时打包文件
$tempFile = "$env:TEMP\tennis-link-deploy.zip"
Write-Info "打包项目文件到：$tempFile"

# 排除的文件和目录
$excludePatterns = @(
    '.git',
    'node_modules',
    '.next',
    '*.log',
    'backups',
    'uploads',
    'logs',
    '.env.local',
    'tests'
)

try {
    # 使用 PowerShell 压缩
    $items = Get-ChildItem -Path . -Exclude $excludePatterns -Recurse
    Compress-Archive -Path $items -DestinationPath $tempFile -Force
    
    $fileSize = Get-ChildItem $tempFile | Select-Object -ExpandProperty Length
    $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
    Write-Success "打包完成，大小：$fileSizeMB MB"
} catch {
    Write-Error "打包失败：$_"
    exit 1
}

# 上传到服务器
Write-Info "上传到服务器..."
try {
    # 使用 scp 上传
    scp $tempFile "root@${ServerIP}:/root/"
    if ($LASTEXITCODE -ne 0) {
        throw "SCP 上传失败"
    }
    Write-Success "上传成功"
} catch {
    Write-Error "上传失败：$_"
    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
    exit 1
}

# 在服务器上执行部署
Write-Info "在服务器上执行部署脚本..."

# 构建 SSH 命令
$sshCommands = @"
cd /root

# 解压文件
echo '正在解压文件...'
unzip -o tennis-link-deploy.zip -d tennis-link

# 进入项目目录
cd tennis-link

# 安装依赖
echo '安装依赖...'
npm install --production

# 构建项目
echo '构建项目...'
npm run build

# 配置 Nginx
echo '配置 Nginx...'
sudo cp nginx.conf /etc/nginx/sites-available/tennis-link
sudo ln -sf /etc/nginx/sites-available/tennis-link /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 启动应用
echo '启动应用...'
sudo pm2 delete tennis-link 2>/dev/null || true
sudo pm2 start "npm run start" --name "tennis-link"
sudo pm2 save

# 数据库迁移
echo '运行数据库迁移...'
npm run db:migrate || echo '数据库迁移可能需要手动执行'

# 清理
echo '清理临时文件...'
rm -f /root/tennis-link-deploy.zip

# 显示结果
echo ''
echo '=========================================='
echo '部署完成！'
echo '=========================================='
echo "访问地址：http://${ServerIP}"
echo '查看日志：pm2 logs tennis-link'
echo ''
"@

try {
    # 执行 SSH 命令
    ssh root@${ServerIP} $sshCommands
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "部署成功！"
        Write-Info "访问地址：http://$ServerIP"
        Write-Info "查看日志：ssh root@$ServerIP 'pm2 logs tennis-link'"
    } else {
        Write-Error "部署失败，请登录服务器查看错误信息"
    }
} catch {
    Write-Error "SSH 执行失败：$_"
} finally {
    # 清理临时文件
    if (Test-Path $tempFile) {
        Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
    }
}

Write-Success "部署脚本执行完毕！"