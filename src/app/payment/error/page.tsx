'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function PaymentErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || '支付处理失败';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {/* 错误图标 */}
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            支付失败
          </h1>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          <div className="bg-red-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">
              可能的原因：
            </p>
            <ul className="text-sm text-red-600 mt-2 space-y-1 list-disc list-inside">
              <li>支付超时</li>
              <li>余额不足</li>
              <li>网络连接问题</li>
              <li>支付被取消</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link
              href="/payment/test"
              className="block w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 font-medium"
            >
              重新支付
            </Link>
            
            <Link
              href="/"
              className="block w-full bg-white text-gray-700 border border-gray-300 py-3 px-4 rounded-md hover:bg-gray-50 font-medium"
            >
              返回首页
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              如有疑问，请联系客服：support@ydtenhub.online
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <PaymentErrorContent />
    </Suspense>
  );
}
