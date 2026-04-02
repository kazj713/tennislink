"use client";

import { useState } from "react";
import { Database, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function SeedDataPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeed = async () => {
    if (!confirm("确定要初始化数据吗？这将会创建示例用户、教练、场地和课程数据。")) {
      return;
    }

    setIsSeeding(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/seed", {
        method: "POST",
      });

      const data = await response.json();
      setResult({
        success: data.success,
        message: data.message,
      });
    } catch (error) {
      setResult({
        success: false,
        message: "初始化失败，请重试",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">数据初始化</h1>
        <p className="text-gray-600 mt-2">
          初始化系统所需的示例数据，包括用户、教练、场地和课程
        </p>
      </div>

      {/* 说明卡片 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-3">
          <Database className="text-blue-600 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">数据初始化说明</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 创建 1 个管理员账号</li>
              <li>• 创建 4 位认证教练（李明、张伟、王芳、陈强）</li>
              <li>• 创建 4 个场地（北京、上海、广州、深圳）</li>
              <li>• 为每个场地生成未来 7 天的可用时段</li>
              <li>• 创建 4 种类型的课程</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 初始化按钮 */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">初始化数据</h2>
            <p className="text-gray-600 text-sm mt-1">
              点击下方按钮开始数据初始化
            </p>
          </div>
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className={`
              px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors
              ${isSeeding
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
              }
            `}
          >
            {isSeeding ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>初始化中...</span>
              </>
            ) : (
              <>
                <Database size={20} />
                <span>开始初始化</span>
              </>
            )}
          </button>
        </div>

        {/* 结果提示 */}
        {result && (
          <div
            className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
              result.success
                ? "bg-blue-50 border border-blue-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {result.success ? (
              <CheckCircle className="text-blue-600" size={20} />
            ) : (
              <AlertCircle className="text-red-600" size={20} />
            )}
            <span
              className={result.success ? "text-blue-900" : "text-red-900"}
            >
              {result.message}
            </span>
          </div>
        )}
      </div>

      {/* 登录信息 */}
      {result && result.success && (
        <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">测试账号信息</h3>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-900">管理员</p>
              <p className="text-sm text-gray-600">账号: admin@tennislink.com</p>
              <p className="text-sm text-gray-600">密码: admin123456</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-900">教练（4位）</p>
              <p className="text-sm text-gray-600">账号: liming@coach.com / zhangwei@coach.com / wangfang@coach.com / chenqiang@coach.com</p>
              <p className="text-sm text-gray-600">密码: coach123</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
