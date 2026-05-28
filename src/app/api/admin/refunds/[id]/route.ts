import { NextRequest, NextResponse } from "next/server";
import { refundManager } from "@/storage/database/refundManager";
import { verifyToken } from "@/lib/auth";
import AlipayPaymentService from "@/lib/payment/alipay";

const alipayService = new AlipayPaymentService();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await verifyToken(request);
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "无权限", message: "需要管理员权限" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, adminNote } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "参数错误",
          message: "action 必须为 approve 或 reject",
        },
        { status: 400 }
      );
    }

    const existingRefund = await refundManager.getRefundById(id);
    if (!existingRefund) {
      return NextResponse.json(
        { success: false, error: "未找到", message: "退款申请不存在" },
        { status: 404 }
      );
    }

    if (
      !["pending_auto", "pending_manual"].includes(existingRefund.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "状态错误",
          message: "该退款申请已处理，无法重复审核",
        },
        { status: 400 }
      );
    }

    const result = await refundManager.reviewRefund(
      id,
      action,
      token.userId,
      adminNote
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "操作失败",
          message: "退款审核失败，请稍后重试",
        },
        { status: 500 }
      );
    }

    if (action === "approve") {
      try {
        const refundAmountYuan = (typeof result.amount === 'string' ? parseFloat(result.amount) : result.amount);
        const refundResult = await alipayService.refund({
          outTradeNo: result.orderNo,
          refundAmount: refundAmountYuan.toFixed(2),
          refundReason: result.reason || '用户退款',
        });

        if (refundResult.success && refundResult.data?.tradeNo) {
          await refundManager.markAsRefunded(id, refundResult.data.tradeNo);
          return NextResponse.json({
            success: true,
            data: { ...result, refundTransactionId: refundResult.data.tradeNo },
            message: "退款申请已通过，退款已处理",
          });
        } else {
          console.error("Alipay refund failed:", refundResult.error);
          return NextResponse.json({
            success: true,
            data: result,
            message: "退款申请已通过，但退款执行失败，请后续手动处理",
          });
        }
      } catch (refundError) {
        console.error("Refund execution error:", refundError);
        return NextResponse.json({
          success: true,
          data: result,
          message: "退款申请已通过，但退款执行异常，请后续手动处理",
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      message:
        action === "approve"
          ? "退款申请已通过，将进行退款处理"
          : "退款申请已拒绝",
    });
  } catch (error) {
    console.error("Review refund error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "服务器错误",
        message: "退款审核失败",
      },
      { status: 500 }
    );
  }
}
