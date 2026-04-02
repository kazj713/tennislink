/**
 * API功能测试脚本
 * 测试所有关键API端点的功能
 */

const http = require('http');
const https = require('https');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_RESULTS = [];

// 测试用例配置
const TEST_CASES = [
  {
    name: '健康检查API',
    method: 'GET',
    path: '/api/health',
    expectedStatus: 200,
    timeout: 5000
  },
  {
    name: '用户注册API',
    method: 'POST',
    path: '/api/auth/register',
    body: {
      email: 'test@example.com',
      password: 'Test123456',
      role: 'user'
    },
    expectedStatus: 200,
    timeout: 10000
  },
  {
    name: '用户登录API',
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: 'test@example.com',
      password: 'Test123456'
    },
    expectedStatus: 200,
    timeout: 10000
  },
  {
    name: '获取场地列表API',
    method: 'GET',
    path: '/api/venues',
    expectedStatus: 200,
    timeout: 5000
  },
  {
    name: '文件上传API',
    method: 'POST',
    path: '/api/upload',
    body: 'test-file-content',
    expectedStatus: 400, // 没有文件应该返回400
    timeout: 10000
  }
];

/**
 * 执行HTTP请求
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, API_BASE_URL);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Tennis-Link-API-Test/1.0'
      },
      timeout: options.timeout
    };

    const req = httpModule.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime: Date.now() - options.startTime
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * 执行单个测试用例
 */
async function runTest(testCase) {
  try {
    console.log(`\n🧪 测试: ${testCase.name}`);
    console.log(`   方法: ${testCase.method} ${testCase.path}`);
    
    const startTime = Date.now();
    const response = await makeRequest({
      ...testCase,
      startTime
    });

    const success = response.statusCode === testCase.expectedStatus;
    const result = {
      name: testCase.name,
      success,
      statusCode: response.statusCode,
      expectedStatus: testCase.expectedStatus,
      responseTime: response.responseTime,
      body: response.body
    };

    TEST_RESULTS.push(result);

    if (success) {
      console.log(`   ✅ 成功 (${response.statusCode}, ${response.responseTime}ms)`);
    } else {
      console.log(`   ❌ 失败 (期望 ${testCase.expectedStatus}, 实际 ${response.statusCode})`);
      console.log(`   响应: ${response.body}`);
    }

  } catch (error) {
    console.log(`   💥 错误: ${error.message}`);
    TEST_RESULTS.push({
      name: testCase.name,
      success: false,
      error: error.message,
      responseTime: 0
    });
  }
}

/**
 * 生成测试报告
 */
function generateReport() {
  const totalTests = TEST_RESULTS.length;
  const passedTests = TEST_RESULTS.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);

  const avgResponseTime = TEST_RESULTS
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / 
    TEST_RESULTS.filter(r => r.responseTime).length;

  console.log('\n📊 测试报告');
  console.log('='.repeat(50));
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过数: ${passedTests}`);
  console.log(`失败数: ${failedTests}`);
  console.log(`成功率: ${successRate}%`);
  console.log(`平均响应时间: ${avgResponseTime?.toFixed(0)}ms`);

  if (failedTests > 0) {
    console.log('\n❌ 失败的测试:');
    TEST_RESULTS.filter(r => !r.success).forEach(test => {
      console.log(`   - ${test.name}: ${test.error || `状态码 ${test.statusCode}`}`);
    });
  }

  // 保存详细报告到文件
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      passedTests,
      failedTests,
      successRate: parseFloat(successRate),
      avgResponseTime: avgResponseTime || 0
    },
    results: TEST_RESULTS
  };

  require('fs').writeFileSync(
    './api-test-report.json', 
    JSON.stringify(reportData, null, 2)
  );
  
  console.log('\n📄 详细报告已保存到: api-test-report.json');
  
  return failedTests === 0;
}

/**
 * 主测试函数
 */
async function runAllTests() {
  console.log('🚀 开始API功能测试...');
  console.log(`测试目标: ${API_BASE_URL}`);
  console.log(`测试用例数: ${TEST_CASES.length}`);

  // 逐个执行测试
  for (const testCase of TEST_CASES) {
    await runTest(testCase);
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const allTestsPassed = generateReport();
  
  if (allTestsPassed) {
    console.log('\n🎉 所有测试通过！');
    process.exit(0);
  } else {
    console.log('\n💥 部分测试失败！');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, TEST_CASES };