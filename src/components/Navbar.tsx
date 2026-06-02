'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  // 如果是后台管理页面，不渲染导航栏
  if (isAdminPage) {
    return null;
  }

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name?: string; email?: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { name: '首页', path: '/' },
    { name: '找教练', path: '/coaches' },
    { name: '课程预约', path: '/booking' },
    { name: '场地预约', path: '/venues' },
    { name: '社区', path: '/community' },
    { name: '约球', path: '/matchup' },
    { name: '我的课程', path: '/my-courses' },
  ];

  // 检查登录状态
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          setIsLoggedIn(true);
          setUserInfo(user);
        } else if (token) {
          setIsLoggedIn(true);
          setUserInfo(null);
        } else {
          setIsLoggedIn(false);
          setUserInfo(null);
        }
      } catch (error) {
        console.error('检查登录状态失败:', error);
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    };

    checkAuthStatus();

    // 监听 storage 变化（多标签页同步）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 定期检查登录状态（处理同一标签页内的变化）
    const intervalId = setInterval(checkAuthStatus, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 退出登录
  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      setUserInfo(null);
      setShowDropdown(false);
      
      // 刷新页面以更新全局状态
      window.location.reload();
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  // 切换下拉菜单
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a5442]/90 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-xl font-bold text-white">Tennis Link</span>
          </Link>

          {/* 导航链接 */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  pathname === item.path
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* 用户菜单 */}
          <div className="flex items-center gap-3">
            {!isLoggedIn ? (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-md transition-all duration-200"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-md hover:bg-white/30 transition-all duration-200 border border-white/20"
                >
                  注册
                </Link>
              </>
            ) : (
              <div className="relative" ref={dropdownRef}>
                {/* 用户头像按钮 */}
                <button
                  onClick={toggleDropdown}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-white/10 backdrop-blur-sm rounded-md hover:bg-white/20 transition-all duration-200 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="hidden sm:inline">个人中心</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showDropdown ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* 下拉菜单 */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-md shadow-lg border border-white/20 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200/50">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {userInfo?.name || userInfo?.email || '用户'}
                      </p>
                      {userInfo?.email && (
                        <p className="text-xs text-gray-500 truncate">{userInfo.email}</p>
                      )}
                    </div>
                    
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/50 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        个人信息
                      </div>
                    </Link>
                    
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/50 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        我的订单
                      </div>
                    </Link>
                    
                    <div className="border-t border-gray-200/50 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          退出登录
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 移动端菜单 */}
      <div className="md:hidden border-t border-white/10">
        <div className="px-2 pt-2 pb-3 space-y-1 overflow-x-auto">
          <div className="flex space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  pathname === item.path
                    ? 'bg-white/20 text-white'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* 移动端用户菜单 */}
          <div className="pt-2 border-t border-white/10 mt-2">
            {!isLoggedIn ? (
              <div className="flex gap-2 px-2">
                <Link
                  href="/login"
                  className="flex-1 px-4 py-2 text-sm font-medium text-center text-white/90 bg-white/10 rounded-md hover:bg-white/20 transition-colors"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="flex-1 px-4 py-2 text-sm font-medium text-center text-white bg-white/20 rounded-md hover:bg-white/30 transition-colors"
                >
                  注册
                </Link>
              </div>
            ) : (
              <div className="px-2 space-y-1">
                <div className="px-3 py-2 bg-white/10 rounded-md">
                  <p className="text-sm font-medium text-white truncate">
                    {userInfo?.name || userInfo?.email || '用户'}
                  </p>
                </div>
                
                <Link
                  href="/profile"
                  className="block w-full px-3 py-2 text-sm text-left text-white/90 bg-white/10 rounded-md hover:bg-white/20 transition-colors"
                >
                  个人信息
                </Link>
                
                <Link
                  href="/orders"
                  className="block w-full px-3 py-2 text-sm text-left text-white/90 bg-white/10 rounded-md hover:bg-white/20 transition-colors"
                >
                  我的订单
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-sm text-left text-red-300 bg-white/10 rounded-md hover:bg-red-900/20 transition-colors"
                >
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}