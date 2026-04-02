"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Search,
  MapPin,
  Phone,
} from "lucide-react";
import VenueForm from "@/components/VenueForm";
import { useToast } from "@/components/ui/Toast";
import { useModal } from "@/components/ui/Modal";

interface Venue {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  district: string;
  phone?: string;
  facilities: string[];
  images: string[];
  isActive: boolean;
  createdAt: string;
}

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const { showToast } = useToast();
  const { showModal: showConfirmModal } = useModal();

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const response = await fetch("/api/admin/venues");
      if (response.ok) {
        const data = await response.json();
        setVenues(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch venues:", error);
      showToast("获取场地列表失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (venueId: string) => {
    showConfirmModal({
      title: "确认删除",
      message: "确定删除该场地吗？此操作不可恢复。",
      type: "danger",
      confirmText: "删除",
      cancelText: "取消",
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/venues/${venueId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            fetchVenues();
            showToast("删除成功", "success");
          } else {
            const error = await response.json();
            showToast(error.error || "删除失败，请重试", "error");
          }
        } catch (error) {
          console.error("Failed to delete venue:", error);
          showToast("删除失败，请重试", "error");
        }
      },
    });
  };

  const handleCreateOrUpdateVenue = async (formData: any) => {
    try {
      const url = editingVenue 
        ? `/api/admin/venues/${editingVenue.id}`
        : '/api/admin/venues';
      
      const method = editingVenue ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchVenues();
        setShowModal(false);
        setEditingVenue(null);
        showToast(editingVenue ? '更新成功' : '创建成功', 'success');
      } else {
        const error = await response.json();
        showToast(error.error || '操作失败，请重试', 'error');
      }
    } catch (error) {
      console.error('Failed to save venue:', error);
      showToast('操作失败，请重试', 'error');
    }
  };

  const filteredVenues = venues.filter((venue) => {
    const matchesSearch =
      !searchQuery ||
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "indoor":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
            室内
          </span>
        );
      case "outdoor":
        return (
          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
            室外
          </span>
        );
      case "mixed":
        return (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
            混合
          </span>
        );
      default:
        return null;
    }
  };

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">场地管理</h1>
          <p className="text-gray-600 mt-2">添加和管理网球场地</p>
        </div>
        <button
          onClick={() => {
            setEditingVenue(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          <span>添加场地</span>
        </button>
      </div>

      {/* 搜索 */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="搜索场地名称或地址..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 场地列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVenues.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
            没有找到匹配的场地
          </div>
        ) : (
          filteredVenues.map((venue) => (
            <div
              key={venue.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                venue.isActive ? "border-gray-100" : "border-gray-300 opacity-60"
              }`}
            >
              {/* 场地图片 */}
              <div className="relative h-48 bg-gray-200">
                {venue.images && venue.images.length > 0 ? (
                  <Image
                    src={venue.images[0]}
                    alt={venue.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="text-gray-400" size={48} />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  {getTypeBadge(venue.type)}
                </div>
              </div>

              {/* 场地信息 */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {venue.name}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 text-gray-400" />
                    <span>{venue.address}</span>
                  </div>
                  {venue.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <span>{venue.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">设施:</span>
                    <div className="flex flex-wrap gap-1">
                      {venue.facilities.slice(0, 3).map((facility) => (
                        <span
                          key={facility}
                          className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {facility}
                        </span>
                      ))}
                      {venue.facilities.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          +{venue.facilities.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingVenue(venue);
                      setShowModal(true);
                    }}
                    className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 size={16} />
                    <span>编辑</span>
                  </button>
                  <button
                    onClick={() => handleDelete(venue.id)}
                    className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 size={16} />
                    <span>删除</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 场地表单模态框 */}
      {showModal && (
        <VenueForm
          venue={editingVenue}
          onSubmit={handleCreateOrUpdateVenue}
          onCancel={() => {
            setShowModal(false);
            setEditingVenue(null);
          }}
        />
      )}
    </div>
  );
}
