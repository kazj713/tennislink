'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<'student' | 'coach'>('student');
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    account: '', // 账号（自动填充的手机号或邮箱）
    username: '', // 用户名（显示用）
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    code: '', // 验证码
  });
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

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

  // 监听账号输入，自动识别类型
  useEffect(() => {
    const account = formData.account.trim();
    
    if (account) {
      if (isValidEmail(account)) {
        setContactMethod('email');
        setFormData(prev => ({ ...prev, email: account, phone: '' }));
      } else if (isValidPhone(account)) {
        setContactMethod('phone');
        setFormData(prev => ({ ...prev, phone: account, email: '' }));
      } else {
        // 既不是邮箱也不是手机号，保持当前选择
        if (contactMethod === 'email') {
          setFormData(prev => ({ ...prev, email: account }));
        } else {
          setFormData(prev => ({ ...prev, phone: account }));
        }
      }
    }
  }, [formData.account, contactMethod]);

  // 发送验证码
  const handleSendCode = async () => {
    setError('');
    
    const target = contactMethod === 'email' ? formData.email : formData.phone;
    
    if (!target) {
      setError('请先输入邮箱或手机号');
      return;
    }

    if (contactMethod === 'email' && !isValidEmail(target)) {
      setError('邮箱格式不正确');
      return;
    }

    if (contactMethod === 'phone' && !isValidPhone(target)) {
      setError('手机号格式不正确');
      return;
    }

    setSendingCode(true);

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          type: 'register',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 开发环境下显示验证码
        if (process.env.NODE_ENV === 'development' && data.code) {
          setFormData(prev => ({ ...prev, code: data.code }));
        }
        
        // 开始倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.error || '发送验证码失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证账号
    if (!formData.account) {
      setError('请输入手机号或邮箱');
      return;
    }

    // 验证验证码
    if (!formData.code) {
      setError('请输入验证码');
      return;
    }

    // 验证用户名
    if (!formData.username || formData.username.trim().length === 0) {
      setError('请输入用户名');
      return;
    }

    if (formData.username.length < 2 || formData.username.length > 20) {
      setError('用户名长度应为2-20位');
      return;
    }

    // 验证密码
    if (formData.password !== formData.confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    // 验证用户协议和隐私政策
    if (!agreeTerms) {
      setError('请阅读并同意用户协议和隐私政策');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.username,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          code: formData.code,
          role: userType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/login?registered=true');
      } else {
        setError(data.error || '注册失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">T</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">创建账号</h1>
          <p className="text-gray-600 mt-2">加入 Tennis Link 开启网球之旅</p>
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
            学员注册
          </button>
          <button
            onClick={() => setUserType('coach')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              userType === 'coach'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            教练注册
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 账号（手机号/邮箱） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              手机号 / 邮箱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="请输入手机号或邮箱"
              value={formData.account}
              onChange={(e) => setFormData({...formData, account: e.target.value})}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            {/* 自动识别类型提示 */}
            {formData.account && (
              <p className="mt-1 text-xs text-gray-500">
                {isValidEmail(formData.account) && '已识别为邮箱'}
                {isValidPhone(formData.account) && '已识别为手机号'}
              </p>
            )}
          </div>

          {/* 验证码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              验证码 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="请输入验证码"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                required
                maxLength={6}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0 || !formData.account}
                className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
              </button>
            </div>
          </div>

          {/* 用户名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用户名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="请输入用户名（2-20位）"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
              minLength={2}
              maxLength={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="请设置密码（至少6位）"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* 确认密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              确认密码 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="请再次输入密码"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* 用户协议和隐私政策 */}
          <div className="flex items-start mt-2">
            <div className="flex items-center h-5">
              <input
                id="agree-terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 focus:ring-2 focus:ring-offset-2"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="agree-terms" className="text-gray-700">
              我已阅读并同意
              <Link href="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
                《用户协议》
              </Link>
              和
              <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
                《隐私政策》
              </Link>
            </label>
          </div>
        </div>
          {!agreeTerms && (
            <p className="mb-2 text-sm text-red-500">请先阅读并同意用户协议和隐私政策</p>
          )}

        {/* 注册按钮 */}
        <button
          type="submit"
          disabled={loading || !agreeTerms}
          className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '注册中...' : '注册'}
        </button>
      </form>

      {/* 登录链接 */}
      <p className="mt-8 text-center text-gray-600">
        已有账号？
        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold ml-1">
          立即登录
        </Link>
      </p>
      </div>
    </div>
  );
}
