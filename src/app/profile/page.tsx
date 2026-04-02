'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
  learningGoal?: 'fat_loss' | 'entertainment' | 'skill_improvement' | 'competition' | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  
  // 编辑资料状态
  const [editingProfile, setEditingProfile] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    avatar: '',
    learningGoal: '' as 'fat_loss' | 'entertainment' | 'skill_improvement' | 'competition' | '',
    code: '', // 验证码
  });
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [saving, setSaving] = useState(false);

  // 换绑手机号状态
  const [bindingPhone, setBindingPhone] = useState(false);
  const [phoneData, setPhoneData] = useState({
    phone: '',
    code: '',
  });

  // 换绑邮箱状态
  const [bindingEmail, setBindingEmail] = useState(false);
  const [emailData, setEmailData] = useState({
    email: '',
    code: '',
  });

  // 获取用户信息
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (data.success) {
        // 检查是否为学员角色，如果是教练则跳转到教练端
        if (data.data.role === 'coach') {
          router.push('/coach-profile');
          return;
        }
        
        setUser(data.data);
        setEditData(prev => ({
          ...prev,
          name: data.data.name,
          avatar: data.data.avatar || '',
          learningGoal: data.data.learningGoal || '',
        }));
      } else {
        if (response.status === 401) {
          router.push('/login');
        } else {
          setError(data.error || '获取用户信息失败');
        }
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 发送验证码
  const handleSendCode = async (target: string, type: 'bind_phone' | 'bind_email') => {
    setError('');

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, type }),
      });

      const data = await response.json();

      if (data.success) {
        // 开发环境下显示验证码
        if (process.env.NODE_ENV === 'development' && data.code) {
          if (type === 'bind_phone') {
            setPhoneData(prev => ({ ...prev, code: data.code }));
          } else {
            setEmailData(prev => ({ ...prev, code: data.code }));
          }
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

  // 保存个人资料
  const handleSaveProfile = async () => {
    setError('');

    if (!editData.name || editData.name.trim().length === 0) {
      setError('用户名不能为空');
      return;
    }

    if (editData.name.length < 2 || editData.name.length > 20) {
      setError('用户名长度应为2-20位');
      return;
    }

    setSaving(true);

    try {
      const body: any = {
        name: editData.name,
      };

      // 如果修改了用户名，需要验证码
      if (user && editData.name !== user.name) {
        const target = user.email || user.phone;
        if (!target) {
          setError('请先绑定邮箱或手机号');
          setSaving(false);
          return;
        }

        body.code = editData.code;

        // 发送验证码
        const type = user.email ? 'bind_email' : 'bind_phone';
        const codeResponse = await fetch('/api/auth/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target, type }),
        });

        const codeData = await codeResponse.json();
        if (!codeData.success) {
          setError(codeData.error || '发送验证码失败');
          setSaving(false);
          return;
        }

        // 开发环境下自动填充验证码
        if (process.env.NODE_ENV === 'development' && codeData.code) {
          body.code = codeData.code;
        }
      }

      // 如果修改了头像
      if (user && editData.avatar !== user.avatar) {
        body.avatar = editData.avatar;
      }

      // 如果修改了学习目标
      if (user && editData.learningGoal !== user.learningGoal) {
        body.learningGoal = editData.learningGoal || null;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        setEditingProfile(false);
        setError('');
      } else {
        setError(data.error || '保存失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  // 绑定/换绑手机号
  const handleBindPhone = async () => {
    setError('');

    if (!phoneData.phone) {
      setError('请输入手机号');
      return;
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneData.phone)) {
      setError('手机号格式不正确');
      return;
    }

    if (!phoneData.code) {
      setError('请输入验证码');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/user/bind-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(phoneData),
      });

      const data = await response.json();

      if (data.success) {
        fetchUserProfile();
        setBindingPhone(false);
        setPhoneData({ phone: '', code: '' });
        setError('');
      } else {
        setError(data.error || '绑定失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  // 绑定/换绑邮箱
  const handleBindEmail = async () => {
    setError('');

    if (!emailData.email) {
      setError('请输入邮箱');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.email)) {
      setError('邮箱格式不正确');
      return;
    }

    if (!emailData.code) {
      setError('请输入验证码');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/user/bind-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });

      const data = await response.json();

      if (data.success) {
        fetchUserProfile();
        setBindingEmail(false);
        setEmailData({ email: '', code: '' });
        setError('');
      } else {
        setError(data.error || '绑定失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  // 退出登录
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || '未登录'}</p>
          <Link href="/login" className="text-blue-600 hover:text-blue-700">
            返回登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">
                  {user.role === 'student' ? '学员' : '教练'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 标签页 */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-4 font-semibold transition-colors ${
                activeTab === 'profile'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              个人资料
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 py-4 font-semibold transition-colors ${
                activeTab === 'security'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              账号安全
            </button>
          </div>

          {/* 个人资料 */}
          {activeTab === 'profile' && (
            <div className="p-6">
              {!editingProfile ? (
                <>
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} alt="头像" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-blue-600 font-bold text-3xl">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setEditingProfile(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        编辑资料
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-gray-600">用户名</span>
                        <span className="font-semibold">{user.name}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-gray-600">角色</span>
                        <span className="font-semibold">
                          {user.role === 'student' ? '学员' : '教练'}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-gray-600">学习目标</span>
                        <span className="font-semibold">
                          {user.learningGoal ? {
                            fat_loss: '减脂',
                            entertainment: '娱乐',
                            skill_improvement: '技术提升',
                            competition: '比赛'
                          }[user.learningGoal] : '未设置'}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-gray-600">注册时间</span>
                        <span className="font-semibold">
                          {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">编辑个人资料</h2>
                  
                  {/* 头像 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      头像URL
                    </label>
                    <input
                      type="text"
                      placeholder="请输入头像图片URL"
                      value={editData.avatar}
                      onChange={(e) => setEditData({ ...editData, avatar: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">每月仅限修改一次</p>
                  </div>

                  {/* 用户名 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      用户名
                    </label>
                    <input
                      type="text"
                      placeholder="请输入用户名"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {user && editData.name !== user.name && '修改用户名需要验证码，每月仅限修改一次'}
                    </p>
                  </div>

                  {/* 学习目标 */}
                  {user && user.role === 'student' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        学习目标
                      </label>
                      <select
                        value={editData.learningGoal}
                        onChange={(e) => setEditData({ ...editData, learningGoal: e.target.value as any })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="">请选择学习目标</option>
                        <option value="fat_loss">减脂</option>
                        <option value="entertainment">娱乐</option>
                        <option value="skill_improvement">技术提升</option>
                        <option value="competition">比赛</option>
                      </select>
                    </div>
                  )}

                  {/* 验证码 */}
                  {user && editData.name !== user.name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        验证码
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="请输入验证码"
                          value={editData.code}
                          onChange={(e) => setEditData({ ...editData, code: e.target.value })}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const target = user.email || user.phone;
                            if (target) {
                              const type = user.email ? 'bind_email' : 'bind_phone';
                              setSendingCode(true);
                              handleSendCode(target, type);
                            }
                          }}
                          disabled={sendingCode || countdown > 0}
                          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingProfile(false);
                        setEditData({
                          name: user.name,
                          avatar: user.avatar || '',
                          learningGoal: user.learningGoal || '',
                          code: '',
                        });
                      }}
                      className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 账号安全 */}
          {activeTab === 'security' && (
            <div className="p-6">
              <div className="space-y-6">
                {/* 手机号 */}
                <div className="border-b pb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-semibold">手机号</h3>
                      <p className="text-sm text-gray-600">{user.phone || '未绑定'}</p>
                    </div>
                    <button
                      onClick={() => setBindingPhone(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {user.phone ? '换绑' : '绑定'}
                    </button>
                  </div>

                  {bindingPhone && (
                    <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {user.phone ? '新手机号' : '手机号'}
                        </label>
                        <input
                          type="tel"
                          placeholder="请输入手机号"
                          value={phoneData.phone}
                          onChange={(e) => setPhoneData({ ...phoneData, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          验证码
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="请输入验证码"
                            value={phoneData.code}
                            onChange={(e) => setPhoneData({ ...phoneData, code: e.target.value })}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (phoneData.phone) {
                                setSendingCode(true);
                                handleSendCode(phoneData.phone, 'bind_phone');
                              }
                            }}
                            disabled={sendingCode || countdown > 0 || !phoneData.phone}
                            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleBindPhone}
                          disabled={saving}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {saving ? '保存中...' : '保存'}
                        </button>
                        <button
                          onClick={() => {
                            setBindingPhone(false);
                            setPhoneData({ phone: '', code: '' });
                          }}
                          className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          取消
                        </button>
                      </div>

                      <p className="text-xs text-gray-500">
                        {user.phone ? '换绑需要验证码，每月仅限换绑一次' : '绑定需要验证码'}
                      </p>
                    </div>
                  )}
                </div>

                {/* 邮箱 */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-semibold">邮箱</h3>
                      <p className="text-sm text-gray-600">{user.email || '未绑定'}</p>
                    </div>
                    <button
                      onClick={() => setBindingEmail(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {user.email ? '换绑' : '绑定'}
                    </button>
                  </div>

                  {bindingEmail && (
                    <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {user.email ? '新邮箱' : '邮箱'}
                        </label>
                        <input
                          type="email"
                          placeholder="请输入邮箱"
                          value={emailData.email}
                          onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          验证码
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="请输入验证码"
                            value={emailData.code}
                            onChange={(e) => setEmailData({ ...emailData, code: e.target.value })}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (emailData.email) {
                                setSendingCode(true);
                                handleSendCode(emailData.email, 'bind_email');
                              }
                            }}
                            disabled={sendingCode || countdown > 0 || !emailData.email}
                            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleBindEmail}
                          disabled={saving}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {saving ? '保存中...' : '保存'}
                        </button>
                        <button
                          onClick={() => {
                            setBindingEmail(false);
                            setEmailData({ email: '', code: '' });
                          }}
                          className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          取消
                        </button>
                      </div>

                      <p className="text-xs text-gray-500">
                        {user.email ? '换绑需要验证码，每月仅限换绑一次' : '绑定需要验证码'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
