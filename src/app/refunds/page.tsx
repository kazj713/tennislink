'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface Refund {
  id: string;
  orderNo: string;
  amount: string | number;
  reason: string;
  reasonType: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  adminNote?: string;
}

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; style: React.CSSProperties }> = {
  pending_auto: {
    label: '待审核',
    icon: <Clock size={14} />,
    style: { background: 'rgba(201,162,39,0.2)', color: '#c9a227', border: '1px solid rgba(201,162,39,0.3)', borderRadius: '9999px', padding: '4px 12px' }
  },
  pending_manual: {
    label: '待审核',
    icon: <Clock size={14} />,
    style: { background: 'rgba(255,152,0,0.2)', color: '#ffb74d', border: '1px solid rgba(255,152,0,0.3)', borderRadius: '9999px', padding: '4px 12px' }
  },
  approved: {
    label: '已通过',
    icon: <CheckCircle size={14} />,
    style: { background: 'rgba(76,175,80,0.2)', color: '#a7d7a7', border: '1px solid rgba(76,175,80,0.3)', borderRadius: '9999px', padding: '4px 12px' }
  },
  rejected: {
    label: '已拒绝',
    icon: <XCircle size={14} />,
    style: { background: 'rgba(244,67,54,0.2)', color: '#ef9a9a', border: '1px solid rgba(244,67,54,0.3)', borderRadius: '9999px', padding: '4px 12px' }
  },
  refunded: {
    label: '已退款',
    icon: <RefreshCw size={14} />,
    style: { background: 'rgba(33,150,243,0.2)', color: '#90caf9', border: '1px solid rgba(33,150,243,0.3)', borderRadius: '9999px', padding: '4px 12px' }
  },
};

const REASON_TYPE_MAP: Record<string, string> = {
  weather: '恶劣天气',
  personal: '个人原因',
  schedule_change: '时间冲突',
  other: '其他原因',
};

function formatAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(2);
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/refunds');
      const data = await res.json();
      const rawRefunds = data.data ?? [];
      setRefunds(rawRefunds.map((r: any) => ({
        id: r.id,
        orderNo: r.paymentOrderId || r.orderNo,
        amount: r.amount,
        reason: r.reason,
        reasonType: r.reasonType,
        status: r.status,
        createdAt: r.createdAt || new Date().toISOString(),
        reviewedAt: r.reviewedAt,
        adminNote: r.adminNote,
      })));
    } catch (err) {
      console.error('获取退款记录失败:', err);
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{background: 'transparent'}}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/orders" className="p-2 rounded-lg transition-colors" style={{background: 'rgba(255,255,255,0.1)'}}>
            <ArrowLeft size={20} className="text-white/70" />
          </Link>
          <h1 className="text-2xl font-bold text-white/95">我的退款</h1>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6b5037]" />
            <p className="mt-3 text-sm text-white/60">加载中...</p>
          </div>
        ) : refunds.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle className="mx-auto w-16 h-16 text-white/30 mb-4" />
            <p className="text-white/60">暂无退款记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {refunds.map((refund) => {
              const statusInfo = STATUS_MAP[refund.status] || { label: refund.status, icon: <AlertCircle size={14} />, style: { background: 'rgba(255,255,255,0.1)' } };
              return (
                <div key={refund.id} className="rounded-lg shadow-sm border p-4 sm:p-5" style={{background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.25)', borderRadius: '12px'}}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={statusInfo.style}>
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                    <span className="text-xs text-white/40">
                      {new Date(refund.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-white/95 font-medium mb-1">订单号：{refund.orderNo?.slice(0, 18)}...</p>
                    <p className="text-xs text-white/60 mb-1">原因类型：{REASON_TYPE_MAP[refund.reasonType] || refund.reasonType}</p>
                    <p className="text-xs text-white/50 line-clamp-2">详细说明：{refund.reason || '-'}</p>
                    {(refund.status === 'rejected' && refund.adminNote) && (
                      <p className="text-xs text-red-300 mt-2 line-clamp-2">拒绝理由：{refund.adminNote}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t" style={{borderColor: 'rgba(255,255,255,0.15)'}}>
                    <span className="text-lg font-bold text-[#6b5037]">¥{formatAmount(refund.amount)}</span>
                    {(refund.status === 'approved' || refund.status === 'refunded') && refund.reviewedAt && (
                      <span className="text-xs text-white/40">处理时间：{new Date(refund.reviewedAt).toLocaleString('zh-CN')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
