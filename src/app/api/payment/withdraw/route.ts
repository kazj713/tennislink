import { NextRequest, NextResponse } from 'next/server';
import { PaymentServiceFactory, WithdrawRequest, WithdrawResponse, PaymentMethod } from '@/lib/payment';

/**
 * 处理提现请求
 * POST /api/payment/withdraw
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 解析请求体
    const body: {
      amount: number;
      orderId: string;
      bankCardNo: string;
      bankCode: string;
      accountName: string;
      userId?: string;
      paymentMethod: PaymentMethod;
    } = await request.json();

    // 验证请求参数
    if (!body.amount || !body.orderId || !body.bankCardNo || !body.accountName || !body.paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数',
          message: '请提供完整的提现信息'
        },
        { status: 400 }
      );
    }

    // 验证金额
    if (body.amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: '金额无效',
          message: '提现金额必须大于0'
        },
        { status: 400 }
      );
    }

    // 验证银行卡号
    if (!/^\d{16,19}$/.test(body.bankCardNo)) {
      return NextResponse.json(
        {
          success: false,
          error: '银行卡号无效',
          message: '请输入正确的银行卡号'
        },
        { status: 400 }
      );
    }

    // 创建提现请求对象
    const withdrawRequest: WithdrawRequest = {
      amount: body.amount,
      orderId: body.orderId,
      bankCardNo: body.bankCardNo,
      bankCode: body.bankCode || '',
      accountName: body.accountName,
      userId: body.userId
    };

    // 创建支付服务实例
    const paymentService = PaymentServiceFactory.createPaymentService(body.paymentMethod);

    // 发起提现请求
    const result: WithdrawResponse = await paymentService.withdraw(withdrawRequest);

    // 返回响应
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error: any) {
    console.error('提现请求处理失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '服务器内部错误',
        message: '提现请求处理失败'
      },
      { status: 500 }
    );
  }
}

/**
 * 处理GET请求（返回API说明）
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: true,
      message: '提现API',
      data: {
        endpoint: '/api/payment/withdraw',
        method: 'POST',
        params: {
          amount: 'number - 提现金额（分）',
          orderId: 'string - 提现订单ID',
          bankCardNo: 'string - 银行卡号',
          bankCode: 'string - 银行编码（可选）',
          accountName: 'string - 账户名称',
          userId: 'string - 用户ID（可选）',
          paymentMethod: 'string - 支付方式（alipay或wechat）'
        }
      }
    },
    { status: 200 }
  );
}
