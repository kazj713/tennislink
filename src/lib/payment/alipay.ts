/**
 * 支付宝支付服务 - 生产环境优化版
 * 支持真实支付宝支付接口调用
 */

import { PaymentService, PaymentRequest, PaymentResponse, WithdrawRequest, WithdrawResponse } from './index';
import { getSiteUrl } from '@/lib/env';

// 支付宝SDK类型定义
type AlipaySdkType = any;

export class AlipayPaymentService extends PaymentService {
  private alipaySdk: AlipaySdkType | null = null;
  private isConfigured: boolean = false;

  constructor() {
    super();
    this.initializeSdk();
  }

  /**
   * 初始化支付宝SDK
   */
  private initializeSdk(): void {
    try {
      const appId = process.env.ALIPAY_APP_ID;
      const privateKey = process.env.ALIPAY_PRIVATE_KEY;
      const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY;

      if (!appId || !privateKey) {
        console.warn('[支付宝] 配置缺失: ALIPAY_APP_ID 或 ALIPAY_PRIVATE_KEY 未设置');
        this.isConfigured = false;
        return;
      }

      // 动态导入支付宝SDK
      const alipaySdkModule = require('alipay-sdk');
      const AlipaySdk = alipaySdkModule.default || alipaySdkModule;
      
      this.alipaySdk = new AlipaySdk({
        appId: appId,
        privateKey: this.formatPrivateKey(privateKey),
        alipayPublicKey: alipayPublicKey ? this.formatPublicKey(alipayPublicKey) : undefined,
        gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
        timeout: 30000, // 30秒超时
        signType: 'RSA2', // 使用RSA2签名
      });

      this.isConfigured = true;
      console.log('[支付宝] SDK初始化成功');
    } catch (error) {
      console.error('[支付宝] SDK初始化失败:', error);
      this.isConfigured = false;
    }
  }

  /**
   * 格式化私钥
   */
  private formatPrivateKey(key: string): string {
    // 如果已经是标准格式，直接返回
    if (key.includes('-----BEGIN PRIVATE KEY-----')) {
      return key;
    }
    
    // 清理密钥内容
    const cleanKey = key
      .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
      .replace(/-----END RSA PRIVATE KEY-----/g, '')
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s/g, '');
    
