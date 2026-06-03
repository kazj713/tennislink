/**
 * 支付宝支付回调通知API - 生产环境优化版
 * 处理支付宝异步通知，确保支付结果正确更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { AlipayPaymentService } from '@/lib/payment/alipay';

export async function POST(request: NextRequest) {
  try {
    console.log('[支付宝回调] 收到支付通知');
    
    // 获取表单数据
    const formData = await request.formData();
    const params: Record<string, string> = {};
    
    // 转换FormData为对象
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    console.log('[支付宝回调] 通知参数:', {
      out_trade_no: params.out_trade_no,
      trade_no: params.trade_no,
      trade_status: params.trade_status,
      total_amount: params.total_amount
    });

    // 验证签名
    const alipayService = new AlipayPaymentService();
    
    if (!alipayService.isReady()) {
      console.error('[支付宝回调] 支付宝服务未配置');
      return new Response('failure', { status: 500 });
    }

    // 使用SDK验证签名
    const isValidSign = alipayService.verifyNotifySign(params);
    
    if (!isValidSign) {
      console.error('[支付宝回调] 签名验证失败');
      return new Response('failure', { status: 400 });
    }

    console.log('[支付宝回调] 签名验证通过');

    // 检查交易状态
    const tradeStatus = params.trade_status;
    
    // 只处理支付成功或完成的订单
    if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      console.log(`[支付宝回调] 交易状态: ${tradeStatus}，暂不处理`);
      return new Response('success'); // 返回success，避免支付宝重复通知
    }

    // 提取支付信息
    const orderId = params.out_trade_no;
    const transactionId = params.trade_no;
    const totalAmount = parseFloat(params.total_amount);
    const buyerId = params.buyer_id;
    const buyerAccount = params.buyer_logon_id;
    const gmtPayment = params.gmt_payment;

    console.log('[支付宝回调] 支付成功，更新订单:', {
      orderId,
      transactionId,
      totalAmount,
      buyerAccount
    });

    // 更新订单状态
    try {
      await updatePaymentStatus(orderId, {
        transactionId,
        status: 'SUCCESS',
        paidAmount: totalAmount,
        paymentMethod: 'alipay',
        buyerId,
        buyerAccount,
        paidAt: gmtPayment || new Date().toISOString()
      });
      
      console.log('[支付宝回调] 订单状态更新成功:', orderId);
    } catch (error) {
      console.error('[支付宝回调] 订单状态更新失败:', error);
      // 返回failure，让支付宝重试
      return new Response('failure', { status: 500 });
    }

    // 返回成功响应（必须返回纯文本"success"）
    return new Response('success');

  } catch (error) {
    console.error('[支付宝回调] 处理失败:', error);
    return new Response('failure', { status: 500 });
  }
}

/**
 * 更新支付状态
 * 这里调用你的订单管理逻辑
 */
async function updatePaymentStatus(orderId: string, paymentInfo: {
  transactionId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  paidAmount: number;
  paymentMethod: 'wechat' | 'alipay';
  buyerId?: string;
  buyerAccount?: string;
  paidAt: string;
}) {
  try {
    // 导入支付管理器
    const { updatePaymentStatus } = await import('@/lib/paymentManager');
    await updatePaymentStatus(orderId, paymentInfo);
  } catch (error) {
    console.error('[支付宝回调] 更新支付状态失败:', error);
    throw error;
  }
}

/**
 * 处理GET请求（支付宝同步回调）
 * 用户支付完成后跳转的页面
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const outTradeNo = searchParams.get('out_trade_no');
    const tradeNo = searchParams.get('trade_no');
    const tradeStatus = searchParams.get('trade_status');

    console.log('[支付宝同步回调] 参数:', { outTradeNo, tradeNo, tradeStatus });

    // 验证签名
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const alipayService = new AlipayPaymentService();
    
    if (alipayService.isReady()) {
      const isValidSign = alipayService.verifyNotifySign(params);
      
      if (!isValidSign) {
        console.error('[支付宝同步回调] 签名验证失败');
        // 重定向到支付失败页面
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_DOMAIN}/payment/error?message=签名验证失败`);
      }
    }

    // 根据支付状态重定向到不同页面
    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      // 支付成功，跳转到成功页面
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_DOMAIN}/payment/success?orderId=${outTradeNo}`);
    } else {
      // 支付未完成，跳转到订单详情页
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_DOMAIN}/orders/${outTradeNo}`);
    }

  } catch (error) {
    console.error('[支付宝同步回调] 处理失败:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_DOMAIN}/payment/error`);
  }
}
