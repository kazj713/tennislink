'use client';

export default function VIPPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      {/* 功能未开放提示 */}
      <div className="text-center py-20">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.77-1.98-1.003-3.232-.75-1.274.25-2.494 1.08-3.232.75L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">VIP 会员</h1>
        <p className="text-xl text-gray-600 mb-8">
          抱歉，VIP会员功能暂时未开放
        </p>
        <p className="text-gray-500 mb-8">
          我们正在努力完善VIP会员服务，敬请期待
        </p>
        <a
            href="/"
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </a>
      </div>
    </div>
  );
}
