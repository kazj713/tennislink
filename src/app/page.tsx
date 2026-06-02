/**
 * 首页组件
 * 展示平台的核心功能、推荐教练等信息
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

      {/* 推荐教练 */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">推荐教练</h2>
            <Link href="/coaches" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              查看全部 →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 教练卡片 1 */}
            <Link href="/coaches/1" className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
              <div className="aspect-[4/3] bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                <span className="text-8xl font-bold text-white/20">张</span>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">张教练</h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-gray-700 font-semibold">4.9</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">10年教学经验，ATP认证教练</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-emerald-600">¥300/课时</span>
                  <span className="text-sm text-gray-500">已教学 500+ 课时</span>
                </div>
              </div>
            </Link>

            {/* 教练卡片 2 */}
            <Link href="/coaches/2" className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
              <div className="aspect-[4/3] bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                <span className="text-8xl font-bold text-white/20">李</span>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">李教练</h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-gray-700 font-semibold">4.8</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">8年教学经验，前省队主力</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-emerald-600">¥250/课时</span>
                  <span className="text-sm text-gray-500">已教学 350+ 课时</span>
                </div>
              </div>
            </Link>

            {/* 教练卡片 3 */}
            <Link href="/coaches/3" className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
              <div className="aspect-[4/3] bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                <span className="text-8xl font-bold text-white/20">王</span>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">王教练</h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-gray-700 font-semibold">4.7</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">5年教学经验，青少年专家</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-emerald-600">¥200/课时</span>
                  <span className="text-sm text-gray-500">已教学 200+ 课时</span>
                </div>
              </div>
            </Link>
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
