/**
 * 首页组件
 * 展示平台的核心功能等信息
 */
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative pt-16 pb-32 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              让网球学习更智能
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              AI 驱动的教练匹配 + 动作分析，让每一次挥拍都更精准
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/coaches"
                className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                找教练
              </Link>
              <Link
                href="/ai-analysis"
                className="px-8 py-4 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors border-2 border-white"
              >
                AI 分析
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 核心功能 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
            核心功能
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* 功能卡片 1 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">智能教练匹配</h3>
              <p className="text-gray-600 leading-relaxed">
                根据你的技术水平、学习目标和时间安排，AI 智能推荐最适合你的专业教练
              </p>
            </div>

            {/* 功能卡片 2 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">AI 动作分析</h3>
              <p className="text-gray-600 leading-relaxed">
                上传训练视频，AI 实时分析挥拍动作，精准指出问题并给出改进建议
              </p>
            </div>

            {/* 功能卡片 3 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">球友匹配</h3>
              <p className="text-gray-600 leading-relaxed">
                基于地理位置和球技水平，轻松找到志同道合的球友，一起提升球技
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">开始你的网球之旅</h2>
          <p className="text-xl mb-8 text-white/90">
            加入 Tennis Link，让 AI 帮你快速提升球技
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            免费注册
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; 2025 Tennis Link. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/admin" className="hover:text-emerald-600 transition-colors">
                后台管理
              </Link>
              <Link href="/login" className="hover:text-emerald-600 transition-colors">
                登录
              </Link>
              <Link href="/register" className="hover:text-emerald-600 transition-colors">
                注册
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
