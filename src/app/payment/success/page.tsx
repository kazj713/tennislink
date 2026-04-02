'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      // 查询订单状态
      fetch(`/api/payment/query?orderId=${orderId}`)
        .then(res => res.json())
        .then(data => {
          setOrderInfo(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {/* 成功图标 */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            支付成功！
          </h1>
          
          <p className="text-gray-600 mb-6">
            感谢您的支付，订单已确认
          </p>

          {loading ? (
            <div className="py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">查询订单信息...</p>
            </div>
          ) : orderInfo?.success ? (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">订单号</span>
                  <span className="font-medium">{orderInfo.data?.orderId || orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">支付金额</span>
                  <span className="font-medium text-green-600">
                    ¥{((orderInfo.data?.amount || 0) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">支付方式</span>
                  <span className="font-medium">支付宝</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">支付时间</span>
                  <span className="font-medium">
                    {orderInfo.data?.paidAt 
                      ? new Date(orderInfo.data.paidAt).toLocaleString('zh-CN')
                      : new Date().toLocaleString('zh-CN')
                    }
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 font-medium"
            >
              返回首页
            </Link>
            
            <Link
              href="/orders"
              className="block w-full bg-white text-green-600 border border-green-600 py-3 px-4 rounded-md hover:bg-green-50 font-medium"
            >
              查看订单
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              如有问题，请联系客服：support@ydtenhub.online
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
