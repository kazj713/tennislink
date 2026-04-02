'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Coach {
  id: string;
  name: string;
  price: number;
  rating: number;
  avatar?: string | null;
}

interface Venue {
  id: string;
  name: string;
  address: string;
  price: number;
}

interface CourseType {
  value: string;
  name: string;
  description: string;
  multiplier: number;
}

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookingData, setBookingData] = useState({
    coach: '',
    date: '',
    time: '',
    venue: '',
    courseType: 'single',
  });

  const courseTypes: CourseType[] = [
    { value: 'trial', name: '体验课', description: '首次体验，优惠价', multiplier: 0.5 },
    { value: 'single', name: '单次课', description: '单次预约', multiplier: 1 },
    { value: 'package10', name: '10次套餐', description: '一次性购买10次，优惠10%', multiplier: 0.9 * 10 },
  ];

  // 获取教练列表
  useEffect(() => {
    async function fetchCoaches() {
      try {
        const response = await fetch('/api/coaches');
        if (!response.ok) throw new Error('获取教练列表失败');
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // 转换数据格式
          const formattedCoaches = data.data.map((coach: any) => ({
            id: coach.id,
            name: coach.name || coach.user?.name || '未知教练',
            price: coach.hourlyRate || 200,
            rating: coach.rating || 4.5,
            avatar: coach.avatar || coach.user?.avatar,
          }));
          setCoaches(formattedCoaches);
        }
      } catch (err) {
        console.error('获取教练列表失败:', err);
        setError('获取教练列表失败，请刷新页面重试');
      }
    }
    fetchCoaches();
  }, []);

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
            price: venue.pricePerHour || 100,
          }));
          setVenues(formattedVenues);
        }
      } catch (err) {
        console.error('获取场地列表失败:', err);
        setError('获取场地列表失败，请刷新页面重试');
      }
    }
    fetchVenues();
  }, []);

  // 生成时间段（根据日期动态生成）
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const calculateTotal = () => {
    const coach = coaches.find((c) => c.id === bookingData.coach);
    const venue = venues.find((v) => v.id === bookingData.venue);
    const courseType = courseTypes.find((ct) => ct.value === bookingData.courseType);

    if (!coach || !venue || !courseType) return 0;

    return (coach.price + venue.price) * courseType.multiplier;
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const coach = coaches.find((c) => c.id === bookingData.coach);
      const venue = venues.find((v) => v.id === bookingData.venue);

      if (!coach || !venue) {
        throw new Error('请选择教练和场地');
      }

      // 创建预订
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId: bookingData.coach,
          venueId: bookingData.venue,
          date: bookingData.date,
          time: bookingData.time,
          courseType: bookingData.courseType,
          amount: calculateTotal(),
        }),
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.message || '创建预订失败');
      }

      const bookingResult = await bookingResponse.json();

      // 创建支付订单
      const paymentResponse = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingResult.data.id,
          amount: calculateTotal(),
          description: `网球课程 - ${coach.name}`,
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || '创建支付订单失败');
      }

      const paymentResult = await paymentResponse.json();

      // 跳转到支付页面或显示支付二维码
      if (paymentResult.data?.paymentUrl) {
        window.location.href = paymentResult.data.paymentUrl;
      } else {
        // 显示支付信息
        alert(`订单已创建，订单号：${paymentResult.data?.orderId || bookingResult.data.id}`);
      }
    } catch (err: any) {
      console.error('支付失败:', err);
      setError(err.message || '支付失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取今天的日期作为最小日期
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">预约课程</h1>
          <p className="text-gray-600">简单 3 步，轻松预约你的网球课程</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= i
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i}
              </div>
              {i < 3 && (
                <div className={`w-24 h-1 ${step > i ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* 步骤内容 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">选择教练</h2>
            {coaches.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">加载教练列表...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {coaches.map((coach) => (
                  <label
                    key={coach.id}
                    className={`flex items-center p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      bookingData.coach === coach.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="coach"
                      value={coach.id}
                      checked={bookingData.coach === coach.id}
                      onChange={(e) => setBookingData({ ...bookingData, coach: e.target.value })}
                      className="w-5 h-5 text-blue-600"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {coach.avatar ? (
                            <img
                              src={coach.avatar}
                              alt={coach.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xl font-bold text-blue-600">
                                {coach.name[0]}
                              </span>
                            </div>
                          )}
                          <h3 className="text-xl font-bold text-gray-900">{coach.name}</h3>
                        </div>
                        <span className="text-2xl font-bold text-blue-600">
                          ¥{coach.price}
                          <span className="text-sm font-normal text-gray-500">/课时</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(coach.rating) ? 'text-yellow-500' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-gray-600">({coach.rating.toFixed(1)} 分)</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={handleNext}
                disabled={!bookingData.coach || coaches.length === 0}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">选择时间和场地</h2>

            {/* 日期选择 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择日期
              </label>
              <input
                type="date"
                min={today}
                value={bookingData.date}
                onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* 时间选择 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择时间
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setBookingData({ ...bookingData, time: slot })}
                    className={`px-2 py-2 border-2 rounded-lg text-sm font-medium transition-all ${
                      bookingData.time === slot
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* 场地选择 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择场地
              </label>
              {venues.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">加载场地列表...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {venues.map((venue) => (
                    <label
                      key={venue.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        bookingData.venue === venue.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="venue"
                        value={venue.id}
                        checked={bookingData.venue === venue.id}
                        onChange={(e) => setBookingData({ ...bookingData, venue: e.target.value })}
                        className="w-5 h-5 text-blue-600"
                      />
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">{venue.name}</h3>
                          <span className="text-lg font-bold text-blue-600">¥{venue.price}</span>
                        </div>
                        <p className="text-sm text-gray-600">{venue.address}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 课程类型 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                课程类型
              </label>
              <div className="space-y-3">
                {courseTypes.map((ct) => (
                  <label
                    key={ct.value}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      bookingData.courseType === ct.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="courseType"
                      value={ct.value}
                      checked={bookingData.courseType === ct.value}
                      onChange={(e) => setBookingData({ ...bookingData, courseType: e.target.value })}
                      className="w-5 h-5 text-blue-600"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{ct.name}</h3>
                          <p className="text-sm text-gray-600">{ct.description}</p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                上一步
              </button>
              <button
                onClick={handleNext}
                disabled={!bookingData.date || !bookingData.time || !bookingData.venue}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">确认订单</h2>

            {/* 订单详情 */}
            <div className="space-y-6 mb-8">
              {/* 教练信息 */}
              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">教练信息</h3>
                <div className="flex items-center gap-4">
                  {coaches.find((c) => c.id === bookingData.coach)?.avatar ? (
                    <img
                      src={coaches.find((c) => c.id === bookingData.coach)?.avatar || ''}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {coaches.find((c) => c.id === bookingData.coach)?.name[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {coaches.find((c) => c.id === bookingData.coach)?.name}
                    </h4>
                    <p className="text-gray-600">
                      ¥{coaches.find((c) => c.id === bookingData.coach)?.price}/课时
                    </p>
                  </div>
                </div>
              </div>

              {/* 时间和场地 */}
              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">时间和场地</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {bookingData.date} {bookingData.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{venues.find((v) => v.id === bookingData.venue)?.name}</span>
                  </div>
                </div>
              </div>

              {/* 课程类型 */}
              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">课程类型</h3>
                <p className="text-gray-700">
                  {courseTypes.find((ct) => ct.value === bookingData.courseType)?.name}
                </p>
              </div>

              {/* 价格明细 */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between text-gray-700 mb-2">
                  <span>教练费用</span>
                  <span>
                    ¥{coaches.find((c) => c.id === bookingData.coach)?.price}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700 mb-2">
                  <span>场地费用</span>
                  <span>
                    ¥{venues.find((v) => v.id === bookingData.venue)?.price}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 mt-4 pt-4 border-t border-gray-200">
                  <span>总计</span>
                  <span className="text-blue-600">¥{calculateTotal()}</span>
                </div>
              </div>
            </div>

            {/* 支付按钮 */}
            <div className="flex gap-4">
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                上一步
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="flex-1 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    处理中...
                  </span>
                ) : (
                  `确认支付 ¥${calculateTotal()}`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
