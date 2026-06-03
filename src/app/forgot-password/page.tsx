'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 验证邮箱格式
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 验证手机号格式
  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!target.trim()) {
      setError('请输入邮箱或手机号');
      return;
    }

    if (!isValidEmail(target) && !isValidPhone(target)) {
      setError('请输入有效的邮箱地址或手机号');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('验证码已发送');
        setTimeout(() => {
          router.push(`/reset-password?target=${encodeURIComponent(target)}`);
        }, 2000);
      } else {
        setError(data.error || '发送验证码失败，请稍后重试');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">T</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">忘记密码</h1>
          <p className="text-gray-600 mt-2">输入您的邮箱或手机号，我们将发送验证码帮助您重置密码</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 成功提示 */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 邮箱/手机号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱 / 手机号
            </label>
            <input
              type="text"
              placeholder="请输入邮箱或手机号"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* 发送验证码按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '发送中...' : '发送验证码'}
          </button>
        </form>

        {/* 返回登录链接 */}
        <p className="mt-6 text-center text-gray-600">
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
            返回登录
          </Link>
        </p>
      </div>
    </div>
  );
}
