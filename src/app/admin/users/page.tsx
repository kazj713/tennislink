"use client";

import { useEffect, useState } from "react";
import { Users, Search, Filter, Shield, User } from "lucide-react";
import Image from "next/image";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  city?: string;
  skillLevel?: number;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "student" | "coach" | "admin">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesFilter = filter === "all" || user.role === filter;
    const matchesSearch =
      !searchQuery ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="px-3 py-1 text-sm rounded-full flex items-center gap-1" style={{ background: 'rgba(220,53,69,0.2)', color: '#f87171', border: '1px solid rgba(220,53,69,0.3)' }}>
            <Shield size={14} />
            管理员
          </span>
        );
      case "coach":
        return (
          <span className="px-3 py-1 text-sm rounded-full" style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}>
            教练
          </span>
        );
      case "student":
        return (
          <span className="px-3 py-1 text-sm rounded-full" style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}>
            学员
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/55">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">用户管理</h1>
        <p className="text-white/70 mt-2">查看和管理平台用户</p>
      </div>

      {/* 筛选和搜索 */}
      <div className="rounded-xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* 搜索 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              placeholder="搜索用户姓名或邮箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg outline-none text-white placeholder-white/40"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)' }}
            />
          </div>

          {/* 筛选 */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-white/40" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 rounded-lg outline-none text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <option value="all" style={{ color: '#000', background: '#fff' }}>全部角色</option>
              <option value="student" style={{ color: '#000', background: '#fff' }}>学员</option>
              <option value="coach" style={{ color: '#000', background: '#fff' }}>教练</option>
              <option value="admin" style={{ color: '#000', background: '#fff' }}>管理员</option>
            </select>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: 'rgba(30,50,42,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-white/80">用户信息</th>
                <th className="text-left py-4 px-6 font-semibold text-white/80">角色</th>
                <th className="text-left py-4 px-6 font-semibold text-white/80">联系方式</th>
                <th className="text-left py-4 px-6 font-semibold text-white/80">城市</th>
                <th className="text-left py-4 px-6 font-semibold text-white/80">注册时间</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/55">
                    没有找到匹配的用户
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 transition-colors"
                    style={{ background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <Image
                            src={user.avatar}
                            alt={user.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.2)' }}>
                            <User className="text-blue-400" size={24} />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white">{user.name}</p>
                          <p className="text-sm text-white/70">{user.email}</p>
                          {user.skillLevel && (
                            <p className="text-sm text-white/50">
                              技能等级: {user.skillLevel}/10
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">{getRoleBadge(user.role)}</td>
                    <td className="py-4 px-6">
                      {user.phone ? (
                        <p className="text-white/90">{user.phone}</p>
                      ) : (
                        <p className="text-white/40">未填写</p>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-white/90">{user.city || "未填写"}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-white/60">
                        {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
