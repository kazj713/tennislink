'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<'student' | 'coach'>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleWechatLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // 微信登录逻辑，实际项目中需要调用微信小程序的登录API
      // 这里简化处理，模拟微信登录
      const response = await fetch('/api/auth/wechat-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || '微信登录失败');
      }
    } catch (err) {
      setError('微信登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 验证输入
    if (!identifier.trim() || !password.trim()) {
      setError('邮箱和密码不能为空');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password }),
      });

      const data = await response.json();

      if (data.success) {
        // 保存token到localStorage
        localStorage.setItem('token', data.token);
        
        // 保存token到cookie（用于服务端验证）
        document.cookie = `token=${data.token}; path=/; max-age=86400`;
        
        // 保存用户信息到localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // 根据用户角色跳转到不同页面
        const userRole = data.user.role;
        if (userRole === 'coach') {
          // 教练跳转到教练端页面
          router.push('/coach-profile');
        } else if (userRole === 'student') {
          // 学员跳转到学员端页面
          router.push('/profile');
        } else if (userRole === 'admin') {
          // 管理员跳转到后台管理
          router.push('/admin');
        } else {
          // 默认跳转到首页
          router.push('/');
        }
        router.refresh();
      } else {
        setError(data.error || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">T</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">欢迎回来</h1>
          <p className="text-gray-600 mt-2">登录 Tennis Link 继续你的网球之旅</p>
        </div>

        {/* 用户类型选择 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setUserType('student')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              userType === 'student'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            学员登录
          </button>
          <button
            onClick={() => setUserType('coach')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              userType === 'coach'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            教练登录
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 账号（手机号/邮箱） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              账号（手机号 / 邮箱）
            </label>
            <input
              type="text"
              placeholder="请输入手机号或邮箱"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        {/* 微信登录 */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">或使用微信登录</span>
            </div>
          </div>

          <button
            onClick={() => handleWechatLogin()}
            className="w-full mt-4 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M18.761 12.427c.075 1.318-.562 2.535-1.646 3.198-.43.24-.856.394-1.269.474-.793.158-1.608.08-2.321-.253-.396-.183-.768-.394-1.107-.634l-1.322-.991-1.322.991c-.84.63-1.887.985-2.976.985-1.09 0-2.136-.355-2.976-.985-.339.24-.711.451-1.107.634-.713.333-1.528.411-2.321.253-.413-.08-.839-.234-1.269-.474C1.798 14.962 1.162 13.745 1.236 12.427c.075-1.319.711-2.536 1.797-3.203.43-.24.856-.395 1.269-.475.792-.158 1.607-.08 2.321.253.396.183.768.395 1.107.636l1.322.99 1.322-.99c.84-.631 1.887-.986 2.976-.986 1.09 0 2.136.355 2.976.986.339-.241.711-.453 1.107-.636.713-.333 1.528-.411 2.321-.253.413.08.839.235 1.269.475 1.086.667 1.722 1.884 1.797 3.203zm-16.534-.162c-.066-1.148.496-2.196 1.395-2.753.322-.197.653-.356.988-.474.737-.25 1.51-.25 2.247 0 .335.118.666.277.988.474.899.557 1.461 1.605 1.395 2.753-.066 1.148-.728 2.197-1.719 2.745-.411.237-.85.386-1.288.46-.438.074-.896.074-1.334 0-.438-.074-.877-.223-1.288-.46-.991-.548-1.653-1.597-1.719-2.745z"/>
            </svg>
            微信一键登录
          </button>
        </div>

        {/* 注册链接 */}
        <p className="mt-6 text-center text-gray-600">
          还没有账号？
          <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold ml-1">
            立即注册
          </Link>
        </p>

        {/* 后台管理入口 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <line x1="3" x2="21" y1="9" y2="9"/>
              <path d="m9 16 3-3 3 3"/>
            </svg>
            后台管理系统
          </Link>
        </div>
      </div>
    </div>
  );
}
