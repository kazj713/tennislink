'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Review {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Coach {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
}

export default function CoachReviewsPage({ params }: { params: { id: string } }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  
  // 评价表单状态
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    fetchReviews();
    fetchCoachInfo();
  }, [params.id]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/coaches/${params.id}/reviews`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.data || []);
      } else {
        setError(data.error || '获取评价失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachInfo = async () => {
    try {
      const response = await fetch(`/api/coaches/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setCoach({
          id: data.data.id,
          name: data.data.user?.name || data.data.name,
          rating: parseFloat(data.data.averageRating || '0'),
          reviewCount: data.data.reviewCount || 0
        });
      }
    } catch (err) {
      console.error('获取教练信息失败:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setSubmitError('请输入评价内容');
      return;
    }
    
    try {
      setSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);
      
      const response = await fetch(`/api/coaches/${params.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating, comment })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubmitSuccess(true);
        setRating(5);
        setComment('');
        
        // 重新获取评价列表
        await fetchReviews();
        await fetchCoachInfo();
        
        // 3秒后清除成功提示
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      } else {
        setSubmitError(data.error || '提交评价失败');
      }
    } catch (err) {
      setSubmitError('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-6 h-6 ${i < rating ? 'text-yellow-500' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* 页面头部 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {coach ? `${coach.name}的评价` : '教练评价'}
              </h1>
              {coach && (
                <p className="text-gray-600 mt-1">
                  共 {coach.reviewCount} 条评价，平均评分 {coach.rating.toFixed(1)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左侧评价列表 */}
          <div className="lg:col-span-2">
            {/* 添加评价表单 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">添加评价</h2>
              
              {submitSuccess && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-4">
                  评价提交成功！
                </div>
              )}
              
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
                  {submitError}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                {/* 评分 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    评分
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors ${star <= rating ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 评价内容 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    评价内容
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="请分享您的学习体验和对教练的评价..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                
                {/* 提交按钮 */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '提交中...' : '提交评价'}
                </button>
              </form>
            </div>

            {/* 评价列表 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">评价列表</h2>
              
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">暂无评价</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {reviews.map((review) => (
                    <div key={review.id} className="pb-8 border-b border-gray-100 last:border-0">
                      <div className="flex items-start gap-4">
                        {/* 用户头像 */}
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold">
                            {review.userName ? review.userName[0] : 'U'}
                          </span>
                        </div>
                        
                        {/* 评价内容 */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {review.userName || '用户'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* 右侧评分统计 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">评分统计</h3>
              
              {coach && (
                <div className="space-y-6">
                  {/* 平均评分 */}
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">
                      {coach.rating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {renderStars(Math.round(coach.rating))}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      基于 {coach.reviewCount} 条评价
                    </div>
                  </div>
                  
                  {/* 评分分布 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">评分分布</h4>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter(r => r.rating === star).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      
                      return (
                        <div key={star} className="flex items-center gap-3 mb-2">
                          <div className="w-12 flex items-center">
                            <span className="text-sm font-medium text-gray-700">{star}星</span>
                          </div>
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-8 text-right">
                            <span className="text-sm text-gray-600">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
