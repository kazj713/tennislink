"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Search,
} from "lucide-react";

interface ProfitSharingRecord {
  id: string;
  recipientId: string;
  recipientName: string;
  amount: number;
  type: string;
  status: string;
  transactionId: string;
  createdAt: string;
}

interface SettlementRecord {
  id: string;
  recipientId: string;
  recipientName: string;
  amount: number;
  status: string;
  paymentMethod: string;
  transactionId?: string;
  settlementDate?: string;
  createdAt: string;
}

const initialPendingRecords: ProfitSharingRecord[] = [
  {
    id: "1",
    recipientId: "101",
    recipientName: "张三教练",
    amount: 160.00,
    type: "course",
    status: "pending",
    transactionId: "TXN001",
    createdAt: "2024-01-01T10:00:00Z",
  },
  {
    id: "2",
    recipientId: "101",
    recipientName: "张三教练",
    amount: 160.00,
    type: "course",
    status: "pending",
    transactionId: "TXN002",
    createdAt: "2024-01-02T11:00:00Z",
  },
  {
    id: "3",
    recipientId: "102",
    recipientName: "李四教练",
    amount: 140.00,
    type: "course",
    status: "pending",
    transactionId: "TXN003",
    createdAt: "2024-01-01T12:00:00Z",
  },
];

const initialSettlements: SettlementRecord[] = [
  {
    id: "101",
    recipientId: "101",
    recipientName: "张三教练",
    amount: 320.00,
    status: "completed",
    paymentMethod: "银行转账",
    transactionId: "SETTLE001",
    settlementDate: "2024-01-10T10:00:00Z",
    createdAt: "2024-01-10T09:00:00Z",
  },
  {
    id: "102",
    recipientId: "102",
    recipientName: "李四教练",
    amount: 140.00,
    status: "pending",
    paymentMethod: "微信转账",
    createdAt: "2024-01-10T11:00:00Z",
  },
];

export default function SettlementManagement() {
  const [pendingRecords, setPendingRecords] = useState<ProfitSharingRecord[]>(initialPendingRecords);
  const [settlements, setSettlements] = useState<SettlementRecord[]>(initialSettlements);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [isCreatingSettlement, setIsCreatingSettlement] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("银行转账");
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);
  const [transferSettlementId, setTransferSettlementId] = useState<string>("");
  const [transferTransactionId, setTransferTransactionId] = useState<string>("");

  const handleSelectRecord = (id: string) => {
    setSelectedRecords((prev) =>
      prev.includes(id) ? prev.filter((recordId) => recordId !== id) : [...prev, id]
    );
  };

  const handleSelectAllRecords = () => {
    if (selectedRecords.length === pendingRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(pendingRecords.map((record) => record.id));
    }
  };

  const handleCreateSettlement = () => {
    if (selectedRecords.length === 0) return;

    const selected = pendingRecords.filter((record) => selectedRecords.includes(record.id));
    const recipientId = selected[0].recipientId;
    const recipientName = selected[0].recipientName;
    const totalAmount = selected.reduce((sum, record) => sum + record.amount, 0);

    const newSettlement: SettlementRecord = {
      id: Math.random().toString(36).substr(2, 9),
      recipientId,
      recipientName,
      amount: totalAmount,
      status: "pending",
      paymentMethod,
      createdAt: new Date().toISOString(),
    };

    setSettlements([...settlements, newSettlement]);
    setPendingRecords(pendingRecords.filter((record) => !selectedRecords.includes(record.id)));
    setSelectedRecords([]);
    setIsCreatingSettlement(false);
  };

  const handleProcessTransfer = () => {
    setSettlements(
      settlements.map((settlement) =>
        settlement.id === transferSettlementId
          ? {
              ...settlement,
              status: "completed",
              transactionId: transferTransactionId,
              settlementDate: new Date().toISOString(),
            }
          : settlement
      )
    );
    setIsProcessingTransfer(false);
    setTransferSettlementId("");
    setTransferTransactionId("");
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">结算管理</h1>
        <p className="text-gray-600 mt-2">处理批量结算和手动转账</p>
      </div>

      {/* 待结算记录 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">待结算记录</h2>
          {selectedRecords.length > 0 && (
            <button
              onClick={() => setIsCreatingSettlement(true)}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              批量结算 ({selectedRecords.length}条)
            </button>
          )}
        </div>

        {/* 筛选和搜索 */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">全部接收方</option>
              <option value="101">张三教练</option>
              <option value="102">李四教练</option>
            </select>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="搜索交易ID"
              className="pl-10 pr-4 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 待结算记录列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedRecords.length === pendingRecords.length && pendingRecords.length > 0}
                      onChange={handleSelectAllRecords}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    接收方
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金额
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    交易ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRecords.includes(record.id)}
                        onChange={() => handleSelectRecord(record.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.recipientName}</div>
                      <div className="text-xs text-gray-500">ID: {record.recipientId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">¥{record.amount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.type === "course" && "课程预约"}
                        {record.type === "venue" && "场地预约"}
                        {record.type === "tournament" && "赛事参与"}
                        {record.type === "other" && "其他"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.transactionId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 结算记录 */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">结算记录</h2>

        {/* 结算记录列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    结算ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    接收方
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金额
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    支付方式
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    交易ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    结算日期
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settlements.map((settlement) => (
                  <tr key={settlement.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{settlement.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{settlement.recipientName}</div>
                      <div className="text-xs text-gray-500">ID: {settlement.recipientId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">¥{settlement.amount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          settlement.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : settlement.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {settlement.status === "completed" && "已完成"}
                        {settlement.status === "pending" && "待处理"}
                        {settlement.status === "failed" && "失败"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{settlement.paymentMethod}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{settlement.transactionId || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {settlement.settlementDate
                        ? new Date(settlement.settlementDate).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {settlement.status === "pending" && (
                        <button
                          onClick={() => {
                            setIsProcessingTransfer(true);
                            setTransferSettlementId(settlement.id);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          处理转账
                        </button>
                      )}
                      {settlement.status === "completed" && (
                        <span className="text-blue-600">
                          <CheckCircle2 size={16} />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 创建结算弹窗 */}
      {isCreatingSettlement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">创建结算</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">接收方</label>
                <select
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择接收方</option>
                  <option value="101">张三教练</option>
                  <option value="102">李四教练</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="银行转账">银行转账</option>
                  <option value="微信转账">微信转账</option>
                  <option value="支付宝转账">支付宝转账</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结算金额</label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  ¥{selectedRecords
                    .map((id) => pendingRecords.find((record) => record.id === id)?.amount || 0)
                    .reduce((sum, amount) => sum + amount, 0)
                    .toFixed(2)}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsCreatingSettlement(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateSettlement}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  创建结算
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 处理转账弹窗 */}
      {isProcessingTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">处理转账</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结算ID</label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  {transferSettlementId}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">交易ID</label>
                <input
                  type="text"
                  value={transferTransactionId}
                  onChange={(e) => setTransferTransactionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入转账交易ID"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsProcessingTransfer(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleProcessTransfer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  确认转账
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
