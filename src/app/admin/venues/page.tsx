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
          <span className="px-3 py-1 text-sm rounded-full" style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}>
            室内
          </span>
        );
      case "outdoor":
        return (
          <span className="px-3 py-1 text-sm rounded-full" style={{ background: 'rgba(249,115,22,0.2)', color: '#fdba74', border: '1px solid rgba(249,115,22,0.3)' }}>
            室外
          </span>
        );
      case "mixed":
        return (
          <span className="px-3 py-1 text-sm rounded-full" style={{ background: 'rgba(168,85,247,0.2)', color: '#d8b4fe', border: '1px solid rgba(168,85,247,0.3)' }}>
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
        <div className="text-white/55">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">场地管理</h1>
          <p className="text-white/70 mt-2">添加和管理网球场地</p>
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
      <div className="rounded-xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
          <input
            type="text"
            placeholder="搜索场地名称或地址..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg outline-none text-white placeholder-white/40"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)' }}
          />
        </div>
      </div>

      {/* 场地列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVenues.length === 0 ? (
          <div className="col-span-full py-12 text-center rounded-xl" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-white/55">没有找到匹配的场地</p>
          </div>
        ) : (
          filteredVenues.map((venue) => (
            <div
              key={venue.id}
              className={`rounded-xl overflow-hidden ${
                venue.isActive ? "" : "opacity-60"
              }`}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {/* 场地图片 */}
              <div className="relative h-48" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {venue.images && venue.images.length > 0 ? (
                  <Image
                    src={venue.images[0]}
                    alt={venue.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="text-white/30" size={48} />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  {getTypeBadge(venue.type)}
                </div>
              </div>

              {/* 场地信息 */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {venue.name}
                </h3>

                <div className="space-y-2 text-sm text-white/70 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 text-white/40" />
                    <span>{venue.address}</span>
                  </div>
                  {venue.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-white/40" />
                      <span>{venue.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-white/40">设施:</span>
                    <div className="flex flex-wrap gap-1">
                      {venue.facilities.slice(0, 3).map((facility) => (
                        <span
                          key={facility}
                          className="px-2 py-0.5 text-xs rounded"
                          style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
                        >
                          {facility}
                        </span>
                      ))}
                      {venue.facilities.length > 3 && (
                        <span className="px-2 py-0.5 text-xs rounded" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
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
                    className="flex-1 px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1 text-white"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  >
                    <Edit2 size={16} />
                    <span>编辑</span>
                  </button>
                  <button
                    onClick={() => handleDelete(venue.id)}
                    className="px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1 text-white"
                    style={{ background: 'rgba(220,53,69,0.2)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,53,69,0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220,53,69,0.2)'}
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
