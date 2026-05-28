import { NextRequest, NextResponse } from "next/server";
import { refundManager } from "@/storage/database/refundManager";
import { verifyToken } from "@/lib/auth";
import { getOrderById } from "@/storage/database/paymentManager";
import { courtBookingManager } from "@/storage/database/courtBookingManager";

export async function POST(request: NextRequest) {
  try {
    const token = await verifyToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "未登录", message: "请先登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentOrderId, reason, reasonType } = body;

    if (!paymentOrderId || !reason || !reasonType) {
      return NextResponse.json(
        {
          success: false,
          error: "参数错误",
          message: "paymentOrderId、reason 和 reasonType 为必填项",
        },
        { status: 400 }
      );
    }

    const validReasonTypes = ["weather", "personal", "schedule_change", "other"];
    if (!validReasonTypes.includes(reasonType)) {
      return NextResponse.json(
        {
          success: false,
          error: "参数错误",
          message: "reasonType 必须为 weather、personal、schedule_change 或 other",
        },
        { status: 400 }
      );
    }

    const order = await getOrderById(paymentOrderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "未找到", message: "支付订单不存在" },
        { status: 404 }
      );
    }

    if (order.userId !== token.userId) {
      return NextResponse.json(
        { success: false, error: "无权限", message: "无权操作此订单" },
        { status: 403 }
      );
    }

    if (order.status !== "paid") {
      return NextResponse.json(
        {
          success: false,
          error: "状态错误",
          message: "只有已支付的订单可以申请退款",
        },
        { status: 400 }
      );
    }

    const existingRefund = await refundManager.hasExistingRefund(
      token.userId,
      paymentOrderId
    );
    if (existingRefund) {
      return NextResponse.json(
        {
          success: false,
          error: "重复申请",
          message: "该订单已有进行中的退款申请，请勿重复提交",
        },
        { status: 400 }
      );
    }

    let bookingDate = "";
    let bookingStartTime = "";
    let bookingId = "";

    if (order.metadata?.courtBookingId) {
      const booking = await courtBookingManager.getBookingById(
        order.metadata.courtBookingId
      );
      if (booking) {
        bookingDate = booking.bookingDate as string;
        bookingStartTime = booking.startTime as string;
        bookingId = booking.id;
      }
    }

    const refundCheck = await refundManager.canRequestRefund(
      paymentOrderId,
      bookingDate,
      bookingStartTime
    );

    if (!refundCheck.canRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "无法申请",
          message: refundCheck.reason,
        },
        { status: 400 }
      );
    }

    let initialStatus = "pending_auto";
    if (
      reasonType === "weather" &&
      refundCheck.isWeatherException
    ) {
      initialStatus = "pending_manual";
    }

    const refundData = {
      userId: token.userId,
      paymentOrderId,
      bookingId: bookingId || null,
      reason,
      reasonType,
      status: initialStatus,
      amount: order.paidAmount || order.amount,
      metadata: {
        hoursUntilBooking: refundCheck.hoursUntilBooking,
        isWeatherException: refundCheck.isWeatherException,
      },
    };

    const refund = await refundManager.createRefund(refundData);

    if (
      initialStatus === "pending_auto" &&
      refundCheck.hoursUntilBooking > 24
    ) {
      try {
        await refundManager.reviewRefund(refund.id, "approve", "system");
        console.log(`[退款] ${refund.id} 自动审核通过`);
      } catch (autoApproveError) {
        console.error("[退款] 自动审核失败:", autoApproveError);
      }
    }

    return NextResponse.json({
      success: true,
      data: refund,
      message:
        initialStatus === "pending_manual"
          ? "退款申请已提交，等待管理员审核"
          : "退款申请已提交",
    });
  } catch (error) {
    console.error("Create refund error:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误", message: "创建退款申请失败" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await verifyToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "未登录", message: "请先登录" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    const refunds = await refundManager.getUserRefunds(token.userId, {
      status,
    });

    return NextResponse.json({
      success: true,
      data: refunds,
    });
  } catch (error) {
    console.error("Get user refunds error:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误", message: "获取退款列表失败" },
      { status: 500 }
    );
  }
}
