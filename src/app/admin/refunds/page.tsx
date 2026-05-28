'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface Refund {
  id: string;
  orderNo: string;
  userName: string;
  userId: string;
  amount: string | number;
  reason: string;
  reasonType: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  adminNote?: string;
}

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'refunded', label: '已退款' },
];

const STATUS_MAP: Record<string, { label: string; style: React.CSSProperties }> = {
  pending_auto: {
    label: '待审核',
    style: { background: 'rgba(201,162,39,0.2)', color: '#c9a227', border: '1px solid rgba(201,162,39,0.3)', borderRadius: '9999px', padding: '4px 12px' }
  },
  pending_manual: {
    label: '待审核（需人工）',
    style: { background: 'rgba(255,152,0,0.2)', color: '#ffb74d', border: '1px solid rgba(255,152,0,0.3)', borderRadius: '9999px', padding: '4px 12px' }
  },
  approved: {
    label: '已通过',
    style: { background: 'rgba(76,175,80,0.2)', color: '#a7d7a7', border: '1px solid rgba(76,175,80,0.3)', borderRadius: '9999px', padding: '4px 12px' }
  },
  rejected: {
    label: '已拒绝',
    style: { background: 'rgba(244,67,54,0.2)', color: '#ef9a9a', border: '1px solid rgba(244,67,54,0.3)', borderRadius: '9999px', padding: '4px 12px' }
  },
  refunded: {
    label: '已退款',
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

function truncateOrderNo(orderNo: string, maxLen = 16): string {
  if (orderNo.length <= maxLen) return orderNo;
  return orderNo.slice(0, maxLen) + '...';
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; refundId: string; reason: string }>({
    open: false,
    refundId: '',
    reason: '',
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRefunds = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) {
        params.set('status', status);
      }
      const res = await fetch(`/api/admin/refunds?${params.toString()}`);
      const data = await res.json();
      const rawRefunds = data.data ?? [];
      const refundsList = rawRefunds.map((r: any) => ({
        id: r.id,
        orderNo: r.paymentOrderId || r.orderNo,
        userName: r.userName || r.user?.name || r.userId,
        userId: r.userId,
        amount: r.amount,
        reason: r.reason,
        reasonType: r.reasonType,
        status: r.status,
        createdAt: r.createdAt || new Date().toISOString(),
        reviewedAt: r.reviewedAt,
        adminNote: r.adminNote,
      }));
      setRefunds(refundsList);
    } catch (err) {
      console.error('获取退款列表失败:', err);
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds(statusFilter);
  }, [statusFilter, fetchRefunds]);

  const handleApprove = async (refundId: string) => {
    setProcessingId(refundId);
    try {
      const res = await fetch(`/api/admin/refunds/${refundId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ type: 'success', message: '退款申请已通过，正在处理退款' });
        fetchRefunds(statusFilter);
      } else {
        setToast({ type: 'error', message: data.error || data.message || '操作失败' });
      }
    } catch (error) {
      console.error('审核失败:', error);
      setToast({ type: 'error', message: '操作失败，请重试' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (refundId: string) => {
    setRejectDialog({ open: true, refundId, reason: '' });
  };

  const handleRejectConfirm = async () => {
    if (!rejectDialog.refundId || !rejectDialog.reason.trim()) {
      setToast({ type: 'error', message: '请输入拒绝理由' });
      return;
    }

    setProcessingId(rejectDialog.refundId);
    try {
      const res = await fetch(`/api/admin/refunds/${rejectDialog.refundId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          adminNote: rejectDialog.reason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ type: 'success', message: '退款申请已拒绝' });
        setRejectDialog({ open: false, refundId: '', reason: '' });
        fetchRefunds(statusFilter);
      } else {
        setToast({ type: 'error', message: data.error || data.message || '操作失败' });
      }
    } catch (error) {
      console.error('拒绝失败:', error);
      setToast({ type: 'error', message: '操作失败，请重试' });
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const isPendingStatus = (status: string): boolean => {
    return status === 'pending_auto' || status === 'pending_manual';
  };

  if (loading && refunds.length === 0) {
    return (
      <div className="flex items-center justify-center h-64" style={{ background: 'rgba(20,40,35,0.95)' }}>
        <div className="text-white/55">加载中...</div>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(20,40,35,0.95)', minHeight: '100vh', padding: '24px' }}>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">退款管理</h1>
          <p className="text-white/70 mt-2">审核和处理用户的退款申请</p>
          <div className="mt-3 text-xs text-white/50 space-y-1">
            <p>• 距开场 &gt;24小时：自动审核通过并退款</p>
            <p>• 距开场 ≤24小时：仅恶劣天气原因可申请，需人工审核</p>
            <p>• 恶劣天气退款需管理员确认后执行支付宝退款</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-white/70">状态筛选：</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg outline-none text-white bg-transparent"
            style={{
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.06)',
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ color: '#000' }}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: 'rgba(30,50,42,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-white/80">订单号</th>
                <th className="text-left py-4 px-6 font-semibold text-white/80">用户</th>
                <th className="text-right py-4 px-6 font-semibold text-white/80">金额</th>
                <th className="text-left py-4 px-6 font-semibold text-white/80">原因类型</th>
                <th className="text-center py-4 px-6 font-semibold text-white/80">状态</th>
                <th className="text-left py-4 px-6 font-semibold text-white/80">申请时间</th>
                <th className="text-center py-4 px-6 font-semibold text-white/80">操作</th>
              </tr>
            </thead>
            <tbody>
              {refunds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/55">
                    暂无退款申请
                  </td>
                </tr>
              ) : (
                refunds.map((refund) => {
                  const statusInfo = STATUS_MAP[refund.status] || {
                    label: refund.status,
                    style: { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', borderRadius: '9999px', padding: '4px 12px' },
                  };
                  return (
                    <tr
                      key={refund.id}
                      className="border-b border-white/5 transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="py-4 px-6">
                        <span className="text-white/90 font-mono text-sm">{truncateOrderNo(refund.orderNo)}</span>
                      </td>
                      <td className="py-4 px-6 text-white/80">{refund.userName}</td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-semibold text-[#c9a227]">¥{formatAmount(refund.amount)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-white/70 text-sm">
                          {REASON_TYPE_MAP[refund.reasonType] || refund.reasonType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-block text-xs font-medium" style={statusInfo.style}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-white/60 text-sm">
                        {formatTime(refund.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isPendingStatus(refund.status) ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApprove(refund.id)}
                              disabled={processingId === refund.id}
                              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 text-white"
                              style={
                                processingId === refund.id
                                  ? { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }
                                  : { background: 'rgba(26,84,66,0.85)' }
                              }
                              onMouseEnter={(e) => {
                                if (processingId !== refund.id) e.currentTarget.style.background = 'rgba(26,84,66,1)';
                              }}
                              onMouseLeave={(e) => {
                                if (processingId !== refund.id) e.currentTarget.style.background = 'rgba(26,84,66,0.85)';
                              }}
                            >
                              {processingId === refund.id ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  处理中
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={14} />
                                  同意
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleRejectClick(refund.id)}
                              disabled={processingId === refund.id}
                              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 text-white"
                              style={{
                                background: 'rgba(183,28,28,0.7)',
                                opacity: processingId === refund.id ? 0.5 : 1,
                              }}
                            >
                              <XCircle size={14} />
                              拒绝
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-xs">
                            {(refund.status === 'approved' || refund.status === 'refunded') ? (
                              <CheckCircle size={14} className="text-green-400" />
                            ) : refund.status === 'rejected' ? (
                              <XCircle size={14} className="text-red-400" />
                            ) : null}
                            <span className="text-white/50">
                              {refund.adminNote || '已处理'}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rejectDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div
            className="rounded-xl p-6 w-full max-w-md shadow-2xl"
            style={{
              background: 'rgba(30,45,40,0.98)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">拒绝退款申请</h3>
            <p className="text-sm text-white/70 mb-4">请输入拒绝理由（将显示给用户）：</p>
            <textarea
              value={rejectDialog.reason}
              onChange={(e) =>
                setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder="请输入拒绝理由..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg outline-none text-white resize-none"
              style={{
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.06)',
              }}
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setRejectDialog({ open: false, refundId: '', reason: '' })}
                className="px-5 py-2 text-sm font-medium rounded-lg transition-colors text-white/80"
                style={{ background: 'rgba(255,255,255,0.1)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              >
                取消
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={processingId !== null}
                className="px-5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 text-white"
                style={{ background: 'rgba(183,28,28,0.8)' }}
              >
                {processingId ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    提交中...
                  </>
                ) : (
                  '确认拒绝'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg animate-slide-up"
          style={{
            background: toast.type === 'success' ? 'rgba(40,167,69,0.9)' : 'rgba(220,53,69,0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={20} style={{ color: '#fff' }} />
          ) : (
            <XCircle size={20} style={{ color: '#fff' }} />
          )}
          <span className="text-white font-medium text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
