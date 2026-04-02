/**
 * 支付服务配置
 * 支持微信支付和支付宝支付
 */

export interface PaymentConfig {
  // 微信支付配置
  wechat: {
    appId: string;
    mchId: string;
    mchKey: string;
    certPath?: string;
    keyPath?: string;
    notifyUrl: string;
  };
  
  // 支付宝配置
  alipay: {
    appId: string;
    privateKey: string;
    publicKey: string;
    gateway: string;
    notifyUrl: string;
  };
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  subject: string;
  description?: string;
  userId: string;
  paymentMethod: 'wechat' | 'alipay';
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  qrCode?: string;
  error?: string;
}

/**
 * 获取支付配置
 */
export function getPaymentConfig(): PaymentConfig {
  const wechat = {
    appId: process.env.WECHAT_APP_ID || '',
    mchId: process.env.WECHAT_MCH_ID || '',
    mchKey: process.env.WECHAT_MCH_KEY || '',
    certPath: process.env.WECHAT_MCH_CERT_PATH,
    keyPath: process.env.WECHAT_MCH_KEY_PATH,
    notifyUrl: process.env.WECHAT_NOTIFY_URL || '',
  };

  const alipay = {
    appId: process.env.ALIPAY_APP_ID || '',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    publicKey: process.env.ALIPAY_PUBLIC_KEY || '',
    gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || '',
  };

  return { wechat, alipay };
}

/**
 * 验证支付配置完整性
 */
export function validatePaymentConfig(): { valid: boolean; missing: string[] } {
  const config = getPaymentConfig();
  const missing: string[] = [];

  // 检查微信支付配置
  if (!config.wechat.appId) missing.push('WECHAT_APP_ID');
  if (!config.wechat.mchId) missing.push('WECHAT_MCH_ID');
  if (!config.wechat.mchKey) missing.push('WECHAT_MCH_KEY');
  if (!config.wechat.notifyUrl) missing.push('WECHAT_NOTIFY_URL');

  // 检查支付宝配置
  if (!config.alipay.appId) missing.push('ALIPAY_APP_ID');
  if (!config.alipay.privateKey) missing.push('ALIPAY_PRIVATE_KEY');
  if (!config.alipay.publicKey) missing.push('ALIPAY_PUBLIC_KEY');
  if (!config.alipay.gateway) missing.push('ALIPAY_GATEWAY');

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * 创建支付订单
 */
export async function createPayment(request: PaymentRequest): Promise<PaymentResult> {
  const config = getPaymentConfig();
  const validation = validatePaymentConfig();
  
  if (!validation.valid) {
    return {
      success: false,
      error: `支付配置缺失: ${validation.missing.join(', ')}`
    };
  }

  try {
    if (request.paymentMethod === 'wechat') {
      return await createWechatPayment(request, config.wechat);
    } else if (request.paymentMethod === 'alipay') {
      return await createAlipayPayment(request, config.alipay);
    }
    
    return {
      success: false,
      error: '不支持的支付方式'
    };
  } catch (error) {
    console.error('创建支付失败:', error);
    return {
      success: false,
      error: '支付创建失败，请重试'
    };
  }
}

/**
 * 创建微信支付
 */
async function createWechatPayment(request: PaymentRequest, config: PaymentConfig['wechat'], clientIp?: string): Promise<PaymentResult> {
  // 这里应该调用微信支付API创建订单
  // 由于涉及证书和签名，建议使用官方SDK或第三方库
  
  // 获取客户端IP，优先使用传入的IP，其次使用环境变量，最后使用默认值
  const spbillCreateIp = clientIp || process.env.WECHAT_PAY_CLIENT_IP || '0.0.0.0';
  
  const params = {
    appid: config.appId,
    mch_id: config.mchId,
    nonce_str: generateNonceStr(),
    body: request.subject,
    out_trade_no: request.orderId,
    total_fee: Math.round(request.amount * 100), // 转换为分
    spbill_create_ip: spbillCreateIp,
    notify_url: config.notifyUrl,
    trade_type: 'NATIVE', // 二维码支付
  };

  // 生成签名
  const sign = generateWechatSign(params, config.mchKey);
  params.sign = sign;

  // 调用微信支付API
  // 这里需要实际的API调用代码，建议使用官方SDK
  const https = require('https');
  const querystring = require('querystring');

  // 构建微信支付请求参数
  const xmlData = `<xml>
    <appid>${config.appId}</appid>
    <mch_id>${config.mchId}</mch_id>
    <nonce_str>${params.nonce_str}</nonce_str>
    <body>${params.body}</body>
    <out_trade_no>${params.out_trade_no}</out_trade_no>
    <total_fee>${params.total_fee}</total_fee>
    <spbill_create_ip>${params.spbill_create_ip}</spbill_create_ip>
    <notify_url>${params.notify_url}</notify_url>
    <trade_type>${params.trade_type}</trade_type>
    <sign>${sign}</sign>
  </xml>`;

  // 发起微信支付统一下单请求
  return new Promise<PaymentResult>((resolve) => {
    const req = https.request({
      hostname: 'api.mch.weixin.qq.com',
      port: 443,
      path: '/pay/unifiedorder',
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Content-Length': Buffer.byteLength(xmlData)
      }
    }, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        // 解析XML响应
        const { xml2js } = require('xml-js');
        const result = xml2js(responseData, { compact: true });
        const returnCode = result.xml.return_code._text;
        
        if (returnCode === 'SUCCESS') {
          const resultCode = result.xml.result_code._text;
          if (resultCode === 'SUCCESS') {
            const codeUrl = result.xml.code_url._text;
            resolve({
              success: true,
              qrCode: codeUrl // 这里可以生成二维码图片
            });
          } else {
            const errCode = result.xml.err_code._text;
            const errCodeDes = result.xml.err_code_des._text;
            resolve({
              success: false,
              error: `微信支付失败: ${errCodeDes} (${errCode})`
            });
          }
        } else {
          const returnMsg = result.xml.return_msg._text;
          resolve({
            success: false,
            error: `微信支付接口失败: ${returnMsg}`
          });
        }
      });
    });

    req.on('error', (err) => {
      console.error('微信支付请求失败:', err);
      resolve({
        success: false,
        error: '微信支付请求失败'
      });
    });

    req.write(xmlData);
    req.end();
  });
}

