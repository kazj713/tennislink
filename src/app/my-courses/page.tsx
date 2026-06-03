'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MyCoursesPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'reports'>('upcoming');

  const upcomingCourses = [
    {
      id: 1,
      coach: '张教练',
      date: '2024-01-15',
      time: '14:00',
      venue: '朝阳网球中心',
      type: '单次课',
      status: 'confirmed',
      price: 400,
    },
    {
      id: 2,
      coach: '李教练',
      date: '2024-01-17',
      time: '10:00',
      venue: '海淀网球俱乐部',
      type: '体验课',
      status: 'pending',
      price: 175,
    },
  ];

  const historyCourses = [
    {
      id: 3,
      coach: '张教练',
      date: '2024-01-08',
      time: '14:00',
      venue: '朝阳网球中心',
      type: '单次课',
      status: 'completed',
      price: 400,
      rating: 5,
    },
    {
      id: 4,
      coach: '李教练',
      date: '2024-01-03',
      time: '10:00',
      venue: '海淀网球俱乐部',
      type: '体验课',
      status: 'completed',
      price: 175,
      rating: 4,
    },
  ];

  const learningReports = [
    {
      id: 1,
      date: '2024-01-10',
      score: 78,
      improvement: '+5',
      topics: ['发球技术', '底线进攻', '步法'],
    },
    {
      id: 2,
      date: '2024-01-05',
      score: 73,
      improvement: '+8',
      topics: ['正手击球', '网前截击', '双打战术'],
    },
    {
      id: 3,
      date: '2023-12-28',
      score: 65,
      improvement: '+3',
      topics: ['基础握拍', '站位', '发球入门'],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-gray-50 pt-16 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">我的课程</h1>
          <p className="text-gray-600">管理你的网球课程和学习进度</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-blue-600 mb-2">12</div>
            <div className="text-gray-600">总课时</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-blue-600 mb-2">2</div>
            <div className="text-gray-600">待上课</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-purple-600 mb-2">10</div>
            <div className="text-gray-600">已完成</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-yellow-600 mb-2">3</div>
            <div className="text-gray-600">学习报告</div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            即将到来
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            历史课程
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            学习报告
          </button>
        </div>

        {/* 内容区域 */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            {upcomingCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {course.coach[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{course.coach}</h3>
                      <p className="text-gray-600">
                        {course.date} {course.time} · {course.venue}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">课程类型</p>
                      <p className="font-semibold text-gray-900">{course.type}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">价格</p>
                      <p className="text-2xl font-bold text-blue-600">¥{course.price}</p>
                    </div>

                    <span
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        course.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {course.status === 'confirmed' ? '已确认' : '待确认'}
                    </span>

                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {upcomingCourses.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl">
                <p className="text-gray-600">暂无即将到来的课程</p>
                <Link
                  href="/coaches"
                  className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  去预约课程
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-600">
                        {course.coach[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{course.coach}</h3>
                      <p className="text-gray-600">
                        {course.date} {course.time} · {course.venue}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">课程类型</p>
                      <p className="font-semibold text-gray-900">{course.type}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">价格</p>
                      <p className="text-2xl font-bold text-gray-600">¥{course.price}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${i < course.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      再次预约
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {historyCourses.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl">
                <p className="text-gray-600">暂无历史课程</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningReports.map((report) => (
              <Link
                key={report.id}
                href={`/learning-reports/${report.id}`}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow block"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">{report.date}</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {report.improvement}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="text-5xl font-bold text-blue-600 mb-2">{report.score}</div>
                  <div className="text-gray-600">综合评分</div>
                </div>

                <div className="space-y-2">
                  {report.topics.map((topic, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {topic}
                    </div>
                  ))}
                </div>

                <button className="w-full mt-4 py-2 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
                  查看详情
                </button>
              </Link>
            ))}

            <Link
              href="/ai-analysis"
              className="bg-blue-50 rounded-xl p-6 border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors flex flex-col items-center justify-center min-h-[300px]"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-blue-700 mb-2">创建新报告</h3>
              <p className="text-blue-600 text-center">
                上传训练视频，AI 将为你生成学习报告
              </p>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
