"use client";

import Link from "next/link";
import {
  DollarSign,
  Users,
  FileText,
  CreditCard,
  Settings,
} from "lucide-react";

const profitSharingSections = [
  {
    title: "分账规则管理",
    description: "设置和管理不同类型的分账规则",
    href: "/admin/profit-sharing/rules",
    icon: Settings,
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    title: "分账接收方管理",
    description: "管理分账接收方信息和账户设置",
    href: "/admin/profit-sharing/recipients",
    icon: Users,
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    title: "分账记录管理",
    description: "查看和管理所有分账记录",
    href: "/admin/profit-sharing/records",
    icon: FileText,
    color: "bg-purple-500",
    bgColor: "bg-purple-50",
  },
  {
    title: "结算管理",
    description: "处理批量结算和手动转账",
    href: "/admin/profit-sharing/settlements",
    icon: CreditCard,
    color: "bg-orange-500",
    bgColor: "bg-orange-50",
  },
];

export default function ProfitSharingManagement() {
  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">分账管理</h1>
        <p className="text-white/70 mt-2">管理平台分账规则、接收方和结算流程</p>
      </div>

      {/* 分账管理模块 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profitSharingSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.title}
              href={section.href}
              className="rounded-xl p-6 transition-shadow"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <Icon size={24} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                  <p className="text-white/60 mt-1">{section.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 操作指南 */}
      <div className="mt-8 rounded-xl p-6" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#93c5fd' }}>操作指南</h2>
        <div className="space-y-3" style={{ color: '#93c5fd' }}>
          <p>1. <strong>分账规则管理</strong>：设置不同类型交易的分账比例和规则</p>
          <p>2. <strong>分账接收方管理</strong>：添加和管理分账接收方的账户信息</p>
          <p>3. <strong>分账记录管理</strong>：查看所有分账记录，监控分账状态</p>
          <p>4. <strong>结算管理</strong>：处理批量结算，记录手动转账信息</p>
        </div>
      </div>
    </div>
  );
}
