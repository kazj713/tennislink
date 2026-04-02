/**
 * 前端组件测试脚本
 * 检查组件渲染和基本功能
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const TEST_RESULTS = [];
const BROWSER_OPTIONS = {
  headless: process.env.HEADLESS !== 'false',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
};

/**
 * 组件测试用例
 */
const COMPONENT_TESTS = [
  {
    name: '首页组件渲染',
    url: '/',
    selector: 'body',
    expectedTexts: ['网球链接', '首页', '服务'],
    timeout: 5000
  },
  {
    name: '场地列表页面',
    url: '/venues',
    selector: '.venue-list, .venues-grid',
    expectedTexts: ['场地', '筛选', '搜索'],
    timeout: 5000
  },
  {
    name: '教练页面',
    url: '/coaches',
    selector: '.coach-list, .coaches-grid',
    expectedTexts: ['教练', '预约', '评分'],
    timeout: 5000
  },
  {
    name: '用户认证页面',
    url: '/auth/login',
    selector: '.auth-form, .login-form',
    expectedTexts: ['登录', '邮箱', '密码'],
    timeout: 5000
  },
  {
    name: '404页面',
    url: '/non-existent-page',
    selector: '.error-page, .not-found',
    expectedTexts: ['404', '页面未找到'],
    timeout: 5000
  }
];

/**
 * 性能测试用例
 */
const PERFORMANCE_TESTS = [
  {
    name: '首页加载性能',
    url: '/',
    metrics: {
      maxLoadTime: 3000,
      maxTTI: 5000,
      maxFCP: 2000
    }
  },
  {
    name: '场地列表性能',
    url: '/venues',
    metrics: {
      maxLoadTime: 4000,
      maxTTI: 6000,
      maxFCP: 2000
    }
  }
];

/**
 * 执行组件测试
 */
async function runComponentTest(page, test) {
  try {
    console.log(`\n🧪 测试: ${test.name}`);
    
    const startTime = Date.now();
    
    // 导航到页面
    await page.goto(`http://localhost:5000${test.url}`, { 
      waitUntil: 'networkidle2',
      timeout: test.timeout 
    });

    // 等待页面加载
    await page.waitForSelector('body', { timeout: test.timeout });
    
    const loadTime = Date.now() - startTime;
    
    // 检查页面内容
    const pageContent = await page.content();
    const allTextsFound = test.expectedTexts.every(text => 
      pageContent.includes(text)
    );

    // 检查关键元素是否存在
    const hasKeyElements = test.selector ? 
      await page.$$(test.selector).length > 0 : true;

    const success = allTextsFound && hasKeyElements;

    const result = {
      name: test.name,
      success,
      loadTime,
      allTextsFound,
      hasKeyElements,
      screenshots: !success ? 'error' : null
    };

    TEST_RESULTS.push(result);

    if (success) {
      console.log(`   ✅ 成功 (${loadTime}ms)`);
    } else {
      console.log(`   ❌ 失败 (${loadTime}ms)`);
      console.log(`   期望文本: ${test.expectedTexts.join(', ')}`);
      
      // 保存错误截图
      if (!success) {
        const screenshot = await page.screenshot({ encoding: 'base64' });
        result.screenshot = screenshot;
      }
    }

    return success;

  } catch (error) {
    console.log(`   💥 错误: ${error.message}`);
    TEST_RESULTS.push({
      name: test.name,
      success: false,
      error: error.message,
      loadTime: 0
    });
    return false;
  }
}

/**
 * 执行性能测试
 */
