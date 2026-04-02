/**
 * 生产环境数据库迁移脚本
 */

const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });

async function runProductionMigration() {
  try {
    console.log('🚀 开始生产环境数据库迁移...');
    
    // 检查数据库连接
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL 环境变量未设置');
    }
    
    console.log('📡 数据库URL配置检查通过');
    
    // 生成迁移文件
    console.log('📝 生成迁移文件...');
    execSync('npx drizzle-kit generate --config=drizzle.config.prod.ts', { stdio: 'inherit' });
    
    // 执行迁移
    console.log('⬆️ 执行数据库迁移...');
    execSync('npx drizzle-kit migrate --config=drizzle.config.prod.ts', { stdio: 'inherit' });
    
    // 验证迁移结果
    console.log('✅ 验证数据库迁移结果...');
    execSync('npx drizzle-kit studio --config=drizzle.config.prod.ts --port 3001', { 
      stdio: 'inherit',
      detached: true 
    });
    
    console.log('🎉 生产环境数据库迁移完成！');
    console.log('📊 数据库管理面板已启动: http://localhost:3001');
    
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error.message);
    process.exit(1);
  }
}

// 检查是否直接运行此脚本
if (require.main === module) {
  runProductionMigration();
}

module.exports = { runProductionMigration };