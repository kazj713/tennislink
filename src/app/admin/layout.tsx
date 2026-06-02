"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Database,
  Settings,
  LogOut,
  Menu,
  X,
  DollarSign,
  Shield,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/admin", label: "数据看板", icon: LayoutDashboard },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/coaches", label: "教练管理", icon: UserCheck },
  { href: "/admin/venues", label: "场地管理", icon: Building2 },
  { href: "/admin/profit-sharing", label: "分账管理", icon: DollarSign },
  { href: "/admin/seed", label: "数据初始化", icon: Database },
  { href: "/admin/settings", label: "系统设置", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.role === 'admin') {
          setUser(data.data);
        } else {
          // 不是管理员，重定向到登录页面
          router.push('/login');
        }
      } else {
        // 未登录，重定向到登录页面
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgba(20,40,35,0.95)' }}>
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-400" />
          <p className="mt-4 text-white/70">验证身份中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'rgba(20,40,35,0.95)' }}>
      {/* 移动端头部 */}
      <div className="lg:hidden bg-blue-600 text-white p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">后台管理系统</h1>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-blue-700 rounded"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* 侧边栏 */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            w-64 border-r border-white/10
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            lg:block
          `}
          style={{ background: 'rgba(15,30,25,0.98)' }}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="hidden lg:flex items-center justify-center h-16 border-b border-white/10">
              <h1 className="text-xl font-bold text-blue-400">
                后台管理系统
              </h1>
            </div>

            {/* 导航菜单 */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive
                        ? "bg-blue-500/20 text-blue-400 font-medium"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* 退出登录 */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  window.location.href = "/login";
                }}
                className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span>退出登录</span>
              </button>
            </div>
          </div>
        </aside>

        {/* 遮罩层 */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* 主内容区 */}
        <main className="flex-1 min-w-0 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
