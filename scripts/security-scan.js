#!/usr/bin/env node

/**
 * 依赖安全扫描脚本
 * 用于检查项目依赖的安全漏洞
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 扫描结果输出目录
const OUTPUT_DIR = path.join(__dirname, '..', 'security-reports');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 时间戳
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const REPORT_FILE = path.join(OUTPUT_DIR, `dependency-scan-${TIMESTAMP}.json`);

// 扫描函数
function runSecurityScan() {
  console.log('🔍 开始依赖安全扫描...');
  
  try {
    // 运行 npm audit
    console.log('📦 运行 npm audit 检查依赖漏洞...');
    const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
    const auditResults = JSON.parse(auditOutput);
    
    // 运行 npm outdated
    console.log('📋 运行 npm outdated 检查过时依赖...');
    const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8' });
    const outdatedResults = JSON.parse(outdatedOutput);
    
    // 构建扫描报告
    const scanReport = {
      timestamp: new Date().toISOString(),
      project: 'Tennis Link',
      audit: auditResults,
      outdated: outdatedResults,
      summary: {
        totalDependencies: auditResults.metadata?.totalDependencies || 0,
        vulnerabilities: {
          critical: auditResults.metadata?.vulnerabilities?.critical || 0,
          high: auditResults.metadata?.vulnerabilities?.high || 0,
          moderate: auditResults.metadata?.vulnerabilities?.moderate || 0,
          low: auditResults.metadata?.vulnerabilities?.low || 0,
        },
        outdatedDependencies: Object.keys(outdatedResults).length,
      },
    };
    
    // 保存扫描报告
    fs.writeFileSync(REPORT_FILE, JSON.stringify(scanReport, null, 2));
    console.log(`✅ 扫描完成！报告已保存到: ${REPORT_FILE}`);
    
    // 输出摘要
    console.log('📊 扫描摘要:');
    console.log(`   总依赖数: ${scanReport.summary.totalDependencies}`);
    console.log(`   漏洞数:`);
    console.log(`     严重: ${scanReport.summary.vulnerabilities.critical}`);
    console.log(`     高: ${scanReport.summary.vulnerabilities.high}`);
    console.log(`     中: ${scanReport.summary.vulnerabilities.moderate}`);
    console.log(`     低: ${scanReport.summary.vulnerabilities.low}`);
    console.log(`   过时依赖: ${scanReport.summary.outdatedDependencies}`);
    
    // 检查是否有严重或高漏洞
    if (scanReport.summary.vulnerabilities.critical > 0 || scanReport.summary.vulnerabilities.high > 0) {
      console.log('⚠️  发现严重或高风险漏洞，建议立即修复！');
      console.log('   运行: npm audit fix 来修复可自动修复的漏洞');
      console.log('   对于无法自动修复的漏洞，请手动更新依赖版本');
    } else if (scanReport.summary.vulnerabilities.moderate > 0) {
      console.log('⚠️  发现中等风险漏洞，建议尽快修复！');
    } else {
      console.log('✅ 未发现严重或高风险漏洞，项目依赖安全状态良好！');
    }
    
    // 检查过时依赖
    if (scanReport.summary.outdatedDependencies > 0) {
      console.log('📋 发现过时依赖，建议更新到最新版本以获取安全修复和新功能');
      console.log('   运行: npm update 来更新到兼容的最新版本');
    }
    
    return scanReport;
    
  } catch (error) {
    console.error('❌ 扫描过程中发生错误:', error.message);
    
    // 保存错误报告
    const errorReport = {
      timestamp: new Date().toISOString(),
      project: 'Tennis Link',
      error: error.message,
      stack: error.stack,
    };
    
    const ERROR_FILE = path.join(OUTPUT_DIR, `scan-error-${TIMESTAMP}.json`);
    fs.writeFileSync(ERROR_FILE, JSON.stringify(errorReport, null, 2));
    console.log(`📝 错误报告已保存到: ${ERROR_FILE}`);
    
    throw error;
  }
}

// 自动修复函数
function autoFixVulnerabilities() {
  console.log('🔧 开始自动修复漏洞...');
  
  try {
    // 运行 npm audit fix
    console.log('运行 npm audit fix...');
    const fixOutput = execSync('npm audit fix --json', { encoding: 'utf8' });
    const fixResults = JSON.parse(fixOutput);
    
    console.log('✅ 自动修复完成！');
    console.log(`   修复的漏洞数: ${fixResults.fixed}`);
    console.log(`   总漏洞数: ${fixResults.total}`);
    
    if (fixResults.fixed > 0) {
      console.log('📦 重新运行扫描以验证修复结果...');
      runSecurityScan();
    } else {
      console.log('⚠️  没有可自动修复的漏洞');
    }
    
  } catch (error) {
    console.error('❌ 自动修复过程中发生错误:', error.message);
    throw error;
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--fix')) {
    autoFixVulnerabilities();
  } else {
    runSecurityScan();
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

// 导出函数供其他模块使用
module.exports = {
  runSecurityScan,
  autoFixVulnerabilities,
};
