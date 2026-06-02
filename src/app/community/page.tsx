'use client';

import { useState, useEffect } from 'react';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'videos' | 'challenges'>('all');
  const [showPostModal, setShowPostModal] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 模拟数据加载
  useEffect(() => {
    // 这里将来可以替换为真实的API调用
    setTimeout(() => {
      setPosts([
        {
          id: 1,
          user: { name: '网球爱好者', avatarColor: 'from-emerald-400 to-emerald-600' },
          content: '今天和教练练习发球，感觉进步很大！分享一下心得：手腕要放松，利用身体转动带动挥拍。大家有什么好的练习方法吗？',
          images: ['from-blue-400 to-blue-600'],
          tags: ['发球', '技术交流'],
          likes: 45,
          comments: 12,
          shares: 5,
          time: '2小时前',
        },
        {
          id: 2,
          user: { name: '初学者', avatarColor: 'from-purple-400 to-purple-600' },
          content: '刚买了一支新的网球拍，第一次打球，求指导！',
          images: ['from-yellow-400 to-yellow-600', 'from-red-400 to-red-600'],
          tags: ['新手求助', '装备'],
          likes: 32,
          comments: 28,
          shares: 2,
          time: '4小时前',
        },
        {
          id: 3,
          user: { name: '球技提升中', avatarColor: 'from-emerald-400 to-emerald-600' },
          content: '完成了本周的训练目标：连续击球 100 次！坚持就是胜利 💪',
          images: [],
          tags: ['打卡', '训练记录'],
          likes: 89,
          comments: 15,
          shares: 8,
          time: '昨天',
        },
      ]);
      
      setChallenges([
        {
          id: 1,
          title: '30天发球挑战',
          description: '每天坚持练习发球，提升发球技术',
          participants: 523,
          days: 30,
          progress: 12,
          status: 'ongoing',
        },
        {
          id: 2,
          title: '双打战术周',
          description: '专注于双打战术训练和实战',
          participants: 234,
          days: 7,
          progress: 3,
          status: 'ongoing',
        },
        {
          id: 3,
          title: '体能强化月',
          description: '结合网球运动的体能训练计划',
          participants: 412,
          days: 30,
          progress: 0,
          status: 'upcoming',
        },
      ]);
      
      setTopics(['#发球技巧', '#新手入门', '#双打战术', '#体能训练', '#装备推荐']);
      
      setActiveUsers([
        { name: '网球达人', level: '高级', color: 'from-emerald-400 to-emerald-600' },
        { name: '教练张', level: '教练', color: 'from-emerald-400 to-emerald-600' },
        { name: '新手小王', level: '初级', color: 'from-purple-400 to-purple-600' },
      ]);
      
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-16 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">社区</h1>
            <p className="text-gray-600">分享网球心得，结识志同道合的球友</p>
          </div>
          <button
            onClick={() => setShowPostModal(true)}
            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors w-full sm:w-auto"
          >
            发布动态
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2 font-medium rounded-full transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-2 font-medium rounded-full transition-colors whitespace-nowrap ${
              activeTab === 'posts'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            图文动态
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-6 py-2 font-medium rounded-full transition-colors whitespace-nowrap ${
              activeTab === 'videos'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            视频分享
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`px-6 py-2 font-medium rounded-full transition-colors whitespace-nowrap ${
              activeTab === 'challenges'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            打卡挑战
          </button>
        </div>

        {/* 打卡挑战区域 */}
        {(activeTab === 'all' || activeTab === 'challenges') && challenges.length > 0 ? (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">热门挑战</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{challenge.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        challenge.status === 'ongoing'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {challenge.status === 'ongoing' ? '进行中' : '即将开始'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{challenge.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>{challenge.participants} 人参与</span>
                    <span>{challenge.days} 天</span>
                  </div>
                  {challenge.status === 'ongoing' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">进度</span>
                        <span className="font-semibold text-emerald-600">{challenge.progress}/{challenge.days}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(challenge.progress / challenge.days) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <button className="w-full py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
                    {challenge.status === 'ongoing' ? '继续挑战' : '加入挑战'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* 内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 主内容区 */}
          <div className="lg:col-span-3 space-y-6">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                  {/* 用户信息 */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${post.user.avatarColor} rounded-full flex items-center justify-center`}
                    >
                      <span className="text-white font-bold">{post.user.name[0]}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{post.user.name}</h3>
                      <p className="text-sm text-gray-500">{post.time}</p>
                    </div>
                  </div>

                  {/* 内容 */}
                  <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>

                  {/* 图片 */}
                  {post.images.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {post.images.map((color, index) => (
                        <div
                          key={index}
                          className={`aspect-video bg-gradient-to-br ${color} rounded-lg overflow-hidden`}
                        />
                      ))}
                    </div>
                  )}

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* 互动按钮 */}
                  <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{post.comments}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span>{post.shares}</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl p-12 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无动态</h3>
                <p className="text-gray-600 mb-6">成为第一个发布动态的人吧！</p>
                <button
                  onClick={() => setShowPostModal(true)}
                  className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  发布第一条动态
                </button>
              </div>
            )}
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 热门话题 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">热门话题</h3>
              <div className="space-y-3">
                {topics.map((topic, index) => (
                  <div
                    key={topic}
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  >
                    <span className="text-emerald-600 font-semibold">{topic}</span>
                    <span className="text-sm text-gray-500">{(100 - index * 15)} 讨论</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 活跃用户 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">活跃球友</h3>
              <div className="space-y-3">
                {activeUsers.map((user) => (
                  <div
                    key={user.name}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  >
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${user.color} rounded-full flex items-center justify-center`}
                    >
                      <span className="text-white font-bold">{user.name[0]}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.level}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 社区指南 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">社区指南</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>分享真实的网球经验和心得</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>尊重他人，友善交流</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>遵守社区规范，不发布违规内容</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>保护个人隐私，不泄露敏感信息</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 发布动态弹窗 */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">发布动态</h2>
                <button
                  onClick={() => setShowPostModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <textarea
                placeholder="分享你的网球心得..."
                className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none mb-4"
              />
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  添加图片
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                  添加视频
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  添加标签
                </button>
              </div>
              <button className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
                发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}