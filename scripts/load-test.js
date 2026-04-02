#!/usr/bin/env node

/**
 * 压力测试脚本
 * 测试API在高并发情况下的性能表现
 */

const axios = require('axios');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

// 测试配置
const config = {
  // 并发用户数
  concurrentUsers: parseInt(process.env.CONCURRENT_USERS) || 10,
  // 每个用户发送的请求数
  requestsPerUser: parseInt(process.env.REQUESTS_PER_USER) || 100,
  // 请求间隔（毫秒）
  requestInterval: parseInt(process.env.REQUEST_INTERVAL) || 100,
  // 超时时间（毫秒）
  timeout: parseInt(process.env.REQUEST_TIMEOUT) || 5000,
};

// 测试结果统计
const results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  statusCodes: {},
  errors: [],
  startTime: null,
  endTime: null,
};

/**
 * 发送单个请求
 */
async function sendRequest(endpoint, method = 'GET', data = null) {
  const startTime = Date.now();

  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      data,
      timeout: config.timeout,
      validateStatus: () => true, // 不抛出HTTP错误
    });

    const responseTime = Date.now() - startTime;

    results.totalRequests++;
    results.totalResponseTime += responseTime;
    results.minResponseTime = Math.min(results.minResponseTime, responseTime);
    results.maxResponseTime = Math.max(results.maxResponseTime, responseTime);

    const statusCode = response.status;
    results.statusCodes[statusCode] = (results.statusCodes[statusCode] || 0) + 1;

    if (statusCode >= 200 && statusCode < 300) {
      results.successfulRequests++;
    } else {
      results.failedRequests++;
    }

    return { success: statusCode < 300, responseTime, statusCode };
  } catch (error) {
    results.totalRequests++;
    results.failedRequests++;

    const errorMessage = error.message || 'Unknown error';
    results.errors.push(errorMessage);

    return { success: false, error: errorMessage, responseTime: Date.now() - startTime };
  }
}

/**
 * 模拟单个用户
 */
async function simulateUser(userId) {
  const endpoints = [
    { endpoint: '/api/health', weight: 10 },
    { endpoint: '/api/coaches?page=1&pageSize=10', weight: 30 },
    { endpoint: '/api/courses?page=1&pageSize=10', weight: 30 },
    { endpoint: '/api/venues?page=1&pageSize=10', weight: 20 },
  ];

  // 根据权重生成请求列表
  const weightedEndpoints = [];
  for (const item of endpoints) {
    for (let i = 0; i < item.weight; i++) {
      weightedEndpoints.push(item.endpoint);
    }
  }

  for (let i = 0; i < config.requestsPerUser; i++) {
    // 随机选择一个端点
    const endpoint = weightedEndpoints[Math.floor(Math.random() * weightedEndpoints.length)];

    await sendRequest(endpoint);

    // 请求间隔
    if (config.requestInterval > 0 && i < config.requestsPerUser - 1) {
      await new Promise(resolve => setTimeout(resolve, config.requestInterval));
    }
  }

  console.log(`✅ 用户 ${userId} 完成 ${config.requestsPerUser} 个请求`);
}

/**
 * 生成测试报告
 */
