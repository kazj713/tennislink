'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<'student' | 'coach' | 'admin'>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // 微信扫码登录
  const [showQrLogin, setShowQrLogin] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<'idle' | 'loading' | 'waiting' | 'scanned' | 'confirmed' | 'expired' | 'error'>('idle');
  const qrPollingRef = useRef<NodeJS.Timeout | null>(null);

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

  // 获取二维码
  const handleWechatQRLogin = async () => {
    setShowQrLogin(true);
    setQrStatus('loading');

    try {
      const res = await fetch('/api/auth/wechat-qrcode', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setQrCodeData(data.data.qrcode);
        setQrSessionId(data.data.sessionId);
        setQrStatus('waiting');
        startPolling(data.data.sessionId);
      } else {
        setQrStatus('error');
        setError('获取二维码失败');
      }
    } catch (err) {
      setQrStatus('error');
      setError('网络错误，请重试');
    }
  };

  // 轮询扫码状态
  const startPolling = (sessionId: string) => {
    if (qrPollingRef.current) clearInterval(qrPollingRef.current);

    qrPollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/wechat-callback?sessionId=${sessionId}`);
        const data = await res.json();

        if (data.success && data.data.status !== 'waiting') {
          setQrStatus(data.data.status);

          if (data.data.status === 'confirmed' && data.data.user && data.data.token) {
            // 登录成功
            clearInterval(qrPollingRef.current!);

            // 存储token和用户信息
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            document.cookie = `token=${data.data.token}; path=/; max-age=604800; SameSite=Lax`;

            // 根据角色跳转
            if (data.data.user.role === 'admin') {
              router.push('/admin');
            } else if (data.data.user.role === 'coach') {
              router.push('/coach-profile');
            } else {
              router.push('/');
            }
          } else if (data.data.status === 'scanned') {
            // 已扫描，继续等待确认
          } else if (data.data.status === 'expired') {
            clearInterval(qrPollingRef.current!);
            setQrStatus('expired');
          }
        }
      } catch {
        // 忽略轮询错误
      }
    }, 2000); // 每2秒轮询一次

    // 5分钟后停止轮询
    setTimeout(() => {
      if (qrPollingRef.current) {
        clearInterval(qrPollingRef.current);
        setQrStatus('expired');
      }
    }, 300000);
  };

  // 切换回账号密码登录
  const handleBackToPasswordLogin = () => {
    setShowQrLogin(false);
    setQrCodeData(null);
    setQrSessionId(null);
    setQrStatus('idle');
    if (qrPollingRef.current) {
      clearInterval(qrPollingRef.current);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!agreeTerms) {
      setError('请先阅读并同意用户协议和隐私政策');
      return;
    }

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
          router.push('/coach-profile');
        } else if (userRole === 'student') {
          router.push('/profile');
        } else if (userRole === 'admin') {
          router.push('/admin');
        } else {
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            学员登录
          </button>
          <button
            onClick={() => setUserType('coach')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              userType === 'coach'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            教练登录
          </button>
          <button
            onClick={() => setUserType('admin')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              userType === 'admin'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            管理员
          </button>
        </div>

        {/* 登录方式 Tab 切换 */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            onClick={() => handleBackToPasswordLogin()}
            className={`flex-1 py-3 text-center font-semibold transition-colors relative ${
              !showQrLogin
                ? 'text-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            账号密码登录
            {!showQrLogin && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></span>
            )}
          </button>
          <button
            onClick={() => handleWechatQRLogin()}
            className={`flex-1 py-3 text-center font-semibold transition-colors relative ${
              showQrLogin
                ? 'text-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            微信扫码登录
            {showQrLogin && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></span>
            )}
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 账号密码登录内容 */}
        {!showQrLogin && (
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* 用户协议 */}
            <div className="flex items-start gap-2 mb-6">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="agreeTerms" className="text-sm text-gray-600">
                我已阅读并同意{' '}
                <a href="/terms" className="text-emerald-600 hover:underline">《用户服务协议》</a>
                {' '}和{' '}
                <a href="/privacy" className="text-emerald-600 hover:underline">《隐私政策》</a>
              </label>
            </div>
            {!agreeTerms && (
              <p className="mb-4 text-sm text-red-500">请先阅读并同意用户协议和隐私政策</p>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading || !agreeTerms}
              className="w-full py-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>

            {/* 忘记密码链接 */}
            <div className="text-center">
              <Link href="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700">
                忘记密码？
              </Link>
            </div>
          </form>
        )}

        {/* 微信扫码登录内容 */}
        {showQrLogin && (
          <div className="flex flex-col items-center py-4">
            {/* 二维码展示区 */}
            <div className="relative w-[280px] h-[280px] border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
              {qrStatus === 'loading' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 text-sm">正在生成二维码...</p>
                </div>
              )}

              {(qrStatus === 'waiting' || qrStatus === 'scanned') && qrCodeData && (
                <>
                  <img src={qrCodeData} alt="微信扫码登录" className="w-[280px] h-[280px]" />
                  {qrStatus === 'scanned' && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <p className="text-emerald-600 font-semibold">已扫描，请在手机上确认</p>
                    </div>
                  )}
                </>
              )}

              {qrStatus === 'confirmed' && (
                <div className="flex flex-col items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <p className="text-emerald-600 font-semibold">登录成功，正在跳转...</p>
                </div>
              )}

              {qrStatus === 'expired' && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-gray-500 text-sm">二维码已过期</p>
                  <button
                    onClick={() => handleWechatQRLogin()}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                  >
                    刷新二维码
                  </button>
                </div>
              )}

              {qrStatus === 'error' && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-red-500 text-sm">获取失败</p>
                  <button
                    onClick={() => handleWechatQRLogin()}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                  >
                    重试
                  </button>
                </div>
              )}
            </div>

            {/* 状态提示文字 */}
            <p className="mt-4 text-sm text-gray-500">
              {qrStatus === 'waiting' && '请使用微信扫描二维码'}
              {qrStatus === 'scanned' && '已扫描，请在手机上确认'}
              {qrStatus === 'confirmed' && '登录成功，正在跳转...'}
            </p>

            {/* 返回账号密码登录 */}
            <button
              onClick={() => handleBackToPasswordLogin()}
              className="mt-6 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              返回账号密码登录
            </button>
          </div>
        )}

        {/* 注册链接 */}
        <p className="mt-6 text-center text-gray-600">
          还没有账号？
          <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold ml-1">
            立即注册
          </Link>
        </p>

        {/* 后台管理入口 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors text-sm"
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
