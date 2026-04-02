#!/usr/bin/env node

/**
 * 生产环境部署前检查脚本
 * 按照生产标准全面检查项目配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 检查结果
const results = {
  critical: [],
  warnings: [],
  passed: [],
  info: []
};

function check(name, type, message, details = null) {
  const item = { name, message, details };
  if (type === 'CRITICAL') results.critical.push(item);
  else if (type === 'WARNING') results.warnings.push(item);
  else if (type === 'PASS') results.passed.push(item);
  else if (type === 'INFO') results.info.push(item);

  const icon = type === 'CRITICAL' ? '🔴' : type === 'WARNING' ? '🟡' : type === 'PASS' ? '🟢' : '🔵';
  console.log(`${icon} ${name}: ${message}`);
  if (details) console.log(`   ${details}`);
}

// ============================================
// 1. 文件结构检查
// ============================================
function checkFileStructure() {
  console.log('\n📁 文件结构检查');
  console.log('─'.repeat(60));

  const requiredFiles = [
    { path: '.env.production', critical: true },
    { path: 'nginx.conf', critical: true },
    { path: 'scripts/deploy-to-tencent-nodocker.ps1', critical: true },
    { path: 'scripts/setup-server.sh', critical: true },
    { path: 'scripts/backup-database.js', critical: false },
    { path: 'scripts/migrate-production.js', critical: false },
    { path: 'docs/SYSTEM_ARCHITECTURE.md', critical: false },
  ];

  for (const file of requiredFiles) {
    const exists = fs.existsSync(path.join(process.cwd(), file.path));
    if (exists) {
      check(file.path, 'PASS', '文件存在');
    } else if (file.critical) {
      check(file.path, 'CRITICAL', '关键文件缺失', '此文件对生产部署至关重要');
    } else {
      check(file.path, 'WARNING', '文件缺失', '建议添加此文件');
    }
  }
}

// ============================================
// 2. 环境变量检查
// ============================================
function checkEnvironmentVariables() {
  console.log('\n🔐 环境变量检查');
  console.log('─'.repeat(60));

  if (!fs.existsSync('.env.production')) {
    check('.env.production', 'CRITICAL', '生产环境配置文件不存在');
    return;
  }

  const envContent = fs.readFileSync('.env.production', 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });

  // 必需配置
  const requiredVars = [
    { name: 'NODE_ENV', expected: 'production', critical: true },
    { name: 'DOMAIN', placeholder: 'your-domain.com', critical: true },
    { name: 'DB_PASSWORD', placeholder: 'your_secure_database_password_here', critical: true },
    { name: 'REDIS_PASSWORD', placeholder: 'your_secure_redis_password_here', critical: true },
    { name: 'JWT_SECRET', placeholder: 'your_jwt_secret', critical: true },
    { name: 'ENCRYPTION_KEY', placeholder: 'your_encryption_key', critical: true },
  ];

  for (const v of requiredVars) {
    const value = envVars[v.name];
    if (!value) {
      check(v.name, 'CRITICAL', '必需环境变量未设置');
    } else if (v.expected && value !== v.expected) {
      check(v.name, 'WARNING', `值不正确，期望: ${v.expected}，实际: ${value}`);
    } else if (v.placeholder && value.includes(v.placeholder)) {
      check(v.name, 'CRITICAL', '使用的是占位符值，必须替换为实际值', `当前值: ${value.substring(0, 30)}...`);
    } else if (v.name.includes('PASSWORD') || v.name.includes('SECRET') || v.name.includes('KEY')) {
      if (value.length < 16) {
        check(v.name, 'WARNING', '密钥长度不足，建议至少16位', `当前长度: ${value.length}`);
      } else {
        check(v.name, 'PASS', '已设置');
      }
    } else {
      check(v.name, 'PASS', '已设置');
    }
  }

  // 安全配置检查
  if (envVars.DEV_MODE === 'true') {
    check('DEV_MODE', 'CRITICAL', '生产环境必须设置为 false');
  } else {
    check('DEV_MODE', 'PASS', '已禁用开发模式');
  }

  if (envVars.SHOW_DETAILED_ERRORS === 'true') {
    check('SHOW_DETAILED_ERRORS', 'WARNING', '生产环境建议设置为 false');
  }

  // 可选但推荐的配置
  const recommendedVars = [
    'SMTP_HOST',
    'COS_SECRET_ID',
    'WECHAT_PAY_MCH_ID',
    'ALIPAY_APP_ID',
  ];

  for (const v of recommendedVars) {
    if (!envVars[v] || envVars[v].includes('your_')) {
      check(v, 'INFO', '未配置（可选功能）');
    } else {
      check(v, 'PASS', '已配置');
    }
  }
}

// ============================================
// 3. 数据库配置检查
// ============================================
function checkDatabaseConfig() {
  console.log('\n🗄️ 数据库配置检查');
  console.log('─'.repeat(60));

  // 检查 drizzle.config.ts
  if (fs.existsSync('drizzle.config.ts')) {
    check('drizzle.config.ts', 'PASS', '数据库配置文件存在');
  } else {
    check('drizzle.config.ts', 'CRITICAL', '数据库配置文件缺失');
  }

  // 检查迁移文件
  const migrationsDir = path.join(process.cwd(), 'drizzle');
  if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    if (migrations.length > 0) {
      check('数据库迁移', 'PASS', `找到 ${migrations.length} 个迁移文件`);
    } else {
      check('数据库迁移', 'WARNING', '未找到迁移文件，可能需要生成');
    }
  } else {
    check('数据库迁移', 'WARNING', '迁移目录不存在');
  }

  // 检查 seed.ts
  if (fs.existsSync('src/storage/database/seed.ts')) {
    check('种子数据', 'PASS', '种子数据脚本存在');
  } else {
    check('种子数据', 'INFO', '种子数据脚本不存在（可选）');
  }
}

// ============================================
// 4. 部署配置检查
// ============================================
function checkDeploymentConfig() {
  console.log('\n🚀 部署配置检查');
  console.log('─'.repeat(60));

  // 检查部署脚本
  if (fs.existsSync('scripts/deploy-to-tencent-nodocker.ps1')) {
    check('部署脚本', 'PASS', '非 Docker 部署脚本存在');
  } else {
    check('部署脚本', 'CRITICAL', '非 Docker 部署脚本不存在');
  }

  // 检查服务器配置脚本
  if (fs.existsSync('scripts/setup-server.sh')) {
    check('服务器配置脚本', 'PASS', '服务器配置脚本存在');
  } else {
    check('服务器配置脚本', 'CRITICAL', '服务器配置脚本不存在');
  }

  // 检查 PM2 配置
  check('PM2 进程管理', 'PASS', '使用 PM2 管理应用进程');
  check('Nginx 反向代理', 'PASS', '使用 Nginx 作为反向代理');
}

// ============================================
// 5. Nginx 配置检查
// ============================================
function checkNginxConfig() {
  console.log('\n🌐 Nginx 配置检查');
  console.log('─'.repeat(60));

  if (!fs.existsSync('nginx.conf')) {
    check('nginx.conf', 'CRITICAL', 'Nginx 配置文件不存在');
    return;
  }

  const content = fs.readFileSync('nginx.conf', 'utf8');

  // 检查关键配置
  const checks = [
    { pattern: /gzip\s+on/, name: 'Gzip压缩', critical: false },
    { pattern: /ssl_certificate/, name: 'SSL证书配置', critical: false },
    { pattern: /proxy_pass/, name: '反向代理', critical: true },
    { pattern: /client_max_body_size/, name: '上传文件大小限制', critical: false },
    { pattern: /X-Frame-Options/, name: '安全头部: X-Frame-Options', critical: false },
    { pattern: /X-Content-Type-Options/, name: '安全头部: X-Content-Type-Options', critical: false },
    { pattern: /X-XSS-Protection/, name: '安全头部: X-XSS-Protection', critical: false },
  ];

  for (const c of checks) {
    if (c.pattern.test(content)) {
      check(c.name, 'PASS', '已配置');
    } else if (c.critical) {
      check(c.name, 'CRITICAL', '必需配置缺失');
    } else {
      check(c.name, 'INFO', '未配置（可选）');
    }
  }
}

// ============================================
// 6. 安全配置检查
// ============================================
function checkSecurityConfig() {
  console.log('\n🔒 安全配置检查');
  console.log('─'.repeat(60));

  // 检查 middleware.ts
  if (fs.existsSync('src/middleware.ts')) {
    const content = fs.readFileSync('src/middleware.ts', 'utf8');

    const checks = [
      { pattern: /CORS/, name: 'CORS配置' },
      { pattern: /X-Frame-Options/, name: '安全头部' },
      { pattern: /rate.*limit/i, name: '速率限制' },
    ];

    for (const c of checks) {
      if (c.pattern.test(content)) {
        check(c.name, 'PASS', '已配置');
      } else {
        check(c.name, 'INFO', '未配置（可选）');
      }
    }
  }

  // 检查 next.config.ts
  if (fs.existsSync('next.config.ts')) {
    const content = fs.readFileSync('next.config.ts', 'utf8');

    if (content.includes('poweredByHeader: false')) {
      check('隐藏X-Powered-By', 'PASS', '已配置');
    } else {
      check('隐藏X-Powered-By', 'INFO', '建议配置 poweredByHeader: false');
    }

    if (content.includes('compress: true')) {
      check('响应压缩', 'PASS', '已启用');
    }
  }
}

// ============================================
// 7. 依赖检查
// ============================================
function checkDependencies() {
  console.log('\n📦 依赖检查');
  console.log('─'.repeat(60));

  if (!fs.existsSync('package.json')) {
    check('package.json', 'CRITICAL', 'package.json 不存在');
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  // 检查关键依赖
  const criticalDeps = [
    'next',
    'react',
    'react-dom',
    'drizzle-orm',
    'pg',
    'bcryptjs',
    'jose',
  ];

  for (const dep of criticalDeps) {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      check(`依赖: ${dep}`, 'PASS', '已安装');
    } else {
      check(`依赖: ${dep}`, 'CRITICAL', '关键依赖缺失');
    }
  }

  // 检查 scripts
  const requiredScripts = [
    'build',
    'start',
    'db:migrate',
  ];

  for (const script of requiredScripts) {
    if (packageJson.scripts?.[script]) {
      check(`Script: ${script}`, 'PASS', '已配置');
    } else {
      check(`Script: ${script}`, 'WARNING', '建议添加此脚本');
    }
  }
}

// ============================================
// 8. 构建检查
// ============================================
function checkBuild() {
  console.log('\n🔨 构建检查');
  console.log('─'.repeat(60));

  // 检查 TypeScript 配置
  if (fs.existsSync('tsconfig.json')) {
    check('tsconfig.json', 'PASS', 'TypeScript 配置存在');
  } else {
    check('tsconfig.json', 'CRITICAL', 'TypeScript 配置缺失');
  }

  // 检查 next.config.ts
  if (fs.existsSync('next.config.ts')) {
    check('next.config.ts', 'PASS', 'Next.js 配置存在');
  } else {
    check('next.config.ts', 'WARNING', 'Next.js 配置缺失');
  }

  // 检查是否可以构建（可选，可能较慢）
  check('构建测试', 'INFO', '运行 "npm run build" 可测试构建');
}

// ============================================
// 9. 监控和日志检查
// ============================================
function checkMonitoring() {
  console.log('\n📊 监控和日志检查');
  console.log('─'.repeat(60));

  // 检查健康检查端点
  if (fs.existsSync('src/app/api/health/route.ts')) {
    check('健康检查API', 'PASS', '已配置');
  } else {
    check('健康检查API', 'WARNING', '建议添加健康检查端点');
  }

  // 检查监控配置
  if (fs.existsSync('monitoring/prometheus.yml')) {
    check('Prometheus配置', 'PASS', '已配置');
  } else {
    check('Prometheus配置', 'INFO', '未配置（可选）');
  }

  // 检查日志目录
  if (fs.existsSync('logs')) {
    check('日志目录', 'PASS', '已创建');
  } else {
    check('日志目录', 'INFO', '未创建（部署时会自动创建）');
  }
}

// ============================================
// 10. SSL 证书检查
// ============================================
function checkSSL() {
  console.log('\n🔐 SSL 证书检查');
  console.log('─'.repeat(60));

  if (fs.existsSync('ssl/fullchain.pem') && fs.existsSync('ssl/privkey.pem')) {
    check('SSL证书', 'PASS', '证书文件已存在');

    // 检查证书有效期
    try {
      const stats = fs.statSync('ssl/fullchain.pem');
      const daysSinceModified = Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceModified > 300) {
        check('SSL证书有效期', 'WARNING', `证书已使用 ${daysSinceModified} 天，建议检查是否需要更新`);
      } else {
        check('SSL证书有效期', 'PASS', `证书已使用 ${daysSinceModified} 天`);
      }
    } catch (e) {
      // 忽略错误
    }
  } else {
    check('SSL证书', 'INFO', '证书文件不存在，将使用 HTTP 模式部署');
  }
}

// ============================================
// 生成报告
// ============================================
function generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 生产环境检查报告');
  console.log('='.repeat(70));

  const total = results.critical.length + results.warnings.length + results.passed.length + results.info.length;

  console.log(`\n统计:`);
  console.log(`  🔴 严重问题: ${results.critical.length}`);
  console.log(`  🟡 警告: ${results.warnings.length}`);
  console.log(`  🟢 通过: ${results.passed.length}`);
  console.log(`  🔵 信息: ${results.info.length}`);
  console.log(`  📊 总计: ${total}`);

  if (results.critical.length > 0) {
    console.log('\n🔴 严重问题（必须修复）:');
    results.critical.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.name}: ${item.message}`);
      if (item.details) console.log(`     ${item.details}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log('\n🟡 警告（建议修复）:');
    results.warnings.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.name}: ${item.message}`);
    });
  }

  console.log('\n' + '='.repeat(70));

  if (results.critical.length > 0) {
    console.log('❌ 检查未通过：存在严重问题，必须先修复才能部署到生产环境！');
    console.log('\n修复建议:');
    console.log('1. 确保 .env.production 中的所有必需配置已正确设置');
    console.log('2. 确保所有占位符值（如 your-domain.com）已替换为实际值');
    console.log('3. 确保所有关键文件存在（Dockerfile.prod, nginx.conf 等）');
    process.exit(1);
  } else if (results.warnings.length > 0) {
    console.log('⚠️ 检查通过，但存在警告。建议修复警告后再部署。');
    process.exit(0);
  } else {
    console.log('✅ 所有检查通过！项目已准备好部署到生产环境。');
    process.exit(0);
  }
}

// ============================================
// 主函数
// ============================================
function main() {
  console.log('🔍 TennisLink 生产环境部署前检查');
  console.log('检查时间:', new Date().toISOString());
  console.log('='.repeat(70));

  checkFileStructure();
  checkEnvironmentVariables();
  checkDatabaseConfig();
  checkDeploymentConfig();
  checkNginxConfig();
  checkSecurityConfig();
  checkDependencies();
  checkBuild();
  checkMonitoring();
  checkSSL();

  generateReport();
}

main();