function generateReport() {
  results.endTime = Date.now();
  const duration = (results.endTime - results.startTime) / 1000; // 秒

  console.log('\n' + '='.repeat(70));
  console.log('📊 压力测试报告');
  console.log('='.repeat(70));
  console.log(`测试配置:`);
  console.log(`  - 并发用户数: ${config.concurrentUsers}`);
  console.log(`  - 每用户请求数: ${config.requestsPerUser}`);
  console.log(`  - 总请求数: ${results.totalRequests}`);
  console.log(`  - 请求间隔: ${config.requestInterval}ms`);
  console.log(`  - 超时时间: ${config.timeout}ms`);
  console.log('-'.repeat(70));
  console.log(`性能指标:`);
  console.log(`  - 测试时长: ${duration.toFixed(2)} 秒`);
  console.log(`  - 平均响应时间: ${(results.totalResponseTime / results.totalRequests).toFixed(2)} ms`);
  console.log(`  - 最小响应时间: ${results.minResponseTime} ms`);
  console.log(`  - 最大响应时间: ${results.maxResponseTime} ms`);
  console.log(`  - 吞吐量 (RPS): ${(results.totalRequests / duration).toFixed(2)}`);
  console.log('-'.repeat(70));
  console.log(`请求结果:`);
  console.log(`  - 成功: ${results.successfulRequests} (${((results.successfulRequests / results.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`  - 失败: ${results.failedRequests} (${((results.failedRequests / results.totalRequests) * 100).toFixed(2)}%)`);
  console.log('-'.repeat(70));
  console.log(`状态码分布:`);
  for (const [code, count] of Object.entries(results.statusCodes).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${code}: ${count} (${((count / results.totalRequests) * 100).toFixed(2)}%)`);
  }

  if (results.errors.length > 0) {
    console.log('-'.repeat(70));
    console.log(`错误统计:`);
    const errorCounts = {};
    for (const error of results.errors) {
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    }
    for (const [error, count] of Object.entries(errorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
      console.log(`  - ${error}: ${count} 次`);
    }
  }

  console.log('='.repeat(70));

  // 性能评级
  const successRate = results.successfulRequests / results.totalRequests;
  const avgResponseTime = results.totalResponseTime / results.totalRequests;

  console.log('\n📈 性能评级:');
  if (successRate >= 0.99 && avgResponseTime < 200) {
    console.log('🟢 优秀 - 系统性能良好');
  } else if (successRate >= 0.95 && avgResponseTime < 500) {
    console.log('🟡 良好 - 系统性能可接受');
  } else if (successRate >= 0.90 && avgResponseTime < 1000) {
    console.log('🟠 一般 - 需要优化');
  } else {
    console.log('🔴 较差 - 需要立即优化');
  }

  // 返回测试结果
  return {
    success: successRate >= 0.95,
    successRate,
    avgResponseTime,
    throughput: results.totalRequests / duration,
  };
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 Tennis Link 压力测试');
  console.log(`目标: ${BASE_URL}`);
  console.log('开始时间:', new Date().toISOString());
  console.log('='.repeat(70));

  results.startTime = Date.now();

  // 创建并发用户
  const userPromises = [];
  for (let i = 0; i < config.concurrentUsers; i++) {
    userPromises.push(simulateUser(i + 1));
  }

  // 等待所有用户完成
  await Promise.all(userPromises);

  // 生成报告
  const report = generateReport();

  // 根据结果退出
  process.exit(report.success ? 0 : 1);
}

// 检查axios是否安装
try {
  require('axios');
} catch (e) {
  console.error('请先安装 axios: npm install axios --save-dev');
  process.exit(1);
}

// 处理命令行参数
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
用法: node load-test.js [选项]

选项:
  --users=<n>      并发用户数 (默认: 10)
  --requests=<n>   每用户请求数 (默认: 100)
  --interval=<n>   请求间隔毫秒 (默认: 100)
  --timeout=<n>    请求超时毫秒 (默认: 5000)
  --help, -h       显示帮助信息

环境变量:
  TEST_BASE_URL    测试目标URL (默认: http://localhost:5000)
  CONCURRENT_USERS 并发用户数
  REQUESTS_PER_USER 每用户请求数
  REQUEST_INTERVAL 请求间隔毫秒
  REQUEST_TIMEOUT  请求超时毫秒

示例:
  node load-test.js --users=20 --requests=50 --interval=50
  `);
  process.exit(0);
}

// 解析命令行参数
for (const arg of args) {
  if (arg.startsWith('--users=')) {
    config.concurrentUsers = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--requests=')) {
    config.requestsPerUser = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--interval=')) {
    config.requestInterval = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--timeout=')) {
    config.timeout = parseInt(arg.split('=')[1]);
  }
}

main().catch(error => {
  console.error('测试执行错误:', error);
  process.exit(1);
});
