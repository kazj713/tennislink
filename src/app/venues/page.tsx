'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

interface Venue {
  id: string;
  name: string;
  address: string;
  phone?: string;
  courts: number;
  facilities: string[];
  images: string[];
  hours: string;
  pricePerHour: number;
  peakPricePerHour?: number;
  rating: number;
  reviewCount: number;
  type: string;
  city: string;
  district: string;
}

export default function VenuesPage() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterType, setFilterType] = useState('');
  const { showToast } = useToast();

  // 获取场地列表
  useEffect(() => {
    async function fetchVenues() {
      try {
        const response = await fetch('/api/venues');
        if (!response.ok) throw new Error('获取场地列表失败');
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // 转换数据格式
          const formattedVenues = data.data.map((venue: any) => ({
            id: venue.id,
            name: venue.name,
            address: venue.address || '地址暂未提供',
            phone: venue.phone,
            courts: venue.courts || 4,
            facilities: venue.facilities || ['标准球场'],
            images: venue.images || [],
            hours: venue.hours || '08:00 - 22:00',
            pricePerHour: venue.pricePerHour || 100,
            peakPricePerHour: venue.peakPricePerHour,
            rating: venue.rating || 4.5,
            reviewCount: venue.reviewCount || 0,
            type: venue.type || 'outdoor',
            city: venue.city || '北京',
            district: venue.district || '朝阳区',
          }));
          setVenues(formattedVenues);
        }
      } catch (err) {
        console.error('获取场地列表失败:', err);
        showToast('获取场地列表失败', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchVenues();
  }, [showToast]);

  // 获取唯一的区域列表
  const districts = [...new Set(venues.map(v => v.district))];

  // 过滤场地
  const filteredVenues = venues.filter((venue) => {
    if (filterDistrict && venue.district !== filterDistrict) return false;
    if (filterType && venue.type !== filterType) return false;
    return true;
  });

  // 生成时间段
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 21; hour++) {
      const isPeak = hour >= 10 && hour <= 20;
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        available: Math.random() > 0.3, // 模拟可用性
        priceType: isPeak ? 'peak' : 'base',
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // 获取渐变色（基于场地ID）
  const getGradient = (id: string) => {
    const gradients = [
      'from-blue-400 to-blue-600',
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-red-400 to-red-600',
      'from-yellow-400 to-yellow-600',
      'from-indigo-400 to-indigo-600',
    ];
    const index = id.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载场地列表...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">预约场地</h1>
          <p className="text-xl text-blue-100">
            选择合适的场地，享受愉快的网球时光
          </p>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">全部区域</option>
              {districts.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">全部类型</option>
              <option value="indoor">室内球场</option>
              <option value="outdoor">室外球场</option>
              <option value="mixed">混合</option>
            </select>
            <button
              onClick={() => {
                setFilterDistrict('');
                setFilterType('');
              }}
              className="px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
            >
              重置筛选
            </button>
          </div>
        </div>
      </div>

      {/* 场地列表 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredVenues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">没有找到符合条件的场地</p>
            <button
              onClick={() => {
                setFilterDistrict('');
                setFilterType('');
              }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              清除筛选条件
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* 场地列表 */}
            <div className="space-y-6">
              {filteredVenues.map((venue) => (
                <div
                  key={venue.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedVenue(venue.id)}
                >
                  {/* 图片 */}
                  <div className={`aspect-video bg-gradient-to-br ${getGradient(venue.id)} flex items-center justify-center`}>
                    <span className="text-white/30 text-6xl font-bold">{venue.name[0]}</span>
                  </div>

                  {/* 信息 */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{venue.name}</h3>
                        <p className="text-gray-600">{venue.address}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-semibold text-gray-900">{venue.rating.toFixed(1)}</span>
                        <span className="text-gray-500">({venue.reviewCount})</span>
                      </div>
                    </div>

                    {/* 设施标签 */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {venue.facilities.slice(0, 4).map((facility) => (
                        <span
                          key={facility}
                          className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                        >
                          {facility}
                        </span>
                      ))}
                      {venue.facilities.length > 4 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          +{venue.facilities.length - 4}
                        </span>
                      )}
                    </div>

                    {/* 底部信息 */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{venue.courts} 个球场</span>
                        <span>{venue.hours}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          ¥{venue.pricePerHour}
                          <span className="text-sm font-normal text-gray-500">/小时起</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 时间选择面板 */}
            {selectedVenue && (
              <div className="lg:sticky lg:top-24 h-fit">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {venues.find((v) => v.id === selectedVenue)?.name}
                  </h3>

                  {/* 日期选择 */}
                  {!selectedDate && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        选择日期
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  )}

                  {selectedDate && (
                    <>
                      {/* 时间段 */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-gray-700">
                            可选时段
                          </label>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-blue-500 rounded"></div>
                              普通
                            </span>
                            <span className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                              高峰
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlots.map((slot) => {
                            const venue = venues.find((v) => v.id === selectedVenue);
                            const price = slot.priceType === 'peak'
                              ? (venue?.peakPricePerHour || venue?.pricePerHour || 100)
                              : (venue?.pricePerHour || 100);
                            return (
                              <button
                                key={slot.time}
                                disabled={!slot.available}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  !slot.available
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : slot.priceType === 'peak'
                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                              >
                                <div>{slot.time}</div>
                                {slot.available && <div className="text-xs mt-1">¥{price}</div>}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 设施详情 */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          场地设施
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {venues
                            .find((v) => v.id === selectedVenue)
                            ?.facilities.map((facility) => (
                              <div
                                key={facility}
                                className="flex items-center gap-2 text-sm text-gray-600"
                              >
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {facility}
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* 联系信息 */}
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">电话:</span>{' '}
                          {venues.find((v) => v.id === selectedVenue)?.phone || '暂无'}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">营业时间:</span>{' '}
                          {venues.find((v) => v.id === selectedVenue)?.hours}
                        </div>
                      </div>

                      {/* 预约按钮 */}
                      <Link
                        href="/booking"
                        className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center"
                      >
                        去预约
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
