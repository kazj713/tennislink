"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  Building2,
  Calendar,
  TrendingUp,
  DollarSign,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalCoaches: number;
  totalVenues: number;
  totalBookings: number;
  pendingCoachApprovals: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCoaches: 0,
    totalVenues: 0,
    totalBookings: 0,
    pendingCoachApprovals: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "总用户数",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "认证教练",
      value: stats.totalCoaches,
      icon: UserCheck,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "场地数量",
      value: stats.totalVenues,
      icon: Building2,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      title: "总订单数",
      value: stats.totalBookings,
      icon: Calendar,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      title: "待审核教练",
      value: stats.pendingCoachApprovals,
      icon: UserCheck,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
    },
    {
      title: "总收入",
      value: `¥${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">数据看板</h1>
        <p className="text-gray-600 mt-2">欢迎使用 Tennis Link 后台管理系统</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon size={24} className={card.color.replace("bg-", "text-")} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 快捷操作 */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/admin/coaches"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <UserCheck className="text-blue-600" size={20} />
            <div>
              <p className="font-medium text-gray-900">教练审核</p>
              <p className="text-sm text-gray-600">
                {stats.pendingCoachApprovals} 位教练待审核
              </p>
            </div>
          </a>
          <a
            href="/admin/venues"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <Building2 className="text-purple-600" size={20} />
            <div>
              <p className="font-medium text-gray-900">场地管理</p>
              <p className="text-sm text-gray-600">添加或管理场地信息</p>
            </div>
          </a>
          <a
            href="/admin/seed"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <TrendingUp className="text-blue-600" size={20} />
            <div>
              <p className="font-medium text-gray-900">数据初始化</p>
              <p className="text-sm text-gray-600">初始化示例数据</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