async function runPerformanceTest(page, test) {
  try {
    console.log(`\n⚡ 性能测试: ${test.name}`);
    
    // 导航到页面
    await page.goto(`http://localhost:5000${test.url}`, { 
      waitUntil: 'networkidle2' 
    });

    // 获取性能指标
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });

    const success = 
      metrics.loadTime <= test.metrics.maxLoadTime &&
      metrics.firstContentfulPaint <= test.metrics.maxFCP;

    const result = {
      name: test.name,
      success,
      metrics,
      thresholds: test.metrics
    };

    TEST_RESULTS.push(result);

    if (success) {
      console.log(`   ✅ 性能合格`);
      console.log(`   加载时间: ${metrics.loadTime}ms (≤${test.metrics.maxLoadTime}ms)`);
      console.log(`   首次内容绘制: ${metrics.firstContentfulPaint}ms (≤${test.metrics.maxFCP}ms)`);
    } else {
      console.log(`   ❌ 性能不达标`);
      console.log(`   加载时间: ${metrics.loadTime}ms (>${test.metrics.maxLoadTime}ms)`);
      if (metrics.firstContentfulPaint > test.metrics.maxFCP) {
        console.log(`   首次内容绘制: ${metrics.firstContentfulPaint}ms (>${test.metrics.maxFCP}ms)`);
      }
    }

    return success;

  } catch (error) {
    console.log(`   💥 性能测试错误: ${error.message}`);
    TEST_RESULTS.push({
      name: test.name,
      success: false,
      error: error.message
    });
    return false;
  }
}

/**
 * 生成测试报告
 */
function generateComponentReport() {
  const totalTests = TEST_RESULTS.length;
  const passedTests = TEST_RESULTS.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log('\n📊 组件测试报告');
  console.log('='.repeat(50));
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过数: ${passedTests}`);
  console.log(`失败数: ${failedTests}`);
  console.log(`成功率: ${successRate}%`);

  // 性能统计
  const performanceTests = TEST_RESULTS.filter(r => r.metrics);
  if (performanceTests.length > 0) {
    const avgLoadTime = performanceTests.reduce((sum, r) => sum + r.metrics.loadTime, 0) / performanceTests.length;
    console.log(`平均加载时间: ${avgLoadTime.toFixed(0)}ms`);
  }

  if (failedTests > 0) {
    console.log('\n❌ 失败的测试:');
    TEST_RESULTS.filter(r => !r.success).forEach(test => {
      console.log(`   - ${test.name}: ${test.error || '测试条件不满足'}`);
    });
  }

  // 保存详细报告
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      passedTests,
      failedTests,
      successRate: parseFloat(successRate)
    },
    results: TEST_RESULTS
  };

  fs.writeFileSync(
    './component-test-report.json', 
    JSON.stringify(reportData, null, 2)
  );
  
  console.log('\n📄 详细报告已保存到: component-test-report.json');
  
  return failedTests === 0;
}

/**
 * 主测试函数
 */
async function runAllComponentTests() {
  console.log('🚀 开始前端组件测试...');
  console.log(`测试目标: http://localhost:5000`);
  
  let browser;
  try {
    browser = await puppeteer.launch(BROWSER_OPTIONS);
    const page = await browser.newPage();

    // 设置视口
    await page.setViewport({ width: 1200, height: 800 });

    // 执行组件测试
    for (const test of COMPONENT_TESTS) {
      await runComponentTest(page, test);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 执行性能测试
    for (const test of PERFORMANCE_TESTS) {
      await runPerformanceTest(page, test);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await browser.close();

  } catch (error) {
    console.error('浏览器测试失败:', error);
    if (browser) await browser.close();
    process.exit(1);
  }

  const allTestsPassed = generateComponentReport();
  
  if (allTestsPassed) {
    console.log('\n🎉 所有组件测试通过！');
    process.exit(0);
  } else {
    console.log('\n💥 部分组件测试失败！');
    process.exit(1);
  }
}

// 检查开发服务器是否运行
async function checkDevServer() {
  try {
    const http = require('http');
    await new Promise((resolve, reject) => {
      const req = http.request('http://localhost:5000', (res) => {
        if (res.statusCode < 500) {
          resolve(true);
        } else {
          reject(new Error('Server not ready'));
        }
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Timeout')));
      req.end();
    });
    return true;
  } catch (error) {
    console.error('❌ 开发服务器未运行或不可访问');
    console.error('请先运行: npm run dev');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkDevServer()
    .then(runAllComponentTests)
    .catch(error => {
      console.error('测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = { runAllComponentTests };