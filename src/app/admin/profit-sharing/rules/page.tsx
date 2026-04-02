"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ProfitSharingRule {
  id: string;
  name: string;
  type: string;
  percentage: number;
  fixedAmount?: number;
  minAmount?: number;
  maxAmount?: number;
  conditions?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const initialRules: ProfitSharingRule[] = [
  {
    id: "1",
    name: "课程预约分账规则",
    type: "course",
    percentage: 80,
    minAmount: 0,
    maxAmount: 0,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "场地预约分账规则",
    type: "venue",
    percentage: 70,
    minAmount: 0,
    maxAmount: 0,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "赛事参与分账规则",
    type: "tournament",
    percentage: 60,
    minAmount: 0,
    maxAmount: 0,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

export default function ProfitSharingRules() {
  const [rules, setRules] = useState<ProfitSharingRule[]>(initialRules);
  const [editingRule, setEditingRule] = useState<ProfitSharingRule | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newRule, setNewRule] = useState<Omit<ProfitSharingRule, "id" | "createdAt" | "updatedAt">>({
    name: "",
    type: "course",
    percentage: 0,
    isActive: true,
  });

  const handleAddRule = () => {
    const rule: ProfitSharingRule = {
      ...newRule,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRules([...rules, rule]);
    setNewRule({
      name: "",
      type: "course",
      percentage: 0,
      isActive: true,
    });
    setIsAdding(false);
  };

  const handleEditRule = (rule: ProfitSharingRule) => {
    setEditingRule(rule);
  };

  const handleSaveRule = () => {
    if (editingRule) {
      setRules(
        rules.map((rule) =>
          rule.id === editingRule.id
            ? {
                ...editingRule,
                updatedAt: new Date().toISOString(),
              }
            : rule
        )
      );
      setEditingRule(null);
    }
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">分账规则管理</h1>
        <p className="text-gray-600 mt-2">设置和管理不同类型的分账规则</p>
      </div>

      {/* 添加规则按钮 */}
      <div className="mb-6">
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          添加分账规则
        </button>
      </div>

      {/* 添加规则表单 */}
      {isAdding && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">添加分账规则</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">规则名称</label>
              <input
                type="text"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入规则名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分账类型</label>
              <select
                value={newRule.type}
                onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="course">课程预约</option>
                <option value="venue">场地预约</option>
                <option value="tournament">赛事参与</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分账比例 (%)</label>
              <input
                type="number"
                value={newRule.percentage}
                onChange={(e) => setNewRule({ ...newRule, percentage: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newRule.isActive}
                  onChange={(e) => setNewRule({ ...newRule, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{newRule.isActive ? "激活" : "禁用"}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAddRule}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={16} />
              保存
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="flex items-center gap-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X size={16} />
              取消
            </button>
          </div>
        </div>
      )}

      {/* 规则列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  规则名称
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分账类型
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分账比例
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingRule?.id === rule.id ? (
                      <input
                        type="text"
                        value={editingRule.name}
                        onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                        className="w-full px-3 py-1 border border-gray-300 rounded-md"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingRule?.id === rule.id ? (
                      <select
                        value={editingRule.type}
                        onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value })}
                        className="w-full px-3 py-1 border border-gray-300 rounded-md"
                      >
                        <option value="course">课程预约</option>
                        <option value="venue">场地预约</option>
                        <option value="tournament">赛事参与</option>
                        <option value="other">其他</option>
                      </select>
                    ) : (
                      <div className="text-sm text-gray-900">
                        {rule.type === "course" && "课程预约"}
                        {rule.type === "venue" && "场地预约"}
                        {rule.type === "tournament" && "赛事参与"}
                        {rule.type === "other" && "其他"}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingRule?.id === rule.id ? (
                      <input
                        type="number"
                        value={editingRule.percentage}
                        onChange={(e) =>
                          setEditingRule({ ...editingRule, percentage: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-1 border border-gray-300 rounded-md"
                        min="0"
                        max="100"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{rule.percentage}%</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingRule?.id === rule.id ? (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingRule.isActive}
                          onChange={(e) =>
                            setEditingRule({ ...editingRule, isActive: e.target.checked })
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {editingRule.isActive ? "激活" : "禁用"}
                        </span>
                      </div>
                    ) : (
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          rule.isActive
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {rule.isActive ? "激活" : "禁用"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(rule.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingRule?.id === rule.id ? (
                      <>
                        <button
                          onClick={handleSaveRule}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={() => setEditingRule(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
