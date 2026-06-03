'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Coach {
  id: string;
  name: string;
  rating: number;
  years?: number;
  students?: number;
  price: number;
  tags?: string[];
  avatarColor?: string;
  description?: string;
  avatar?: string | null;
}

export default function CoachesPage() {
  const [filters, setFilters] = useState({
    level: '',
    location: '',
    priceRange: '',
  });
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  // 从API获取教练列表
  useEffect(() => {
    async function fetchCoaches() {
      try {
        const response = await fetch('/api/coaches');
        if (!response.ok) throw new Error('获取教练列表失败');
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const formattedCoaches = data.data.map((coach: any) => ({
            id: coach.id,
            name: coach.name || coach.user?.name || '未知教练',
            rating: coach.rating || coach.averageRating || 4.5,
            years: coach.experienceYears || coach.experience_years,
            students: coach.totalLessons || coach.total_lessons,
            price: coach.hourlyRate || coach.hourly_rate || 200,
            tags: coach.specialties || coach.certifications || [],
            description: coach.description || `${coach.years || coach.experienceYears || 0}年教学经验`,
          }));
          setCoaches(formattedCoaches);
        }
      } catch (err) {
        console.error('获取教练列表失败:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCoaches();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-gray-50 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">找到你的专属教练</h1>
          <p className="text-xl text-emerald-100">
            AI 智能匹配，为你推荐最适合的网球教练
          </p>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">全部城市</option>
              <option value="beijing">北京</option>
              <option value="shanghai">上海</option>
              <option value="guangzhou">广州</option>
              <option value="shenzhen">深圳</option>
            </select>

            <select
              value={filters.level}
              onChange={(e) => setFilters({...filters, level: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">全部水平</option>
              <option value="beginner">新手</option>
              <option value="elementary">初级</option>
              <option value="intermediate">中级</option>
              <option value="advanced">高级</option>
            </select>

            <select
              value={filters.priceRange}
              onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">全部价格</option>
              <option value="0-200">¥0 - ¥200</option>
              <option value="200-300">¥200 - ¥300</option>
              <option value="300-400">¥300 - ¥400</option>
              <option value="400+">¥400+</option>
            </select>

            <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold">
              搜索
            </button>
          </div>
        </div>
      </div>

      {/* 教练列表 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-gray-600">加载教练列表...</p>
          </div>
        ) : coaches.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无教练信息</h3>
            <p className="text-gray-600 mb-6">目前还没有可用的教练，请稍后再来查看</p>
            <Link href="/find-coach" className="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
              填写需求找教练
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coaches.map((coach) => (
              <Link
                key={coach.id}
                href={`/coaches/${coach.id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1"
              >
                {/* 头像 */}
                <div className="aspect-[4/3] bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  {coach.avatar ? (
                    <img src={coach.avatar} alt={coach.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-8xl font-bold text-white/20">{coach.name[0]}</span>
                  )}
                </div>

                {/* 信息 */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{coach.name}</h3>
                    <div className="flex items-center gap-1">
                      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-gray-700 font-semibold">{coach.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 text-sm line-clamp-2">{coach.description}</p>

                  {/* 标签 */}
                  {coach.tags && coach.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {coach.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 底部信息 */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {coach.years && <span>{coach.years}年经验</span>}
                      {coach.students && <span>{coach.students}+学员</span>}
                    </div>
                    <span className="text-2xl font-bold text-emerald-600">
                      ¥{coach.price}
                      <span className="text-sm font-normal text-gray-500">/课时</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
