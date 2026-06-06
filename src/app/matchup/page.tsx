'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MatchupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateMatchup = async () => {
    setLoading(true);
    setError(null);
    try {
      // 这里可以添加创建对战的逻辑
      console.log('Creating matchup...');
      // 模拟成功
      setTimeout(() => {
        setLoading(false);
        // 可以跳转到其他页面
        router.push('/');
      }, 1000);
    } catch (err) {
      setError('创建对战失败，请重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5EF]/50 to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">创建对战</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              对战类型
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
            >
              <option value="singles">单打</option>
              <option value="doubles">双打</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              场地类型
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
            >
              <option value="hard">硬地</option>
              <option value="clay">红土</option>
              <option value="grass">草地</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              比赛时间
            </label>
            <input 
              type="datetime-local" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
            />
          </div>
        </div>
        
        <button
          onClick={handleCreateMatchup}
          disabled={loading}
          className="mt-6 w-full bg-primary hover:bg-primary-dark focus:outline-none focus:ring-primary-light focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '创建中...' : '创建对战'}
        </button>
      </div>
    </div>
  );
}
