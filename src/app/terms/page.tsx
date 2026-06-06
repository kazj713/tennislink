import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5EF] to-[#EEF2EA] p-4 py-8 pt-20">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-auto p-8">
        {/* 导航 */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-primary hover:text-primary-dark transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            返回首页
          </Link>
        </div>

        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">用户协议</h1>
          <p className="text-gray-600 mt-2">更新日期：2024-01-26</p>
        </div>

        {/* 内容 */}
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. 协议的接受</h2>
            <p>
              欢迎使用 Tennis Link 平台。通过访问或使用我们的服务，您同意遵守本用户协议和我们的隐私政策。如果您不同意这些条款，请不要使用我们的服务。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. 服务内容</h2>
            <p>
              Tennis Link 是一个提供网球教练匹配、课程预约、AI动作分析、场地预约等服务的平台。我们保留随时修改、暂停或终止任何服务的权利，无需事先通知。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. 用户账号</h2>
            <p>
              您需要注册一个账号才能使用我们的某些服务。您同意提供准确、完整和最新的注册信息，并对您账号下的所有活动负责。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. 用户行为规范</h2>
            <p>
              您同意在使用我们的服务时遵守所有适用的法律法规，并且不会：
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>侵犯他人的知识产权或其他合法权益</li>
              <li>发布违法、有害、侮辱性或其他不当内容</li>
              <li>干扰或破坏我们的服务或网络</li>
              <li>未经授权访问或使用他人账号</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. 隐私保护</h2>
            <p>
              我们重视您的隐私保护。请阅读我们的《隐私政策》了解我们如何收集、使用和保护您的个人信息。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. 知识产权</h2>
            <p>
              Tennis Link 平台上的所有内容，包括但不限于文本、图像、音频、视频、软件等，均受知识产权法律保护。未经我们授权，您不得复制、修改、分发或使用这些内容。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. 责任限制</h2>
            <p>
              在法律允许的范围内，Tennis Link 不对因使用或无法使用我们的服务而导致的任何直接、间接、偶然、特殊或后果性损害负责。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">8. 协议的修改</h2>
            <p>
              我们可能会不时修改本协议。修改后的协议将在平台上公布，您继续使用我们的服务即表示您接受修改后的协议。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">9. 适用法律</h2>
            <p>
              本协议受中华人民共和国法律管辖，任何争议应提交至有管辖权的人民法院解决。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">10. 联系方式</h2>
            <p>
              如果您对本协议有任何疑问，请通过以下方式联系我们：
            </p>
            <p className="mt-2">邮箱：welov_dign3qgt4q@aka.yeah.net</p>
          </section>
        </div>

        {/* 返回链接 */}
        <div className="mt-12 text-center">
          <Link 
            href="/register" 
            className="inline-flex items-center text-primary hover:text-primary-dark font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            返回注册
          </Link>
        </div>
      </div>
    </div>
  );
}
