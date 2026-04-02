'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

interface Coach {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  yearsOfExperience: number;
  hourlyRate: number;
  bio: string;
  avatar?: string | null;
  specialties: string[];
  certifications: string[];
  locations: string[];
  user?: {
    name: string;
    avatar: string | null;
  };
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
  userAvatar?: string | null;
}

export default function CoachDetailPage({ params }: { params: { id: string } }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [coach, setCoach] = useState<Coach | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(true);
  const { showToast } = useToast();

  // 获取教练详情
  useEffect(() => {
    async function fetchCoach() {
      try {
        const response = await fetch(`/api/coaches/${params.id}`);
        if (!response.ok) throw new Error('获取教练信息失败');
        const data = await response.json();
        if (data.success && data.data) {
          setCoach({
            ...data.data,
            name: data.data.name || data.data.user?.name || '未知教练',
            avatar: data.data.avatar || data.data.user?.avatar,
            specialties: data.data.specialties || ['网球教学'],
            certifications: data.data.certifications || [],
            locations: data.data.locations || ['北京'],
          });
        }
      } catch (err) {
        console.error('获取教练信息失败:', err);
        showToast('获取教练信息失败', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchCoach();
  }, [params.id, showToast]);

  // 获取教练评价
  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(`/api/coaches/${params.id}/reviews`);
        if (!response.ok) throw new Error('获取评价失败');
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setReviews(data.data.map((review: any) => ({
            id: review.id,
            userName: review.userName || review.user?.name || '匿名用户',
            rating: review.rating || 5,
            content: review.content || '',
            createdAt: review.createdAt,
            userAvatar: review.userAvatar || review.user?.avatar,
          })));
        }
      } catch (err) {
        console.error('获取评价失败:', err);
        // 评价获取失败不显示错误，因为可能没有评价
      } finally {
        setReviewLoading(false);
      }
    }
    fetchReviews();
  }, [params.id]);

  // 生成未来7天的可用时间
  const generateAvailableTimes = () => {
    const times = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 生成时间段
      const slots = [];
      for (let hour = 9; hour <= 18; hour++) {
        if (Math.random() > 0.3) { // 模拟部分时间段已被预约
          slots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
      }
      
      if (slots.length > 0) {
        times.push({ date: dateStr, slots });
      }
    }
    return times;
  };

  const availableTimes = generateAvailableTimes();

  // 获取渐变色
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
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载教练信息...</p>
        </div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">教练不存在或已被删除</p>
          <Link href="/coaches" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            返回教练列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* 教练头部信息 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* 头像 */}
            {coach.avatar ? (
              <img
                src={coach.avatar}
                alt={coach.name}
                className="w-48 h-48 rounded-2xl object-cover flex-shrink-0"
              />
            ) : (
              <div className={`w-48 h-48 bg-gradient-to-br ${getGradient(coach.id)} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                <span className="text-7xl font-bold text-white/20">{coach.name[0]}</span>
              </div>
            )}

            {/* 基本信息 */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{coach.name}</h1>

              <div className="flex flex-wrap items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xl font-semibold text-gray-900">{coach.rating?.toFixed(1) || '4.5'}</span>
                  <span className="text-gray-500">({coach.reviewCount || 0} 条评价)</span>
                </div>

                <div className="text-gray-600">
                  {coach.yearsOfExperience || 0} 年教学经验
                </div>

                <div className="text-2xl font-bold text-blue-600">
                  ¥{coach.hourlyRate || 200}
                  <span className="text-sm font-normal text-gray-500">/课时</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {coach.specialties.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-gray-700 leading-relaxed">{coach.bio || '暂无简介'}</p>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col gap-3">
              <Link
                href={`/booking?coach=${coach.id}`}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                立即预约
              </Link>
              <button className="px-8 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
                联系教练
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 详细信息 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左侧主要内容 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 教学特长 */}
            {coach.specialties.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">教学特长</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {coach.specialties.map((specialty) => (
                    <div
                      key={specialty}
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                    >
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 font-medium">{specialty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 资质证书 */}
            {coach.certifications.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">资质证书</h2>
                <div className="flex flex-wrap gap-3">
                  {coach.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 上课地点 */}
            {coach.locations.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">上课地点</h2>
                <div className="flex flex-wrap gap-3">
                  {coach.locations.map((location) => (
                    <span
                      key={location}
                      className="px-4 py-2 bg-gray-50 text-gray-700 font-medium rounded-lg"
                    >
                      {location}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 学员评价 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">学员评价</h2>
                <span className="text-gray-500">({reviews.length} 条评价)</span>
              </div>

              {reviewLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">加载评价...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">暂无评价</p>
                  <p className="text-gray-400 text-sm mt-1">预约课程后可进行评价</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="pb-6 border-b border-gray-100 last:border-0">
                      <div className="flex items-start gap-4">
                        {review.userAvatar ? (
                          <img
                            src={review.userAvatar}
                            alt={review.userName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-12 h-12 bg-gradient-to-br ${getGradient(review.id)} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white font-bold">{review.userName[0]}</span>
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{review.userName}</h3>
                              <p className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString('zh-CN')}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-5 h-5 ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700">{review.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧预约侧边栏 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">快速预约</h3>

              {/* 选择日期 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择日期
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">请选择日期</option>
                  {availableTimes.map((time) => (
                    <option key={time.date} value={time.date}>
                      {time.date}
                    </option>
                  ))}
                </select>
              </div>

              {/* 选择时间 */}
              {selectedDate && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择时间
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTimes
                      .find((t) => t.date === selectedDate)
                      ?.slots.map((slot) => (
                        <button
                          key={slot}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors"
                        >
                          {slot}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* 课程类型 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  课程类型
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                    <input type="radio" name="courseType" className="w-4 h-4 text-blue-600" />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">体验课</span>
                      <span className="text-sm text-gray-500 ml-2">¥{Math.round((coach.hourlyRate || 200) * 0.5)}</span>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                    <input type="radio" name="courseType" className="w-4 h-4 text-blue-600" />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">单次课</span>
                      <span className="text-sm text-gray-500 ml-2">¥{coach.hourlyRate || 200}</span>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                    <input type="radio" name="courseType" className="w-4 h-4 text-blue-600" />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">10次套餐</span>
                      <span className="text-sm text-gray-500 ml-2">¥{(coach.hourlyRate || 200) * 9}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 提交按钮 */}
              <Link
                href={`/booking?coach=${coach.id}`}
                className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                立即预约
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
