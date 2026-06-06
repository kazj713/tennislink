'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';

interface Court {
  id: string;
  courtNumber: number;
  type: 'indoor' | 'outdoor' | 'mixed';
  name: string;
  clubId?: string;
}

interface TimeSlotData {
  time: string;          // "07:00", "08:00"...
  startTime: string;     // "07:00"
  endTime: string;       // "07:59" (XX:00-XX:59格式)
  priceType: 'normal' | 'peak' | 'offpeak' | 'discount';
  basePrice: number;
}

interface CellStatus {
  available: boolean;
  selected: boolean;
  sold: boolean;
  price: number;
  bookingId?: string;
}

interface SelectedSlot {
  courtId: string;
  courtName: string;
  date: string;
  timeRange: string;
  startTime: string;
  endTime: string;
  price: number;
  priceType: string;
}

interface WeatherInfo {
  temperature: number;
  condition: string;
  icon: string;
  humidity?: number;
  windSpeed?: number;
}

interface DateCard {
  date: Date;
  dateStr: string;      // "2024-05-28"
  displayStr: string;    // "05/28"
  dayLabel: string;     // "今天", "明天", "周三"...
  isToday: boolean;
  isTomorrow: boolean;
}

export default function VenuesPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [dateCards, setDateCards] = useState<DateCard[]>([]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'selected' | 'discount' | 'sold'>('all');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [locationInfo, setLocationInfo] = useState<{ city: string; lat: number; lng: number } | null>(null);
  const { showToast } = useToast();

  // 时间范围：07:00 - 22:00
  const TIME_START = 7;
  const TIME_END = 22;

  // 初始化数据
  useEffect(() => {
    initializeData();
  }, []);

  // 初始化球场数据和日期卡片
  const initializeData = async () => {
    setLoading(true);
    
    try {
      // 并行获取球场数据和生成日期卡片
      await Promise.all([
        fetchCourts(),
        generateDateCards(),
        requestGeolocation()
      ]);
      
      // 获取天气信息
      await fetchWeather();
    } catch (error) {
      console.error('初始化失败:', error);
      showToast('加载数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 获取球场列表
  const fetchCourts = async () => {
    try {
      const response = await fetch('/api/courts?limit=20');
      if (!response.ok) throw new Error('获取球场列表失败');
      
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const formattedCourts: Court[] = data.data.map((court: any, index: number) => ({
          id: court.id || `court-${index + 1}`,
          courtNumber: court.courtNumber || index + 1,
          type: court.type || (index < 3 ? 'outdoor' : 'indoor'),
          name: court.name || `${court.type === 'indoor' ? '室内' : '室外'}${index + 1}号场`,
          clubId: court.clubId,
        }));
        
        setCourts(formattedCourts.length > 0 ? formattedCourts : generateMockCourts());
      } else {
        setCourts(generateMockCourts());
      }
    } catch (error) {
      console.error('获取球场失败:', error);
      setCourts(generateMockCourts());
    }
  };

  // 生成模拟球场数据（当API不可用时）
  const generateMockCourts = (): Court[] => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: `court-${i + 1}`,
      courtNumber: i + 1,
      type: i < 3 ? 'outdoor' as const : 'indoor' as const,
      name: i < 3 ? `室外${i + 1}号场` : `室内${i - 2}号场`,
    }));
  };

  // 生成7天日期卡片
  const generateDateCards = async () => {
    const cards: DateCard[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      
      let dayLabel = weekDays[date.getDay()];
      if (i === 0) dayLabel = '今天';
      else if (i === 1) dayLabel = '明天';

      cards.push({
        date,
        dateStr: date.toISOString().split('T')[0],
        displayStr: `${month}/${day}`,
        dayLabel,
        isToday: i === 0,
        isTomorrow: i === 1,
      });
    }

    setDateCards(cards);
  };

  // 获取天气信息
  const fetchWeather = async () => {
    try {
      let url = '/api/weather';
      if (locationInfo?.city) {
        url += `?city=${encodeURIComponent(locationInfo.city)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setWeather({
            temperature: data.data.temperature || 25,
            condition: data.data.condition || '晴',
            icon: data.data.icon || '☀️',
            humidity: data.data.humidity,
            windSpeed: data.data.windSpeed,
          });
        }
      }
    } catch (error) {
      console.error('获取天气失败:', error);
      // 天气获取失败不阻断主流程
    }
  };

  // GPS定位请求
  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    setLocationStatus('loading');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationInfo({
          city: '',
          lat: latitude,
          lng: longitude,
        });
        setLocationStatus('success');
        
        // 反向地理编码获取城市名称（简化版）
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.warn('定位失败:', error.message);
        setLocationStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5分钟缓存
      }
    );
  }, []);

  // 简单的反向地理编码（实际项目中应调用高德API）
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // 这里可以调用高德地图的逆地理编码API
      // 暂时使用默认城市名
      setLocationInfo(prev => prev ? { ...prev, city: '北京市' } : null);
    } catch (error) {
      console.error('反向地理编码失败:', error);
    }
  };

  // 生成时间段数据
  const generateTimeSlots = (): TimeSlotData[] => {
    const slots: TimeSlotData[] = [];
    
    for (let hour = TIME_START; hour <= TIME_END; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${hour.toString().padStart(2, '0')}:59`;
      
      // 判断价格类型
      let priceType: 'normal' | 'peak' | 'offpeak' | 'discount' = 'normal';
      let basePrice = 100;

      if (hour >= 10 && hour <= 17) {
        priceType = 'peak';
        basePrice = 150;
      } else if (hour >= 8 && hour <= 9) {
        priceType = 'offpeak';
        basePrice = 80;
      } else if (hour >= 18 && hour <= 19) {
        priceType = 'discount'; // 晚间折扣
        basePrice = 90;
      }

      slots.push({
        time: timeStr,
        startTime: timeStr,
        endTime,
        priceType,
        basePrice,
      });
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // 获取当前选中日期
  const selectedDate = dateCards[selectedDateIndex]?.dateStr || '';

  // 计算单元格状态
  const getCellStatus = useCallback((courtId: string, startTime: string): CellStatus => {
    // 检查是否已选中
    const isSelected = selectedSlots.some(
      slot => slot.courtId === courtId && slot.startTime === startTime && slot.date === selectedDate
    );

    if (isSelected) {
      return {
        available: true,
        selected: true,
        sold: false,
        price: 0,
      };
    }

    // 获取该时段的基础价格信息
    const timeSlot = timeSlots.find(ts => ts.startTime === startTime);
    const price = timeSlot?.basePrice || 100;

    // 模拟售罄状态（随机或基于业务逻辑）
    // 这里使用简单的随机逻辑，实际应从API获取
    const isSold = Math.random() > 0.85; // 15%概率已售罄

    return {
      available: !isSold,
      selected: false,
      sold: isSold,
      price,
    };
  }, [selectedSlots, selectedDate, timeSlots]);

  // 切换单元格选择状态
  const toggleCellSelection = (court: Court, timeSlot: TimeSlotData) => {
    const cellStatus = getCellStatus(court.id, timeSlot.startTime);
    
    if (cellStatus.sold) return; // 已售罄不可选

    const existingIndex = selectedSlots.findIndex(
      slot => slot.courtId === court.id && 
              slot.startTime === timeSlot.startTime && 
              slot.date === selectedDate
    );

    if (existingIndex >= 0) {
      // 取消选择
      setSelectedSlots(prev => prev.filter((_, index) => index !== existingIndex));
    } else {
      // 添加选择
      const newSlot: SelectedSlot = {
        courtId: court.id,
        courtName: court.name,
        date: selectedDate,
        timeRange: `${timeSlot.startTime}-${timeSlot.endTime}`,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        price: timeSlot.basePrice,
        priceType: timeSlot.priceType,
      };
      setSelectedSlots(prev => [...prev, newSlot]);
    }
  };

  // 移除单个已选项
  const removeSelectedSlot = (index: number) => {
    setSelectedSlots(prev => prev.filter((_, i) => i !== index));
  };

  // 清空所有选择
  const clearAllSelections = () => {
    setSelectedSlots([]);
  };

  // 计算总金额
  const calculateTotalAmount = (): number => {
    return selectedSlots.reduce((total, slot) => total + slot.price, 0);
  };

  // 提交预订
  const handleBooking = async () => {
    if (selectedSlots.length === 0) {
      showToast('请至少选择一个时段', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        showToast('请先登录后再进行预订', 'error');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }

      // 使用AbortController设置超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      try {
        const response = await fetch('/api/court-bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookings: selectedSlots.map(slot => ({
              courtId: slot.courtId,
              bookingDate: slot.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              totalHours: 1,
              totalAmount: slot.price,
              notes: `场地预订: ${slot.courtName} ${slot.timeRange}`,
            })),
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // 缓存JSON结果避免重复解析
        let responseData;
        try {
          responseData = await response.json();
        } catch (jsonError) {
          throw new Error('服务器响应异常，请稍后重试');
        }

        if (!response.ok) {
          const errorMessage = responseData?.error || responseData?.message || '预订失败';
          throw new Error(errorMessage);
        }

        showToast(`成功预订${selectedSlots.length}个时段！`, 'success');
        
        // 清空选择
        setTimeout(() => {
          clearAllSelections();
        }, 2000);

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('请求超时，请检查网络后重试');
        }
        throw fetchError;
      }

    } catch (error: any) {
      console.error('预订失败:', error);
      const userFriendlyMessage = error.message.includes('JSON') || 
                                  error.message.includes('json') ||
                                  error.message.includes('Unexpected')
                                ? '预订失败，请检查网络连接后重试'
                                : error.message || '预订失败，请稍后重试';
      showToast(userFriendlyMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 获取单元格样式类名
  const getCellStyle = (cellStatus: CellStatus, timeSlot: TimeSlotData): string => {
    if (cellStatus.selected) {
      return 'bg-[#1a5442] text-white border-[#1a5442] shadow-lg cursor-pointer hover:bg-[#236b54] transition-all';
    }
    
    if (cellStatus.sold) {
      return 'bg-gray-500/30 text-gray-400/60 cursor-not-allowed line-through border-gray-500/20';
    }

    switch (timeSlot.priceType) {
      case 'peak':
        return 'bg-yellow-400/25 text-yellow-900 border-yellow-500/30 cursor-pointer hover:bg-yellow-400/35 transition-all';
      case 'offpeak':
        return 'bg-green-400/20 text-green-900 border-green-400/30 cursor-pointer hover:bg-green-400/30 transition-all';
      case 'discount':
        return 'bg-orange-400/30 text-orange-900 border-orange-500/40 cursor-pointer hover:bg-orange-400/40 transition-all';
      default:
        return 'bg-[rgba(210,190,170,0.35)] text-gray-800 border-white/10 cursor-pointer hover:bg-[rgba(210,190,170,0.5)] transition-all';
    }
  };

  // 根据筛选条件过滤显示
  const shouldShowCell = (cellStatus: CellStatus, timeSlot: TimeSlotData): boolean => {
    switch (filterType) {
      case 'selected':
        return cellStatus.selected;
      case 'sold':
        return cellStatus.sold;
      case 'discount':
        return !cellStatus.sold && !cellStatus.selected && timeSlot.priceType === 'discount';
      default:
        return true;
    }
  };

  // 统计信息
  const totalAvailableSlots = courts.length * timeSlots.length;
  const selectedCount = selectedSlots.filter(s => s.date === selectedDate).length;
  const earliestAvailableTime = timeSlots[0]?.startTime || '07:00';

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-dark via-primary to-secondary-light pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/90 text-lg">正在加载场地信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-dark via-primary to-secondary-light pt-16 pb-24">
      {/* 顶部标题区域 */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 text-white pt-8 pb-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">预约场地</h1>
              <p className="text-base text-white/80">选择合适的时段，享受愉快的网球时光</p>
            </div>
            
            {/* GPS定位按钮 */}
            <button
              onClick={requestGeolocation}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-sm border transition-all ${
                locationStatus === 'success'
                  ? 'bg-primary-light/20 border-primary-light/40 text-primary-light'
                  : locationStatus === 'loading'
                  ? 'bg-blue-500/20 border-blue-400/40 text-blue-100'
                  : locationStatus === 'error'
                  ? 'bg-red-500/20 border-red-400/40 text-red-100'
                  : 'bg-white/10 border-white/30 text-white/90 hover:bg-white/15'
              }`}
            >
              {locationStatus === 'success' ? (
                <>
                  <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">已定位</span>
                </>
              ) : locationStatus === 'loading' ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium">定位中...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">未定位</span>
                </>
              )}
            </button>
          </div>

          {/* 定位成功后显示城市信息 */}
          {locationStatus === 'success' && locationInfo?.city && (
            <p className="mt-2 text-sm text-white/70">
              📍 当前位置：{locationInfo.city}
            </p>
          )}
          
          {locationStatus === 'error' && (
            <p className="mt-2 text-xs text-red-200">
              定位失败，点击重试或手动输入城市
            </p>
          )}
        </div>
      </div>

      {/* 日期选择器 */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-16 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            {/* 左箭头 */}
            <button 
              onClick={() => setSelectedDateIndex(Math.max(0, selectedDateIndex - 1))}
              disabled={selectedDateIndex === 0}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* 日期卡片横向滚动容器 */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 min-w-max">
                {dateCards.map((card, index) => (
                  <button
                    key={card.dateStr}
                    onClick={() => setSelectedDateIndex(index)}
                    className={`flex-shrink-0 px-5 py-3 rounded-xl border-2 transition-all transform hover:scale-105 ${
                      selectedDateIndex === index
                        ? 'bg-white/20 border-white/50 text-white shadow-lg scale-105'
                        : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-xs font-medium mb-1 ${
                        card.isToday ? 'text-yellow-300' : card.isTomorrow ? 'text-blue-200' : 'text-white/60'
                      }`}>
                        {card.dayLabel}
                      </div>
                      <div className="text-lg font-bold">{card.displayStr}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 右箭头 */}
            <button 
              onClick={() => setSelectedDateIndex(Math.min(dateCards.length - 1, selectedDateIndex + 1))}
              disabled={selectedDateIndex === dateCards.length - 1}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 天气信息栏 */}
      {weather && (
        <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-4 text-white/90">
              <span className="text-2xl">{weather.icon}</span>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-lg">{weather.temperature}°C</span>
                <span className="text-white/70">{weather.condition}</span>
                {weather.humidity && <span className="text-sm text-white/60">湿度 {weather.humidity}%</span>}
              </div>
              <div className="ml-auto text-sm text-white/60">
                {dateCards[selectedDateIndex]?.dateStr}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 状态筛选标签栏 */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[
                { key: 'all', label: '可预订', count: null },
                { key: 'selected', label: '已选', count: selectedCount },
                { key: 'discount', label: '折扣', count: null },
                { key: 'sold', label: '已售', count: null },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key as typeof filterType)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterType === key
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {label}
                  {count !== null && count > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-400/80 text-gray-900 rounded-full text-xs font-bold">
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 场地统计 */}
            <div className="text-sm text-white/70 hidden sm:block">
              <span className="font-semibold text-white/90">{courts.length}</span> 条场地 | 从{' '}
              <span className="font-semibold text-white/90">{earliestAvailableTime}</span> 可预订
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区：时间表网格 */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
          {/* 时间表网格 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {/* 左上角空白单元格 */}
                  <th className="sticky left-0 bg-[#2d5a4a]/95 backdrop-blur-md p-3 text-white/80 text-sm font-semibold border-r border-b border-white/10 min-w-[80px] z-20">
                    时间
                  </th>
                  
                  {/* 球场列头 */}
                  {courts.map((court) => (
                    <th
                      key={court.id}
                      className="p-3 text-center min-w-[120px] border-r border-b border-white/10"
                    >
                      <div className="text-white font-bold text-sm">{court.name}</div>
                      <div className={`text-xs mt-1 px-2 py-0.5 rounded inline-block ${
                        court.type === 'outdoor' 
                          ? 'bg-sky-400/30 text-sky-100' 
                          : 'bg-purple-400/30 text-purple-100'
                      }`}>
                        {court.type === 'outdoor' ? '室外' : '室内'}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                {timeSlots.map((timeSlot, rowIndex) => (
                  <tr key={timeSlot.startTime} className="group">
                    {/* 时间段行头 */}
                    <td className="sticky left-0 bg-[#2d5a4a]/90 backdrop-blur-md p-2 text-white/90 text-xs font-mono font-semibold border-r border-b border-white/10 z-10">
                      {timeSlot.startTime}-{timeSlot.endTime}
                    </td>
                    
                    {/* 球场单元格 */}
                    {courts.map((court) => {
                      const cellStatus = getCellStatus(court.id, timeSlot.startTime);
                      
                      if (!shouldShowCell(cellStatus, timeSlot)) {
                        return (
                          <td
                            key={`${court.id}-${timeSlot.startTime}`}
                            className="p-1 border-r border-b border-white/5"
                          >
                            <div className="h-14 opacity-0"></div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={`${court.id}-${timeSlot.startTime}`}
                          className="p-1 border-r border-b border-white/5"
                        >
                          <button
                            onClick={() => toggleCellSelection(court, timeSlot)}
                            disabled={cellStatus.sold}
                            className={`w-full h-14 rounded-lg border px-2 py-1 text-center relative overflow-hidden ${getCellStyle(cellStatus, timeSlot)}`}
                          >
                            {/* 价格显示 */}
                            <div className="text-xs font-bold">
                              ¥{cellStatus.price}
                            </div>
                            
                            {/* 价格类型标签 */}
                            {!cellStatus.selected && !cellStatus.sold && timeSlot.priceType !== 'normal' && (
                              <div className={`text-[10px] font-medium mt-0.5 ${
                                timeSlot.priceType === 'peak' ? 'text-yellow-700' :
                                timeSlot.priceType === 'discount' ? 'text-orange-700' : 'text-green-700'
                              }`}>
                                {timeSlot.priceType === 'peak' ? '🔥高峰' : 
                                 timeSlot.priceType === 'discount' ? '🏷️折扣' : '💰优惠'}
                              </div>
                            )}

                            {/* 已选中指示器 */}
                            {cellStatus.selected && (
                              <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            )}

                            {/* 售罄标记 */}
                            {cellStatus.sold && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold">✕</span>
                              </div>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 图例说明 */}
          <div className="border-t border-white/20 p-4 bg-black/10">
            <div className="flex flex-wrap gap-4 justify-center text-xs text-white/70">
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[rgba(210,190,170,0.35)] border border-white/10"></div>
                可预订普通时段
              </span>
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-400/25 border border-yellow-500/30"></div>
                高峰时段
              </span>
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#1a5442] border border-[#1a5442]"></div>
                已选中
              </span>
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-400/30 border border-orange-500/40"></div>
                折扣时段
              </span>
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500/30 border border-gray-500/20"></div>
                已售罄
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 底部固定预订面板 */}
      {selectedSlots.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl z-50">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* 已选时段列表（可折叠） */}
              <div className="flex-1 max-w-2xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">
                    已选 {selectedSlots.length} 个时段
                  </h3>
                  <button
                    onClick={clearAllSelections}
                    className="text-xs text-red-600 hover:text-red-700 font-medium underline"
                  >
                    清空全部
                  </button>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-h-20">
                  {selectedSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 bg-gradient-to-r from-[#F5F5EF] to-[#F0EDE0] border border-secondary-light/30 rounded-lg px-3 py-2 relative group"
                    >
                      <button
                        onClick={() => removeSelectedSlot(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                      >
                        ✕
                      </button>
                      
                      <div className="text-xs font-semibold text-gray-800 pr-4">
                        {slot.courtName}
                      </div>
                      <div className="text-xs text-gray-600">
                        {slot.timeRange}
                      </div>
                      <div className="text-sm font-bold text-primary mt-1">
                        ¥{slot.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 总计和预订按钮 */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <div className="text-xs text-gray-500">总计</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ¥{calculateTotalAmount()}
                  </div>
                </div>
                
                <button
                  onClick={handleBooking}
                  disabled={isSubmitting}
                  className={`px-8 py-3 rounded-xl font-bold text-lg whitespace-nowrap transition-all transform hover:scale-105 active:scale-95 ${
                    isSubmitting
                      ? 'bg-gray-400 text-white cursor-wait'
                      : 'bg-gradient-to-r from-primary to-accent-teal text-white shadow-lg hover:shadow-xl hover:from-primary-light hover:to-accent-teal'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      提交中...
                    </span>
                  ) : (
                    `立即预订 (¥${calculateTotalAmount()})`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 内联样式定义隐藏滚动条 */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