    // 重新格式化
    const formattedKey = cleanKey.match(/.{1,64}/g)?.join('\n') || cleanKey;
    return `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----`;
  }

  /**
   * 格式化公钥
   */
  private formatPublicKey(key: string): string {
    // 如果已经是标准格式，直接返回
    if (key.includes('-----BEGIN PUBLIC KEY-----')) {
      return key;
    }
    
    // 清理密钥内容
    const cleanKey = key
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\s/g, '');
    
    // 重新格式化
    const formattedKey = cleanKey.match(/.{1,64}/g)?.join('\n') || cleanKey;
    return `-----BEGIN PUBLIC KEY-----\n${formattedKey}\n-----END PUBLIC KEY-----`;
  }

  /**
   * 检查支付配置是否完整
   */
  public isReady(): boolean {
    return this.isConfigured && this.alipaySdk !== null;
  }

  /**
   * 获取配置状态信息
   */
  public getConfigStatus(): { ready: boolean; missing: string[] } {
    const missing: string[] = [];
    
    if (!process.env.ALIPAY_APP_ID) missing.push('ALIPAY_APP_ID');
    if (!process.env.ALIPAY_PRIVATE_KEY) missing.push('ALIPAY_PRIVATE_KEY');
    if (!process.env.ALIPAY_PUBLIC_KEY) missing.push('ALIPAY_PUBLIC_KEY');
    if (!process.env.ALIPAY_GATEWAY) missing.push('ALIPAY_GATEWAY');
    
    return {
      ready: missing.length === 0,
      missing
    };
  }

  /**
   * 创建支付宝支付订单
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 检查配置
      if (!this.isReady()) {
        const status = this.getConfigStatus();
        return {
          success: false,
          error: `支付宝支付未配置，缺少: ${status.missing.join(', ')}`,
          message: '支付宝支付服务未就绪'
        };
      }

      // 验证请求参数
      if (!request.orderId || !request.amount || !request.description) {
        return {
          success: false,
          error: '缺少必要的支付参数: orderId, amount, description',
          message: '支付参数不完整'
        };
      }

      // 构建支付参数
      const notifyUrl = process.env.ALIPAY_NOTIFY_URL ||
        `${getSiteUrl()}/api/payments/notify/alipay`;

      const returnUrl = request.returnUrl ||
        `${getSiteUrl()}/payment/success`;

      // 调用支付宝接口创建订单
      const result = await this.alipaySdk.exec('alipay.trade.page.pay', {
        notify_url: notifyUrl,
        return_url: returnUrl,
        bizContent: {
          out_trade_no: request.orderId,
          total_amount: (request.amount / 100).toFixed(2), // 分转元
          subject: request.description,
          product_code: 'FAST_INSTANT_TRADE_PAY',
          // 可选参数
          body: request.description,
          timeout_express: '30m', // 30分钟支付超时
        }
      });

      // 生成交易ID用于内部追踪
      const transactionId = `ALIPAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      console.log('[支付宝] 支付订单创建成功:', {
        orderId: request.orderId,
        transactionId,
        amount: request.amount
      });

      return {
        success: true,
        data: {
          transactionId,
          orderId: request.orderId,
          amount: request.amount,
          status: 'pending',
          paymentMethod: 'alipay',
          paymentUrl: result // 支付宝收银台页面URL
        },
        message: '支付宝支付订单创建成功'
      };

    } catch (error: any) {
      console.error('[支付宝] 创建支付订单失败:', error);
      return {
        success: false,
        error: error.message || '支付宝支付创建失败',
        message: '支付订单创建失败，请稍后重试'
      };
    }
  }

  /**
   * 查询支付宝订单状态
   */
  async queryPayment(transactionId: string): Promise<PaymentResponse> {
    try {
      if (!this.isReady()) {
        return {
          success: false,
          error: '支付宝支付未配置',
          message: '支付服务未就绪'
        };
      }

      const result = await this.alipaySdk.exec('alipay.trade.query', {
        bizContent: {
          out_trade_no: transactionId
        }
      });

      // 解析支付状态
      const tradeStatus = result.tradeStatus;
      let status: 'paid' | 'pending' | 'failed' = 'pending';
      
      switch (tradeStatus) {
        case 'TRADE_SUCCESS':
        case 'TRADE_FINISHED':
          status = 'paid';
          break;
        case 'TRADE_CLOSED':
          status = 'failed';
          break;
        case 'WAIT_BUYER_PAY':
        default:
          status = 'pending';
      }

      return {
        success: true,
        data: {
          transactionId: result.tradeNo || transactionId,
          orderId: result.outTradeNo || transactionId,
          amount: parseFloat(result.totalAmount) * 100, // 元转分
          status,
          paymentMethod: 'alipay',
          paidAt: result.sendPayDate || new Date().toISOString()
        },
        message: '查询成功'
      };

    } catch (error: any) {
      console.error('[支付宝] 查询订单失败:', error);
      return {
        success: false,
        error: error.message || '查询失败',
        message: '订单查询失败'
      };
    }
  }

  /**
   * 支付宝退款
   */
  async refundPayment(transactionId: string, amount: number, reason: string): Promise<PaymentResponse> {
    try {
      if (!this.isReady()) {
        return {
          success: false,
          error: '支付宝支付未配置',
          message: '支付服务未就绪'
        };
      }

      const result = await this.alipaySdk.exec('alipay.trade.refund', {
        bizContent: {
          out_trade_no: transactionId,
          refund_amount: (amount / 100).toFixed(2), // 元
          refund_reason: reason
        }
      });

      if (result.code === '10000') {
        return {
          success: true,
          data: {
            transactionId,
            orderId: result.outTradeNo || transactionId,
            amount,
            status: 'paid',
            paymentMethod: 'alipay'
          },
          message: '退款成功'
        };
      } else {
        return {
          success: false,
          error: result.msg || '退款失败',
          message: '退款申请失败'
        };
      }

    } catch (error: any) {
      console.error('[支付宝] 退款失败:', error);
      return {
        success: false,
        error: error.message || '退款失败',
        message: '退款处理失败'
      };
    }
  }

  /**
   * 支付宝转账（提现）
   */
  async withdraw(request: WithdrawRequest): Promise<WithdrawResponse> {
    try {
      if (!this.isReady()) {
        return {
          success: false,
          error: '支付宝支付未配置',
          message: '支付服务未就绪'
        };
      }

      const result = await this.alipaySdk.exec('alipay.fund.trans.uni.transfer', {
        bizContent: {
          out_biz_no: request.orderId,
          trans_amount: (request.amount / 100).toFixed(2), // 元
          product_code: 'TRANS_ACCOUNT_NO_PWD',
          biz_scene: 'DIRECT_TRANSFER',
          payee_info: {
            identity_type: 'ALIPAY_LOGON_ID', // 支付宝登录号
            identity: request.bankCardNo, // 支付宝账号
            name: request.accountName // 真实姓名
          },
          remark: `用户提现 ${(request.amount / 100).toFixed(2)} 元`
        }
      });

      if (result.code === '10000') {
        return {
          success: true,
          data: {
            transactionId: result.orderId,
            orderId: request.orderId,
            amount: request.amount,
            status: result.status === 'SUCCESS' ? 'success' : 'pending',
            withdrawalTime: new Date().toISOString()
          },
          message: '提现申请提交成功'
        };
      } else {
        return {
          success: false,
          error: result.msg || '提现失败',
          message: '提现申请失败'
        };
      }

    } catch (error: any) {
      console.error('[支付宝] 提现失败:', error);
      return {
        success: false,
        error: error.message || '提现失败',
        message: '提现处理失败'
      };
    }
  }

  /**
   * 验证支付宝回调通知签名
   */
  public verifyNotifySign(params: Record<string, string>): boolean {
    try {
      if (!this.alipaySdk) {
        console.error('[支付宝] SDK未初始化，无法验证签名');
        return false;
      }

      return this.alipaySdk.checkNotifySign(params);
    } catch (error) {
      console.error('[支付宝] 签名验证失败:', error);
      return false;
    }
  }
}

export default AlipayPaymentService;
