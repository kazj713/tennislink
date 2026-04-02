/**
 * 环境变量验证脚本
 * 检查生产环境所需的所有环境变量是否已正确设置
 */

require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'WECHAT_APP_ID',
  'WECHAT_APP_SECRET',
  'WECHAT_MCH_ID',
  'WECHAT_MCH_KEY',
  'WECHAT_NOTIFY_URL',
  'ALIPAY_APP_ID',
  'ALIPAY_PRIVATE_KEY',
  'ALIPAY_PUBLIC_KEY',
  'ALIPAY_NOTIFY_URL',
  'COS_SECRET_ID',
  'COS_SECRET_KEY',
  'COS_REGION',
  'COS_BUCKET',
];

const optionalEnvVars = [
  'COS_CDN_URL',
  'REDIS_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMS_SECRET_ID',
  'SMS_SECRET_KEY',
  'SMS_SDK_APP_ID',
  'SMS_SIGN_NAME',
  'NODE_ENV',
  'PORT',
  'APP_NAME',
  'APP_URL',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'LOG_LEVEL',
  'LOG_FILE_PATH',
  'SENTRY_DSN',
  'ENABLE_ANALYTICS',
];

function validateEnvironment() {
  console.log('🔍 验证生产环境配置...\n');
  
  let missingRequired = [];
  let missingOptional = [];
  
  // 检查必需的环境变量
  console.log('📋 检查必需的环境变量:');
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missingRequired.push(varName);
      console.log(`❌ ${varName}: 未设置`);
    } else {
      // 隐藏敏感信息的值
      const maskedValue = maskSensitiveValue(varName, value);
      console.log(`✅ ${varName}: ${maskedValue}`);
    }
  });
  
  // 检查可选的环境变量
  console.log('\n📋 检查可选的环境变量:');
  optionalEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missingOptional.push(varName);
      console.log(`⚠️  ${varName}: 未设置（可选）`);
    } else {
      const maskedValue = maskSensitiveValue(varName, value);
      console.log(`✅ ${varName}: ${maskedValue}`);
    }
  });
  
  // 检查特定格式的环境变量
  console.log('\n🔍 验证特定格式:');
  
  // 验证数据库URL
  if (process.env.DATABASE_URL) {
    try {
      new URL(process.env.DATABASE_URL);
      console.log('✅ DATABASE_URL: 格式正确');
    } catch (error) {
      missingRequired.push('DATABASE_URL (格式错误)');
      console.log('❌ DATABASE_URL: 格式错误');
    }
  }
  
  // 验证NEXTAUTH_URL
  if (process.env.NEXTAUTH_URL) {
    try {
      const url = new URL(process.env.NEXTAUTH_URL);
      if (url.protocol === 'https:' || url.hostname === 'localhost') {
        console.log('✅ NEXTAUTH_URL: 格式正确');
      } else {
        console.log('⚠️  NEXTAUTH_URL: 生产环境建议使用HTTPS');
      }
    } catch (error) {
      missingRequired.push('NEXTAUTH_URL (格式错误)');
      console.log('❌ NEXTAUTH_URL: 格式错误');
    }
  }
  
  // 验证COS配置
  if (process.env.COS_REGION && !process.env.COS_REGION.startsWith('ap-')) {
    console.log('⚠️  COS_REGION: 区域格式可能不正确');
  }
  
  // 输出验证结果
  console.log('\n📊 验证结果:');
  
  if (missingRequired.length === 0) {
    console.log('🎉 所有必需的环境变量都已正确设置！');
  } else {
    console.log('❌ 以下必需的环境变量缺失或格式错误:');
    missingRequired.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n💡 请在 .env.local 文件中设置这些变量后重新运行验证');
  }
  
  if (missingOptional.length > 0) {
    console.log('\n⚠️  以下可选的环境变量未设置（可能影响部分功能）:');
    missingOptional.forEach(varName => console.log(`   - ${varName}`));
  }
  
  // 生成环境配置报告
  generateConfigReport(missingRequired, missingOptional);
  
  return missingRequired.length === 0;
}

/**
 * 隐藏敏感信息
 */
function maskSensitiveValue(varName, value) {
  const sensitiveVars = [
    'SECRET', 'KEY', 'PASSWORD', 'TOKEN', 'PRIVATE_KEY', 'PUBLIC_KEY', 'CERT'
  ];
  
  const isSensitive = sensitiveVars.some(sensitive => varName.includes(sensitive));
  
  if (isSensitive) {
    if (value.length <= 8) {
      return '*'.repeat(value.length);
    } else {
      return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
    }
  }
  
  return value;
}

/**
 * 生成配置报告
 */
function generateConfigReport(missingRequired, missingOptional) {
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: !!process.env.DATABASE_URL,
    wechat: !!process.env.WECHAT_APP_ID && !!process.env.WECHAT_APP_SECRET,
    alipay: !!process.env.ALIPAY_APP_ID && !!process.env.ALIPAY_PRIVATE_KEY,
    cos: !!process.env.COS_SECRET_ID && !!process.env.COS_SECRET_KEY,
    missingRequired,
    missingOptional,
    ready: missingRequired.length === 0
  };
  
  // 保存报告到文件
  const fs = require('fs');
  const reportPath = './env-validation-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 配置报告已保存到: ${reportPath}`);
}

// 检查是否直接运行此脚本
if (require.main === module) {
  const isValid = validateEnvironment();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateEnvironment };