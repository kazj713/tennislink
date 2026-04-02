import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-auto p-8">
        {/* 导航 */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            返回首页
          </Link>
        </div>

        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">隐私政策</h1>
          <p className="text-gray-600 mt-2">更新日期：2024-01-26</p>
        </div>

        {/* 内容 */}
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. 隐私政策的接受</h2>
            <p>
              欢迎使用 Tennis Link 平台。通过访问或使用我们的服务，您同意我们按照本隐私政策收集、使用、存储和披露您的信息。如果您不同意本隐私政策，请不要使用我们的服务。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. 我们收集的信息</h2>
            <p>
              我们收集以下类型的信息：
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>注册信息：姓名、邮箱、手机号、密码等</li>
              <li>个人资料：性别、出生日期、城市、球技水平、学习目标等</li>
              <li>使用信息：浏览历史、预约记录、支付信息等</li>
              <li>设备信息：IP地址、设备类型、操作系统等</li>
              <li>AI分析数据：视频、动作分析结果等</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. 信息的使用方式</h2>
            <p>
              我们使用收集的信息用于以下目的：
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>提供和改进我们的服务</li>
              <li>处理预约和支付</li>
              <li>提供AI动作分析服务</li>
              <li>发送通知和促销信息</li>
              <li>保护平台安全和用户权益</li>
              <li>遵守法律法规要求</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. 信息的共享方式</h2>
            <p>
              我们不会向第三方出售您的个人信息，但可能会在以下情况下共享您的信息：
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>获得您的明确同意</li>
              <li>与我们的关联公司共享</li>
              <li>与服务提供商共享（如支付处理、云存储等）</li>
              <li>遵守法律法规要求</li>
              <li>保护平台安全和用户权益</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. 信息的保护措施</h2>
            <p>
              我们采取多种安全措施保护您的信息，包括：
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>数据加密存储和传输</li>
              <li>访问控制和身份验证</li>
              <li>定期安全审计和漏洞扫描</li>
              <li>员工保密协议和培训</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. 用户权利</h2>
            <p>
              您有权：
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>访问和修改您的个人信息</li>
              <li>删除您的个人信息</li>
              <li>限制或拒绝我们使用您的信息</li>
              <li>撤回您的同意</li>
              <li>获取您的信息副本</li>
              <li>投诉和举报</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. 隐私政策的修改</h2>
            <p>
              我们可能会不时修改本隐私政策。修改后的政策将在平台上公布，您继续使用我们的服务即表示您接受修改后的隐私政策。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">8. 儿童隐私保护</h2>
            <p>
              我们的服务不面向13岁以下的儿童。如果我们发现我们收集了13岁以下儿童的个人信息，我们将立即删除该信息。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">9. 适用法律</h2>
            <p>
              本隐私政策受中华人民共和国法律管辖，任何争议应提交至有管辖权的人民法院解决。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">10. 联系方式</h2>
            <p>
              如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：
            </p>
            <p className="mt-2">邮箱：privacy@tennislink.com</p>
            <p>电话：400-123-4567</p>
          </section>
        </div>

        {/* 返回链接 */}
        <div className="mt-12 text-center">
          <Link 
            href="/register" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
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
