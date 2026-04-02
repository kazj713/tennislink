/**
 * 数据库备份脚本
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function backupDatabase() {
  try {
    console.log('🔄 开始数据库备份...');
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL 环境变量未设置');
    }
    
    // 解析数据库连接信息
    const url = new URL(databaseUrl);
    const hostname = url.hostname;
    const port = url.port || 5432;
    const username = url.username;
    const database = url.pathname.substring(1);
    
    // 创建备份目录
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // 生成备份文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `tennis_link_backup_${timestamp}.sql`);
    
    // 执行备份
    console.log('📦 正在创建数据库备份...');
    const backupCommand = `PGPASSWORD=${url.password} pg_dump -h ${hostname} -p ${port} -U ${username} -d ${database} > "${backupFile}"`;
    
    execSync(backupCommand, { stdio: 'inherit' });
    
    // 压缩备份文件
    console.log('🗜️ 正在压缩备份文件...');
    execSync(`gzip "${backupFile}"`, { stdio: 'inherit' });
    const compressedFile = `${backupFile}.gz`;
    
    // 检查文件大小
    const stats = fs.statSync(compressedFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ 数据库备份完成！`);
    console.log(`📁 备份文件: ${compressedFile}`);
    console.log(`📏 文件大小: ${fileSizeInMB} MB`);
    
    // 清理旧备份（保留最近10个）
    await cleanupOldBackups(backupDir);
    
    return compressedFile;
    
  } catch (error) {
    console.error('❌ 数据库备份失败:', error.message);
    throw error;
  }
}

/**
 * 清理旧的备份文件
 */
async function cleanupOldBackups(backupDir) {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('tennis_link_backup_') && file.endsWith('.gz'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    // 保留最新的10个备份
    if (files.length > 10) {
      const filesToDelete = files.slice(10);
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`🗑️ 已删除旧备份: ${file.name}`);
      }
    }
    
  } catch (error) {
    console.warn('⚠️ 清理旧备份时出错:', error.message);
  }
}

/**
 * 恢复数据库
 */
async function restoreDatabase(backupFile) {
  try {
    console.log('🔄 开始数据库恢复...');
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL 环境变量未设置');
    }
    
    // 解析数据库连接信息
    const url = new URL(databaseUrl);
    const hostname = url.hostname;
    const port = url.port || 5432;
    const username = url.username;
    const database = url.pathname.substring(1);
    
    // 检查备份文件是否存在
    if (!fs.existsSync(backupFile)) {
      throw new Error(`备份文件不存在: ${backupFile}`);
    }
    
    // 如果是压缩文件，先解压
    let sqlFile = backupFile;
    if (backupFile.endsWith('.gz')) {
      console.log('📦 解压备份文件...');
      sqlFile = backupFile.replace('.gz', '');
      execSync(`gunzip -c "${backupFile}" > "${sqlFile}"`, { stdio: 'inherit' });
    }
    
    // 执行恢复
    console.log('⬇️ 正在恢复数据库...');
    const restoreCommand = `PGPASSWORD=${url.password} psql -h ${hostname} -p ${port} -U ${username} -d ${database} < "${sqlFile}"`;
    
    execSync(restoreCommand, { stdio: 'inherit' });
    
    // 清理临时文件
    if (sqlFile !== backupFile) {
      fs.unlinkSync(sqlFile);
    }
    
    console.log('✅ 数据库恢复完成！');
    
  } catch (error) {
    console.error('❌ 数据库恢复失败:', error.message);
    throw error;
  }
}

// 命令行参数处理
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'backup':
      backupDatabase();
      break;
    case 'restore':
      const backupFile = process.argv[3];
      if (!backupFile) {
        console.error('请指定要恢复的备份文件');
        process.exit(1);
      }
      restoreDatabase(backupFile);
      break;
    default:
      console.log('使用方法:');
      console.log('  node backup-database.js backup               # 备份数据库');
      console.log('  node backup-database.js restore <backup_file> # 恢复数据库');
      process.exit(1);
  }
}

module.exports = { backupDatabase, restoreDatabase };