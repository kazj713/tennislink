'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BudgetRange {
  min: number;
  max: number;
}

interface LearningGoal {
  id: string;
  name: string;
  description: string;
}

interface VenuePreference {
  id: string;
  name: string;
}

export default function FindCoachPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 学习目标选项
  const learningGoals: LearningGoal[] = [
    { id: 'fat_loss', name: '减脂', description: '通过网球运动达到减脂目的' },
    { id: 'entertainment', name: '娱乐', description: '以娱乐休闲为主要目的' },
    { id: 'skill_improvement', name: '技术提升', description: '提升网球技术水平' },
    { id: 'competition', name: '比赛', description: '准备参加网球比赛' },
  ];
  
  // 场地偏好选项
  const venuePreferences: VenuePreference[] = [
    { id: 'outdoor', name: '室外场地' },
    { id: 'indoor', name: '室内场地' },
    { id: 'mixed', name: '均可' },
  ];
  
  // 需求表单状态
  const [formData, setFormData] = useState({
    budget: {
      min: 100,
      max: 500,
    },
    preferredTime: 'weekend', // weekend, weekday, evening
    city: '',
    district: '',
    learningGoal: '',
    venuePreference: 'mixed',
  });
  
  // 处理预算范围变化
  const handleBudgetChange = (type: 'min' | 'max', value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => {
      const newBudget = { ...prev.budget, [type]: numValue };
      
      // 确保最小值不大于最大值
      if (newBudget.min > newBudget.max) {
        newBudget.max = newBudget.min;
      }
      
      return {
        ...prev,
        budget: newBudget,
      };
    });
  };
  
  // 提交需求
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // 验证必填字段
      if (!formData.city.trim()) {
        setError('请输入所在城市');
        return;
      }
      
      if (!formData.learningGoal) {
        setError('请选择学习目标');
        return;
      }
      
      // 发送需求到API
      const response = await fetch('/api/coach-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 将需求数据存储到localStorage，以便推荐页面使用
        localStorage.setItem('coachRecommendationCriteria', JSON.stringify(formData));
        // 跳转到推荐教练列表页面
        router.push('/coach-recommendations');
      } else {
        setError(data.error || '提交失败');
      }
    } catch (err: any) {
      setError(err.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5EF] to-[#EEF2EA] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">T</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">寻找合适的教练</h1>
          <p className="text-gray-600 mt-2">告诉我们您的需求，我们将为您推荐最适合的教练</p>
        </div>
        
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 预算区间 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">预算区间</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最低价格（元/小时）
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="50"
                  value={formData.budget.min}
                  onChange={(e) => handleBudgetChange('min', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最高价格（元/小时）
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="50"
                  value={formData.budget.max}
                  onChange={(e) => handleBudgetChange('max', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>
          
          {/* 上课时间偏好 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">上课时间偏好</h2>
            <div className="grid md:grid-cols-3 gap-3">
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="radio"
                  name="preferredTime"
                  value="weekend"
                  checked={formData.preferredTime === 'weekend'}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary-light"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">周末</div>
                  <div className="text-sm text-gray-500">周六、周日</div>
                </div>
              </label>
              
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="radio"
                  name="preferredTime"
                  value="weekday"
                  checked={formData.preferredTime === 'weekday'}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary-light"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">工作日白天</div>
                  <div className="text-sm text-gray-500">周一至周五白天</div>
                </div>
              </label>
              
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="radio"
                  name="preferredTime"
                  value="evening"
                  checked={formData.preferredTime === 'evening'}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary-light"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">工作日晚上</div>
                  <div className="text-sm text-gray-500">周一至周五晚上</div>
                </div>
              </label>
            </div>
          </div>
          
          {/* 城市和区域 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">上课地点</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  城市
                </label>
                <input
                  type="text"
                  placeholder="请输入城市"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  区域
                </label>
                <input
                  type="text"
                  placeholder="请输入区域"
                  value={formData.district}
                  onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>
          
          {/* 学习目标 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">学习目标</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {learningGoals.map(goal => (
                <label
                  key={goal.id}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${formData.learningGoal === goal.id ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/30'}`}
                >
                  <input
                    type="radio"
                    name="learningGoal"
                    value={goal.id}
                    checked={formData.learningGoal === goal.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, learningGoal: e.target.value }))}
                    className="mt-1 w-4 h-4 text-primary border-gray-300 focus:ring-primary-light"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{goal.name}</div>
                    <div className="text-sm text-gray-500">{goal.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          {/* 场地偏好 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">场地偏好</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {venuePreferences.map(venue => (
                <label
                  key={venue.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.venuePreference === venue.id ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/30'}`}
                >
                  <input
                    type="radio"
                    name="venuePreference"
                    value={venue.id}
                    checked={formData.venuePreference === venue.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, venuePreference: e.target.value }))}
                    className="w-4 h-4 text-primary border-gray-300 focus:ring-primary-light"
                  />
                  <span className="ml-3 font-medium text-gray-900">{venue.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* 提交按钮 */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? '寻找教练中...' : '寻找合适的教练'}
            </button>
          </div>
        </form>
        
        {/* 底部链接 */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            已有心仪的教练？
            <Link href="/coaches" className="text-primary hover:text-primary-dark font-semibold ml-1">
              直接查看教练列表
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
