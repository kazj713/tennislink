'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CoachesPage() {
  const [filters, setFilters] = useState({
    level: '',
    location: '',
    priceRange: '',
  });

  const coaches = [
    {
      id: 1,
      name: '张教练',
      rating: 4.9,
      years: 10,
      students: 500,
      price: 300,
      tags: ['ATP认证', '发球专家', '青少年'],
      avatarColor: 'from-blue-400 to-blue-600',
      description: '10年教学经验，前省队主力，擅长发球和底线技术',
    },
    {
      id: 2,
      name: '李教练',
      rating: 4.8,
      years: 8,
      students: 350,
      price: 250,
      tags: ['省队', '底线', '双打'],
      avatarColor: 'from-blue-400 to-blue-600',
      description: '8年教学经验，前省队主力，专注底线技术和双打战术',
    },
    {
      id: 3,
      name: '王教练',
      rating: 4.7,
      years: 5,
      students: 200,
      price: 200,
      tags: ['青少年', '入门', '趣味'],
      avatarColor: 'from-purple-400 to-purple-600',
      description: '5年教学经验，专注于青少年网球启蒙，教学风格活泼',
    },
    {
      id: 4,
      name: '刘教练',
      rating: 4.9,
      years: 12,
      students: 600,
      price: 400,
      tags: ['国际认证', '战术', '比赛'],
      avatarColor: 'from-red-400 to-red-600',
      description: '12年教学经验，ITF认证教练，擅长比赛战术分析',
    },
    {
      id: 5,
      name: '陈教练',
      rating: 4.6,
      years: 6,
      students: 280,
      price: 220,
      tags: ['网前', '截击', '进阶'],
      avatarColor: 'from-yellow-400 to-yellow-600',
      description: '6年教学经验，专注网前技术和截击技巧，帮助学员提升进攻能力',
    },
    {
      id: 6,
      name: '赵教练',
      rating: 4.8,
      years: 7,
      students: 320,
      price: 280,
      tags: ['体能', '康复', '全面'],
      avatarColor: 'from-indigo-400 to-indigo-600',
      description: '7年教学经验，结合体能训练和康复指导，全面提升学员身体素质',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">找到你的专属教练</h1>
          <p className="text-xl text-blue-100">
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">全部价格</option>
              <option value="0-200">¥0 - ¥200</option>
              <option value="200-300">¥200 - ¥300</option>
              <option value="300-400">¥300 - ¥400</option>
              <option value="400+">¥400+</option>
            </select>

            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              搜索
            </button>
          </div>
        </div>
      </div>

      {/* 教练列表 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {coaches.map((coach) => (
            <Link
              key={coach.id}
              href={`/coaches/${coach.id}`}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1"
            >
              {/* 头像 */}
              <div className={`aspect-[4/3] bg-gradient-to-br ${coach.avatarColor} flex items-center justify-center`}>
                <span className="text-8xl font-bold text-white/20">{coach.name[0]}</span>
              </div>

              {/* 信息 */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{coach.name}</h3>
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-gray-700 font-semibold">{coach.rating}</span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4 text-sm line-clamp-2">{coach.description}</p>

                {/* 标签 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {coach.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 底部信息 */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{coach.years}年经验</span>
                    <span>{coach.students}+学员</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    ¥{coach.price}
                    <span className="text-sm font-normal text-gray-500">/课时</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
