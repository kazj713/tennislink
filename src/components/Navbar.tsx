'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  // 如果是后台管理页面，不渲染导航栏
  if (isAdminPage) {
    return null;
  }

  const navItems = [
    { name: '首页', path: '/' },
    { name: '找教练', path: '/coaches' },
    { name: '课程预约', path: '/booking' },
    { name: '场地预约', path: '/venues' },
    { name: '社区', path: '/community' },
    { name: '约球', path: '/matchup' },
    { name: '我的课程', path: '/my-courses' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#C41E3A] border-b border-[#A81A32] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#C41E3A] rounded-lg flex items-center justify-center border border-white/20">
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
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  pathname === item.path
                    ? 'bg-[#A81A32] text-white'
                    : 'text-white hover:bg-[#A81A32]'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* 用户菜单 */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white hover:text-white hover:bg-[#A81A32] rounded-md transition-colors"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-[#006DB7] rounded-md hover:bg-[#005A9E] transition-colors"
            >
              注册
            </Link>
          </div>
        </div>
      </div>

      {/* 移动端菜单 */}
      <div className="md:hidden border-t border-[#A81A32]">
        <div className="px-2 pt-2 pb-3 space-y-1 overflow-x-auto">
          <div className="flex space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  pathname === item.path
                    ? 'bg-[#A81A32] text-white'
                    : 'text-white hover:bg-[#A81A32]'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
