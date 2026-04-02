# TennisLink 腾讯云非 Docker 部署脚本 (PowerShell 版本)
# 使用方法：.\scripts\deploy-to-tencent-nodocker.ps1 -ServerIP "你的服务器 IP" [-Username "root"]

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "root",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipValidation
)

# 颜色函数
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Blue }
function Write-Success { Write-Host "[SUCCESS] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

Write-Info "开始部署到腾讯云服务器（非 Docker 版本）..."
Write-Info "服务器 IP: $ServerIP"
Write-Info "用户名：$Username"

# 检查 SSH 连接
Write-Info "检查 SSH 连接..."
try {
    $testConnection = Test-NetConnection -ComputerName $ServerIP -Port 22 -WarningAction SilentlyContinue
    if (-not $testConnection.TcpTestSucceeded) {
        throw "无法连接到服务器的 22 端口"
    }
    Write-Success "SSH 连接正常"
} catch {
    Write-Error "无法连接到服务器，请检查："
    Write-Host "  1. 服务器 IP 是否正确"
    Write-Host "  2. SSH 服务是否运行"
    Write-Host "  3. 安全组是否开放 22 端口"
    exit 1
}

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
$tempFile = "$env:TEMP\tennis-link-deploy.tar.gz"
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
    # 使用 tar 命令打包（需要 Git Bash 或 WSL）
    $excludeArgs = @()
    foreach ($pattern in $excludePatterns) {
        $excludeArgs += "--exclude=$pattern"
    }
    
    & tar --create `
          --gzip `
          --file=$tempFile `
          --force-local `
          $excludeArgs `
          --directory=(Get-Location) `
          .
    
    if ($LASTEXITCODE -ne 0) {
        throw "tar 命令执行失败"
    }
    
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
    scp $tempFile "${Username}@${ServerIP}:/root/"
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

$sshScript = @"
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
echo "访问地址：http://${ServerIP}"
echo "查看日志：pm2 logs tennis-link"
echo ""
"@

try {
    ssh ${Username}@${ServerIP} $sshScript
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "部署成功！"
        Write-Info "访问地址：http://$ServerIP"
        Write-Info "查看日志：ssh $Username@$ServerIP 'pm2 logs tennis-link'"
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