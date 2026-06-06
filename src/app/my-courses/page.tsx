'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface Booking {
  id: string;
  courseId?: string;
  coachId: string;
  userId: string;
  scheduledDate: string;
  status: string;
  price?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    title: string;
    type: string;
    level: number;
    duration: number;
    price: number;
    description?: string;
    coachId: string;
    venueId?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  coach?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    specialization?: string;
    rating?: number;
    experience?: number;
    hourlyRate?: number;
    bio?: string;
    avatarUrl?: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

interface Stats {
  totalBookings: number;
  upcomingCount: number;
  completedCount: number;
  reportCount: number;
}

export default function MyCoursesPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'reports'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    upcomingCount: 0,
    completedCount: 0,
    reportCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bookings?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        const allBookings: Booking[] = data.data || [];

        // 分类预约
        const upcoming = allBookings.filter(
          (b) => b.status === 'confirmed' || b.status === 'pending'
        );
        const completed = allBookings.filter((b) => b.status === 'completed');

        setStats({
          totalBookings: allBookings.length,
          upcomingCount: upcoming.length,
          completedCount: completed.length,
          reportCount: completed.length, // 假设每个完成的课程都有报告
        });

        setBookings(allBookings);
      }
    } catch (error) {
      console.error('获取预约列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingCourses = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  );

  const historyCourses = bookings.filter((b) => b.status === 'completed');

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '已确认';
      case 'pending':
        return '待确认';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };

  const getCourseType = (type?: string) => {
    switch (type) {
      case 'single':
        return '单次课';
      case 'trial':
        return '体验课';
      case 'package':
        return '套餐课';
      default:
        return type || '课程';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5F5EF]/50 to-gray-50 pt-16 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">加载中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5EF]/50 to-gray-50 pt-16 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">我的课程</h1>
          <p className="text-gray-600">管理你的网球课程和学习进度</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-primary mb-2">{stats.totalBookings}</div>
            <div className="text-gray-600">总课时</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-secondary mb-2">{stats.upcomingCount}</div>
            <div className="text-gray-600">待上课</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-success mb-2">{stats.completedCount}</div>
            <div className="text-gray-600">已完成</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-accent-gold mb-2">{stats.reportCount}</div>
            <div className="text-gray-600">学习报告</div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            即将到来
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            历史课程
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
              activeTab === 'reports'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            学习报告
          </button>
        </div>

        {/* 内容区域 */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            {upcomingCourses.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {booking.coach?.name?.[0] || '?'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{booking.coach?.name || '未知教练'}</h3>
                      <p className="text-gray-600">
                        {new Date(booking.scheduledDate).toLocaleDateString('zh-CN')}{' '}
                        {new Date(booking.scheduledDate).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {booking.course && ` · ${getCourseType(booking.course.type)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">课程类型</p>
                      <p className="font-semibold text-gray-900">
                        {getCourseType(booking.course?.type)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">价格</p>
                      <p className="text-2xl font-bold text-primary">
                        ¥{booking.price || booking.course?.price || 0}
                      </p>
                    </div>

                    <span
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        booking.status === 'confirmed'
                          ? 'bg-secondary/10 text-secondary'
                          : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {getStatusText(booking.status)}
                    </span>

                    <Link
                      href={`/booking/${booking.id}`}
                      className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors font-medium"
                    >
                      查看详情
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {upcomingCourses.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-600 mb-4">暂无即将到来的课程</p>
                <Link
                  href="/coaches"
                  className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors shadow-md"
                >
                  去预约课程
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyCourses.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-600">
                        {booking.coach?.name?.[0] || '?'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{booking.coach?.name || '未知教练'}</h3>
                      <p className="text-gray-600">
                        {new Date(booking.scheduledDate).toLocaleDateString('zh-CN')}{' '}
                        {new Date(booking.scheduledDate).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {booking.course && ` · ${getCourseType(booking.course.type)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">课程类型</p>
                      <p className="font-semibold text-gray-900">
                        {getCourseType(booking.course?.type)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">价格</p>
                      <p className="text-2xl font-bold text-gray-600">
                        ¥{booking.price || booking.course?.price || 0}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${i < (booking.coach?.rating || 0) ? 'text-yellow-500' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    <Link
                      href={`/coaches/${booking.coachId}`}
                      className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors font-medium"
                    >
                      再次预约
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {historyCourses.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-600">暂无历史课程</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {historyCourses.map((booking) => (
              <Link
                key={booking.id}
                href={`/ai-analysis`}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow block border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">
                    {new Date(booking.scheduledDate).toLocaleDateString('zh-CN')}
                  </span>
                  <span className="text-sm font-semibold text-secondary">查看报告</span>
                </div>

                <div className="mb-4">
                  <div className="text-lg font-bold text-gray-900 mb-1">
                    {booking.coach?.name || '教练'} 课程
                  </div>
                  <div className="text-gray-600 text-sm">{getCourseType(booking.course?.type)}</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    技术分析报告
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    改进建议
                  </div>
                </div>

                <button className="w-full mt-4 py-2 border-2 border-secondary text-secondary font-semibold rounded-lg hover:bg-secondary/5 transition-colors">
                  查看详情
                </button>
              </Link>
            ))}

            <Link
              href="/ai-analysis"
              className="bg-secondary/5 rounded-xl p-6 border-2 border-dashed border-secondary/30 hover:border-secondary/60 transition-colors flex flex-col items-center justify-center min-h-[300px]"
            >
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-secondary mb-2">创建新报告</h3>
              <p className="text-secondary/80 text-center text-sm">
                上传训练视频，AI 将为你生成学习报告
              </p>
            </Link>

            {historyCourses.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-600 mb-4">暂无学习报告</p>
                <Link
                  href="/ai-analysis"
                  className="inline-block px-6 py-3 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary-dark transition-colors shadow-md"
                >
                  创建第一个报告
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