/**
 * 创建支付宝支付
 */
async function createAlipayPayment(request: PaymentRequest, config: PaymentConfig['alipay']): Promise<PaymentResult> {
  // 构建支付宝支付参数
  const params = {
    app_id: config.appId,
    method: 'alipay.trade.page.pay',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
    version: '1.0',
    notify_url: config.notifyUrl,
    biz_content: JSON.stringify({
      out_trade_no: request.orderId,
      product_code: 'FAST_INSTANT_TRADE_PAY',
      total_amount: request.amount.toFixed(2),
      subject: request.subject,
      body: request.description || ''
    })
  };

  // 生成签名并构建URL
  const sign = generateAlipaySign(params, config.privateKey);
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&') + `&sign=${encodeURIComponent(sign)}`;

  return {
    success: true,
    paymentUrl: `${config.gateway}?${queryString}`
  };
}

/**
 * 生成随机字符串
 */
function generateNonceStr(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成微信支付签名
 */
function generateWechatSign(params: any, key: string): string {
  const crypto = require('crypto');
  
  // 按照微信支付规则生成签名
  const sortedKeys = Object.keys(params).sort();
  const stringA = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
  const stringSignTemp = `${stringA}&key=${key}`;
  
  // 使用MD5加密
  return crypto
    .createHash('md5')
    .update(stringSignTemp, 'utf8')
    .digest('hex')
    .toUpperCase();
}

/**
 * 生成支付宝签名
 */
function generateAlipaySign(params: any, privateKey: string): string {
  const crypto = require('crypto');
  
  // 按照支付宝规则生成签名
  const sortedKeys = Object.keys(params).sort();
  const stringA = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
  
  // 使用RSA2签名
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(stringA, 'utf8');
  
  // 格式化私钥
  const formattedPrivateKey = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${formattedPrivateKey.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;
  
  return sign.sign(privateKeyPem, 'base64');
}