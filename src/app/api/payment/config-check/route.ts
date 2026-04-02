/**
 * 支付配置检查API
 * 用于检查支付宝支付配置是否完整
 */

import { NextResponse } from 'next/server';
import { AlipayPaymentService } from '@/lib/payment/alipay';

export async function GET() {
  try {
    const alipayService = new AlipayPaymentService();
    const status = alipayService.getConfigStatus();
    
    // 检查必要的环境变量
    const requiredEnvVars = [
      'ALIPAY_APP_ID',
      'ALIPAY_PRIVATE_KEY',
      'ALIPAY_PUBLIC_KEY',
      'ALIPAY_GATEWAY',
      'NEXT_PUBLIC_DOMAIN'
    ];
    
    const configured: string[] = [];
    const missing: string[] = [];
    
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        configured.push(envVar);
      } else {
        missing.push(envVar);
      }
    }
    
    return NextResponse.json({
      success: true,
      ready: status.ready,
      configured,
      missing,
      message: status.ready 
        ? '支付宝支付配置完整，可以正常使用'
        : `支付宝支付配置不完整，缺少: ${missing.join(', ')}`
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: '配置检查失败'
    }, { status: 500 });
  }
}
