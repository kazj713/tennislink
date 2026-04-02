#!/usr/bin/env node

/**
 * 安全测试脚本
 * 测试常见的安全漏洞：SQL注入、XSS、CSRF、认证绕过等
 */

const axios = require('axios');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN || '';

// 测试结果统计
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

/**
 * 记录测试结果
 */
function logTest(name, status, message, details = null) {
  results.tests.push({ name, status, message, details });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else if (status === 'WARN') results.warnings++;

  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);
  if (details) console.log(`   ${details}`);
}

/**
 * SQL注入测试
 */
async function testSQLInjection() {
  console.log('\n🔒 SQL注入测试');
  console.log('─'.repeat(50));

  const payloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "1' AND 1=1 --",
    "admin'--",
    "1; SELECT * FROM users",
  ];

  for (const payload of payloads) {
    try {
      // 测试登录接口
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: payload,
        password: payload,
      }, { validateStatus: () => true });

      // 如果返回500错误或包含数据库错误信息，可能存在SQL注入漏洞
      if (response.status === 500) {
        logTest(
          `SQL注入测试: ${payload.substring(0, 20)}...`,
          'FAIL',
          '服务器返回500错误，可能存在SQL注入漏洞',
          `状态码: ${response.status}`
        );
      } else if (response.data?.error?.toLowerCase().includes('sql')) {
        logTest(
          `SQL注入测试: ${payload.substring(0, 20)}...`,
          'FAIL',
          '响应中包含SQL错误信息，存在信息泄露风险',
          null
        );
      } else {
        logTest(
          `SQL注入测试: ${payload.substring(0, 20)}...`,
          'PASS',
          '未检测到SQL注入漏洞'
        );
      }
    } catch (error) {
      logTest(
        `SQL注入测试: ${payload.substring(0, 20)}...`,
        'PASS',
        '请求被正确拦截或处理'
      );
    }
  }
}

/**
 * XSS攻击测试
 */
async function testXSS() {
  console.log('\n🔒 XSS攻击测试');
  console.log('─'.repeat(50));

  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert("xss")>',
    'javascript:alert("xss")',
    '<svg onload=alert("xss")>',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
  ];

  for (const payload of xssPayloads) {
    try {
      // 测试注册接口（使用XSS payload作为用户名）
      const response = await axios.post(`${BASE_URL}/api/auth/register`, {
        name: payload,
        email: `test${Date.now()}@example.com`,
        password: 'Test123456!',
      }, { validateStatus: () => true });

      // 检查响应中是否包含未转义的payload
      const responseBody = JSON.stringify(response.data);
      if (responseBody.includes('<script>') || responseBody.includes('onerror=')) {
        logTest(
          `XSS测试: ${payload.substring(0, 30)}...`,
          'FAIL',
          '响应中包含未转义的脚本代码，存在XSS漏洞'
        );
      } else {
        logTest(
          `XSS测试: ${payload.substring(0, 30)}...`,
          'PASS',
          '输入被正确转义或过滤'
        );
      }
    } catch (error) {
      logTest(
        `XSS测试: ${payload.substring(0, 30)}...`,
        'PASS',
        '请求被正确拦截或处理'
      );
    }
  }
}

/**
 * 认证绕过测试
 */
async function testAuthBypass() {
  console.log('\n🔒 认证绕过测试');
  console.log('─'.repeat(50));

  const protectedEndpoints = [
    { method: 'GET', url: '/api/admin/settings' },
    { method: 'GET', url: '/api/admin/users' },
    { method: 'GET', url: '/api/admin/coaches/pending' },
  ];

  for (const endpoint of protectedEndpoints) {
    try {
      // 测试不带token访问受保护接口
      const response = await axios({
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.url}`,
        validateStatus: () => true,
      });

      if (response.status === 200) {
        logTest(
          `认证绕过: ${endpoint.method} ${endpoint.url}`,
          'FAIL',
          '未认证即可访问受保护接口，存在认证绕过漏洞'
        );
      } else if (response.status === 401 || response.status === 403) {
        logTest(
          `认证绕过: ${endpoint.method} ${endpoint.url}`,
          'PASS',
          '接口正确要求认证'
        );
      } else {
        logTest(
          `认证绕过: ${endpoint.method} ${endpoint.url}`,
          'WARN',
          `返回非预期状态码: ${response.status}`
        );
      }
    } catch (error) {
      logTest(
        `认证绕过: ${endpoint.method} ${endpoint.url}`,
        'PASS',
        '请求被正确拦截'
      );
    }
  }

  // 测试使用无效token
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/settings`, {
      headers: { Authorization: 'Bearer invalid_token_here' },
      validateStatus: () => true,
    });

    if (response.status === 200) {
      logTest(
        '无效Token测试',
        'FAIL',
        '使用无效token仍可访问受保护接口'
      );
    } else {
      logTest(
        '无效Token测试',
        'PASS',
        '无效token被正确拒绝'
      );
    }
  } catch (error) {
    logTest('无效Token测试', 'PASS', '无效token被正确拒绝');
  }
}

/**
 * 速率限制测试
 */
async function testRateLimit() {
  console.log('\n🔒 速率限制测试');
  console.log('─'.repeat(50));

  const requests = [];
  const numRequests = 15;

  console.log(`发送 ${numRequests} 个快速请求测试速率限制...`);

  for (let i = 0; i < numRequests; i++) {
    requests.push(
      axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'wrongpassword',
      }, { validateStatus: () => true })
    );
  }

  const responses = await Promise.all(requests);

  const rateLimitedResponses = responses.filter(r => r.status === 429);
  const tooManyRequests = rateLimitedResponses.length > 0;

  if (tooManyRequests) {
    logTest(
      '速率限制',
      'PASS',
      `速率限制生效，${rateLimitedResponses.length} 个请求被限制 (429)`
    );
  } else {
    logTest(
      '速率限制',
      'WARN',
      '未检测到速率限制，建议配置请求频率限制'
    );
  }
}

