/**
 * 微信支付回调通知API
 */

import { NextRequest, NextResponse } from 'next/server';
import { xml2js } from 'xml-js';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const xmlData = body;

    // 解析XML数据
    const result = xml2js(xmlData, { compact: true });
    const paymentData = result.xml;

    // 验证签名
    const sign = paymentData.sign._text;
    const mchKey = process.env.WECHAT_MCH_KEY;
    
    if (!verifyWechatSign(paymentData, sign, mchKey!)) {
      console.error('微信支付回调签名验证失败');
      return NextResponse.json(
        { return_code: 'FAIL', return_msg: '签名失败' },
        { status: 400 }
      );
    }

    // 提取支付信息
    const orderId = paymentData.out_trade_no._text;
    const transactionId = paymentData.transaction_id._text;
    const totalFee = paymentData.total_fee._text;
    const resultCode = paymentData.result_code._text;

    if (resultCode !== 'SUCCESS') {
      return NextResponse.json(
        { return_code: 'SUCCESS', return_msg: 'OK' }
      );
    }

    // 更新订单状态
    await updatePaymentStatus(orderId, {
      transactionId,
      status: 'SUCCESS',
      paidAmount: parseInt(totalFee) / 100,
      paymentMethod: 'wechat'
    });

    // 返回成功响应
    return NextResponse.json(
      { return_code: 'SUCCESS', return_msg: 'OK' }
    );

  } catch (error) {
    console.error('微信支付回调处理失败:', error);
    return NextResponse.json(
      { return_code: 'FAIL', return_msg: '处理失败' },
      { status: 500 }
    );
  }
}

/**
 * 验证微信支付签名
 */
function verifyWechatSign(data: any, sign: string, key: string): boolean {
  // 提取需要签名的字段
  const fields = [
    'return_code',
    'return_msg',
    'appid',
    'mch_id',
    'nonce_str',
    'result_code',
    'openid',
    'is_subscribe',
    'trade_type',
    'bank_type',
    'total_fee',
    'fee_type',
    'transaction_id',
    'out_trade_no',
    'attach',
    'time_end'
  ];

  const stringA = fields
    .filter(field => data[field] && data[field]._text)
    .map(field => `${field}=${data[field]._text}`)
    .join('&');

  const stringSignTemp = `${stringA}&key=${key}`;
  const calculatedSign = crypto
    .createHash('md5')
    .update(stringSignTemp, 'utf8')
    .digest('hex')
    .toUpperCase();

  return calculatedSign === sign;
}

/**
 * 更新支付状态
 */
async function updatePaymentStatus(orderId: string, paymentInfo: any) {
  const { updatePaymentStatus } = await import('@/lib/paymentManager');
  return await updatePaymentStatus(orderId, paymentInfo);
}