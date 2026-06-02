"use client";

import { useEffect, useState } from "react";
import { UserCheck, Clock, X, Check, Search, Filter, Plus, Loader2 } from "lucide-react";
import Image from "next/image";

interface Coach {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    city: string;
    skillLevel: number;
  };
  status: string;
  experienceYears: number;
  certifications: string[];
  specialties: string[];
  hourlyRate: number;
  averageRating: string;
  reviewCount: number;
  totalLessons: number;
  createdAt: string;
}

export default function AdminCoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingCoach, setAddingCoach] = useState(false);
  const [newCoach, setNewCoach] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    skillLevel: 5,
    experienceYears: 1,
    hourlyRate: 200,
    certifications: ["国家一级教练"],
    specialties: ["正手", "反手"]
  });

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      const response = await fetch("/api/admin/coaches");
      if (response.ok) {
        const data = await response.json();
        setCoaches(data);
      }
    } catch (error) {
      console.error("Failed to fetch coaches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (coachId: string) => {
    if (!confirm("确定通过该教练的审核吗？")) return;

    try {
      const response = await fetch(`/api/admin/coaches/${coachId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });

      if (response.ok) {
        fetchCoaches();
      }
    } catch (error) {
      console.error("Failed to approve coach:", error);
      alert("操作失败，请重试");
    }
  };

  const handleReject = async (coachId: string) => {
    if (!confirm("确定拒绝该教练的申请吗？")) return;

    try {
      const response = await fetch(`/api/admin/coaches/${coachId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (response.ok) {
        fetchCoaches();
      }
    } catch (error) {
      console.error("Failed to reject coach:", error);
      alert("操作失败，请重试");
    }
  };

  const handleAddCoach = async () => {
    if (!newCoach.name || !newCoach.email || !newCoach.phone || !newCoach.city) {
      alert("请填写完整的教练信息");
      return;
    }

    setAddingCoach(true);

    try {
      const response = await fetch("/api/admin/coaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCoach),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewCoach({
          name: "",
          email: "",
          phone: "",
          city: "",
          skillLevel: 5,
          experienceYears: 1,
          hourlyRate: 200,
          certifications: ["国家一级教练"],
          specialties: ["正手", "反手"]
        });
        fetchCoaches();
        alert("教练添加成功");
      } else {
        const error = await response.json();
        alert(`添加失败: ${error.error || "未知错误"}`);
      }
    } catch (error) {
      console.error("Failed to add coach:", error);
      alert("操作失败，请重试");
    } finally {
      setAddingCoach(false);
    }
  };

  const filteredCoaches = coaches.filter((coach) => {
    const matchesFilter = filter === "all" || coach.status === filter;
    const matchesSearch =
      !searchQuery ||
      coach.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1 text-sm rounded-full" style={{ background: 'rgba(201,162,39,0.2)', color: '#fbbf24', border: '1px solid rgba(201,162,39,0.3)' }}>
            待审核
          </span>
        );
      case "approved":
        return (
          <span className="px-3 py-1 text-sm rounded-full" style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}>
            已通过
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 text-sm rounded-full" style={{ background: 'rgba(220,53,69,0.2)', color: '#f87171', border: '1px solid rgba(220,53,69,0.3)' }}>
            已拒绝
          </span>
        );
      case "suspended":
        return (
          <span className="px-3 py-1 text-sm rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)' }}>
            已暂停
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
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">教练管理</h1>
          <p className="text-white/70 mt-2">审核和管理平台教练</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          <span>添加教练</span>
        </button>
      </div>

      {/* 筛选和搜索 */}
      <div className="rounded-xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* 搜索 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              placeholder="搜索教练姓名或邮箱..."
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
              <option value="all" style={{ color: '#000', background: '#fff' }}>全部状态</option>
              <option value="pending" style={{ color: '#000', background: '#fff' }}>待审核</option>
              <option value="approved" style={{ color: '#000', background: '#fff' }}>已通过</option>
              <option value="rejected" style={{ color: '#000', background: '#fff' }}>已拒绝</option>
            </select>
          </div>
        </div>
      </div>

      {/* 教练列表 */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: 'rgba(30,50,42,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-white/80">教练信息</th>
                <th className="text-left py-4 px-6 font-semibold text-white/80">经验/评级</th>
                <th className="text-left py-4 px-6 font-semibold text-white/80">专长</th>
                <th className="text-left py-4 px-6 font-semibold text-white/80">时薪</th>
                <th className="text-left py-4 px-6 font-semibold text-white/80">状态</th>
                <th className="text-left py-4 px-6 font-semibold text-white/80">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoaches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/55">
                    没有找到匹配的教练
                  </td>
                </tr>
              ) : (
                filteredCoaches.map((coach, index) => (
                  <tr
                    key={coach.id}
                    className="border-b border-white/5 transition-colors"
                    style={{ background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {coach.user.avatar ? (
                          <Image
                            src={coach.user.avatar}
                            alt={coach.user.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.2)' }}>
                            <UserCheck className="text-blue-400" size={24} />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white">{coach.user.name}</p>
                          <p className="text-sm text-white/70">{coach.user.email}</p>
                          <p className="text-sm text-white/50">
                            {coach.user.city} · 技能等级 {coach.user.skillLevel}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-white/90">
                        {coach.experienceYears} 年经验
                      </p>
                      <p className="text-sm text-white/70">
                        ⭐ {coach.averageRating} ({coach.reviewCount}条评价)
                      </p>
                      <p className="text-sm text-white/70">
                        {coach.totalLessons} 节课程
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {coach.specialties.slice(0, 2).map((specialty) => (
                          <span
                            key={specialty}
                            className="px-2 py-1 text-xs rounded"
                            style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd' }}
                          >
                            {specialty}
                          </span>
                        ))}
                        {coach.specialties.length > 2 && (
                          <span className="px-2 py-1 text-xs rounded" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                            +{coach.specialties.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-white">
                        ¥{Number(coach.hourlyRate)}/小时
                      </p>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(coach.status)}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {coach.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(coach.id)}
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: '#93c5fd' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.15)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              title="通过"
                            >
                              <Check size={20} />
                            </button>
                            <button
                              onClick={() => handleReject(coach.id)}
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: '#f87171' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,53,69,0.15)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              title="拒绝"
                            >
                              <X size={20} />
                            </button>
                          </>
                        )}
                        {coach.status === "approved" && (
                          <button
                            onClick={() => handleReject(coach.id)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: '#f87171' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,53,69,0.15)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            title="暂停"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 添加教练模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">添加教练</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input
                    type="text"
                    value={newCoach.name}
                    onChange={(e) => setNewCoach({ ...newCoach, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入教练姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input
                    type="email"
                    value={newCoach.email}
                    onChange={(e) => setNewCoach({ ...newCoach, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入教练邮箱"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                  <input
                    type="tel"
                    value={newCoach.phone}
                    onChange={(e) => setNewCoach({ ...newCoach, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入教练电话"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
                  <input
                    type="text"
                    value={newCoach.city}
                    onChange={(e) => setNewCoach({ ...newCoach, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入教练所在城市"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">技能等级</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newCoach.skillLevel}
                    onChange={(e) => setNewCoach({ ...newCoach, skillLevel: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">教学经验（年）</label>
                  <input
                    type="number"
                    min="0"
                    value={newCoach.experienceYears}
                    onChange={(e) => setNewCoach({ ...newCoach, experienceYears: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">时薪（元）</label>
                  <input
                    type="number"
                    min="0"
                    value={newCoach.hourlyRate}
                    onChange={(e) => setNewCoach({ ...newCoach, hourlyRate: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">证书</label>
                <input
                  type="text"
                  value={newCoach.certifications.join(", ")}
                  onChange={(e) => setNewCoach({ ...newCoach, certifications: e.target.value.split(",").map(item => item.trim()) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入证书，多个证书用逗号分隔"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">专长</label>
                <input
                  type="text"
                  value={newCoach.specialties.join(", ")}
                  onChange={(e) => setNewCoach({ ...newCoach, specialties: e.target.value.split(",").map(item => item.trim()) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入专长，多个专长用逗号分隔"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddCoach}
                disabled={addingCoach}
                className={`px-6 py-2 font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  addingCoach
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {addingCoach ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>添加中...</span>
                  </>
                ) : (
                  <span>添加教练</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