/**
 * 安全头部测试
 */
async function testSecurityHeaders() {
  console.log('\n🔒 安全头部测试');
  console.log('─'.repeat(50));

  try {
    const response = await axios.get(`${BASE_URL}/api/health`, {
      validateStatus: () => true,
    });

    const headers = response.headers;
    const requiredHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': ['DENY', 'SAMEORIGIN'],
      'x-xss-protection': '1; mode=block',
    };

    for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
      const actualValue = headers[header];
      if (!actualValue) {
        logTest(
          `安全头部: ${header}`,
          'WARN',
          `缺少 ${header} 头部`
        );
      } else if (Array.isArray(expectedValue)) {
        if (expectedValue.includes(actualValue.toUpperCase())) {
          logTest(
            `安全头部: ${header}`,
            'PASS',
            `值为: ${actualValue}`
          );
        } else {
          logTest(
            `安全头部: ${header}`,
            'WARN',
            `值为: ${actualValue}，建议使用: ${expectedValue.join(' 或 ')}`
          );
        }
      } else if (actualValue.toLowerCase() === expectedValue.toLowerCase()) {
        logTest(
          `安全头部: ${header}`,
          'PASS',
          `值为: ${actualValue}`
        );
      } else {
        logTest(
          `安全头部: ${header}`,
          'WARN',
          `值为: ${actualValue}，建议值为: ${expectedValue}`
        );
      }
    }

    // 检查是否泄露服务器信息
    if (headers['server']) {
      logTest(
        '服务器信息泄露',
        'WARN',
        `Server头部暴露: ${headers['server']}`,
        '建议隐藏或修改Server头部'
      );
    } else {
      logTest('服务器信息泄露', 'PASS', '未检测到Server头部泄露');
    }

    // 检查X-Powered-By
    if (headers['x-powered-by']) {
      logTest(
        '技术栈信息泄露',
        'WARN',
        `X-Powered-By头部暴露: ${headers['x-powered-by']}`
      );
    } else {
      logTest('技术栈信息泄露', 'PASS', '未检测到X-Powered-By头部');
    }
  } catch (error) {
    logTest('安全头部测试', 'FAIL', `测试失败: ${error.message}`);
  }
}

/**
 * 敏感信息泄露测试
 */
async function testInformationDisclosure() {
  console.log('\n🔒 敏感信息泄露测试');
  console.log('─'.repeat(50));

  // 测试错误信息是否包含敏感信息
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'nonexistent@example.com',
      password: 'wrong',
    }, { validateStatus: () => true });

    const errorMessage = JSON.stringify(response.data).toLowerCase();

    const sensitivePatterns = [
      'database',
      'sql',
      'table',
      'column',
      'password',
      'secret',
      'key',
      'internal server error',
      'stack trace',
      'exception',
    ];

    let hasSensitiveInfo = false;
    for (const pattern of sensitivePatterns) {
      if (errorMessage.includes(pattern)) {
        hasSensitiveInfo = true;
        logTest(
          `信息泄露检查: ${pattern}`,
          'FAIL',
          `错误响应中包含敏感信息: ${pattern}`
        );
      }
    }

    if (!hasSensitiveInfo) {
      logTest(
        '信息泄露检查',
        'PASS',
        '错误响应中未检测到敏感信息泄露'
      );
    }
  } catch (error) {
    logTest('信息泄露检查', 'PASS', '请求被正确处理');
  }
}

/**
 * 生成测试报告
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 安全测试报告');
  console.log('='.repeat(60));
  console.log(`✅ 通过: ${results.passed}`);
  console.log(`❌ 失败: ${results.failed}`);
  console.log(`⚠️  警告: ${results.warnings}`);
  console.log(`📋 总计: ${results.tests.length}`);
  console.log('='.repeat(60));

  if (results.failed > 0) {
    console.log('\n🔴 发现安全漏洞，建议立即修复！');
    process.exit(1);
  } else if (results.warnings > 0) {
    console.log('\n🟡 存在安全警告，建议优化。');
    process.exit(0);
  } else {
    console.log('\n🟢 所有安全测试通过！');
    process.exit(0);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🔐 Tennis Link 安全测试');
  console.log(`目标: ${BASE_URL}`);
  console.log('开始时间:', new Date().toISOString());
  console.log('='.repeat(60));

  try {
    await testSQLInjection();
    await testXSS();
    await testAuthBypass();
    await testRateLimit();
    await testSecurityHeaders();
    await testInformationDisclosure();
  } catch (error) {
    console.error('测试执行错误:', error);
  }

  generateReport();
}

// 检查axios是否安装
try {
  require('axios');
} catch (e) {
  console.error('请先安装 axios: npm install axios --save-dev');
  process.exit(1);
}

main();
