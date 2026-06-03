'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Coach {
  id: string;
  userId: string;
  status: string;
  experienceYears: number;
  certifications: string[];
  specialties: string[];
  teachingStyle: string;
  teachingAreas: string[];
  hourlyRate: string;
  totalLessons: number;
  averageRating: string;
  reviewCount: number;
  availableDays: number[];
  availableTimeSlots: string[];
  bankInfo: any;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
}

export default function CoachProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  
  // 编辑资料状态
  const [editData, setEditData] = useState<{
    experienceYears: number;
    certifications: (string | { id: string; type: string; fileName: string; url: string; uploadTime: string; status: string })[];
    specialties: string[];
    teachingStyle: string;
    introduction: string;
    teachingAreas: string[];
    hourlyRate: string;
    availableDays: number[];
    newCertification: string;
    newSpecialty: string;
    newTeachingArea: string;
  }>({
    experienceYears: 0,
    certifications: [],
    specialties: [],
    teachingStyle: '',
    introduction: '',
    teachingAreas: [],
    hourlyRate: '',
    availableDays: [],
    newCertification: '',
    newSpecialty: '',
    newTeachingArea: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // 获取用户和教练信息
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 获取用户信息
      const userResponse = await fetch('/api/user/profile');
      const userData = await userResponse.json();
      
      if (!userData.success) {
        if (userResponse.status === 401) {
          router.push('/login');
        } else {
          throw new Error(userData.error || '获取用户信息失败');
        }
        return;
      }
      
      setUser(userData.data);
      
      // 检查是否为教练角色
      if (userData.data.role !== 'coach') {
        router.push('/profile');
        return;
      }
      
      // 获取教练信息
      const coachResponse = await fetch(`/api/coaches?userId=${userData.data.id}`);
      const coachData = await coachResponse.json();
      
      if (coachData.success && coachData.data.length > 0) {
        const coachInfo = coachData.data[0];
        setCoach(coachInfo);
        setEditData({
          experienceYears: coachInfo.experienceYears,
          certifications: coachInfo.certifications || [],
          specialties: coachInfo.specialties || [],
          teachingStyle: coachInfo.teachingStyle || '',
          introduction: (coachInfo as any).introduction || '',
          teachingAreas: coachInfo.teachingAreas || [],
          hourlyRate: coachInfo.hourlyRate || '',
          availableDays: coachInfo.availableDays || [],
          newCertification: '',
          newSpecialty: '',
          newTeachingArea: '',
        });
      }
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 添加证书
  const handleAddCertification = () => {
    if (editData.newCertification.trim()) {
      setEditData(prev => ({
        ...prev,
        certifications: [...prev.certifications, prev.newCertification.trim()],
        newCertification: '',
      }));
    }
  };
  
  // 删除证书
  const handleRemoveCertification = (index: number) => {
    setEditData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };
  
  // 添加专长
  const handleAddSpecialty = () => {
    if (editData.newSpecialty.trim()) {
      setEditData(prev => ({
        ...prev,
        specialties: [...prev.specialties, prev.newSpecialty.trim()],
        newSpecialty: '',
      }));
    }
  };
  
  // 删除专长
  const handleRemoveSpecialty = (index: number) => {
    setEditData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }));
  };
  
  // 添加教学区域
  const handleAddTeachingArea = () => {
    if (editData.newTeachingArea.trim()) {
      setEditData(prev => ({
        ...prev,
        teachingAreas: [...prev.teachingAreas, prev.newTeachingArea.trim()],
        newTeachingArea: '',
      }));
    }
  };
  
  // 删除教学区域
  const handleRemoveTeachingArea = (index: number) => {
    setEditData(prev => ({
      ...prev,
      teachingAreas: prev.teachingAreas.filter((_, i) => i !== index),
    }));
  };
  
  // 切换可用日期
  const toggleAvailableDay = (day: number) => {
    setEditData(prev => {
      if (prev.availableDays.includes(day)) {
        return {
          ...prev,
          availableDays: prev.availableDays.filter(d => d !== day),
        };
      } else {
        return {
          ...prev,
          availableDays: [...prev.availableDays, day].sort(),
        };
      }
    });
  };
  
  // 保存教练资料
  const handleSave = async () => {
    if (!coach) return;
    
    try {
      setSaving(true);
      setError('');
      
      const response = await fetch(`/api/coaches/${coach.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceYears: editData.experienceYears,
          certifications: editData.certifications,
          specialties: editData.specialties,
          teachingStyle: editData.teachingStyle,
          teachingAreas: editData.teachingAreas,
          hourlyRate: editData.hourlyRate,
          availableDays: editData.availableDays,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCoach(data.data);
        setEditing(false);
      } else {
        setError(data.error || '保存失败');
      }
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };
  
  // 上传证书
  const handleUploadCertification = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('type', 'professional'); // 默认为专业证书，实际应该从UI选择
      
      // 获取用户openid（实际应该从auth context获取）
      const userOpenid = 'demo_openid'; // 临时值，实际应该从认证状态获取
      formData.append('openid', userOpenid);
      
      const response = await fetch('/api/upload/certification', {
        method: 'POST',
        headers: {
          'x-user-openid': userOpenid,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 将上传的证书信息添加到列表中
        setEditData(prev => ({
          ...prev,
          certifications: [...prev.certifications, {
            id: data.key,
            type: data.type,
            fileName: data.fileName,
            url: data.url,
            uploadTime: new Date().toISOString(),
            status: 'pending_review'
          }],
        }));
      } else {
        setError(data.error || '上传失败');
      }
    } catch (err: any) {
      setError(err.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 重新提交审核
  const handleResubmitReview = async () => {
    try {
      setSaving(true);
      setError('');

      // 获取用户openid（实际应该从auth context获取）
      const userOpenid = 'demo_openid'; // 临时值，实际应该从认证状态获取

      const response = await fetch('/api/coach/resubmit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openid: userOpenid,
          certifications: editData.certifications,
          specialties: editData.specialties,
          introduction: editData.introduction,
          hourlyRate: editData.hourlyRate,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 刷新页面数据
        window.location.reload();
      } else {
        setError(data.error || '重新提交失败');
      }
    } catch (err: any) {
      setError(err.message || '重新提交失败');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !coach) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || '未登录或不是教练角色'}</p>
          <Link href="/login" className="text-blue-600 hover:text-blue-700">
            返回登录
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">教练资质管理</h1>
              <p className="text-gray-600 mt-1">完善您的教练资质信息，提升学员信任度</p>
            </div>
            <div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${coach.status === 'approved' ? 'bg-blue-100 text-blue-800' : coach.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                {coach.status === 'approved' ? '已通过' : coach.status === 'pending' ? '待审核' : '已拒绝'}
              </span>
            </div>
          </div>
        </div>
        
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {/* 教练资料 */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {!editing ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">资质信息</h2>
                <button
                  onClick={() => {
                    setEditing(true);
                    setEditData({
                      experienceYears: coach.experienceYears,
                      certifications: coach.certifications,
                      specialties: coach.specialties,
                      teachingStyle: coach.teachingStyle,
                      introduction: (coach as any).introduction || '',
                      teachingAreas: coach.teachingAreas,
                      hourlyRate: coach.hourlyRate,
                      availableDays: coach.availableDays,
                      newCertification: '',
                      newSpecialty: '',
                      newTeachingArea: '',
                    });
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  编辑资料
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* 教学年限 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">教学年限</h3>
                  <p className="font-semibold">{coach.experienceYears} 年</p>
                </div>
                
                {/* 每小时费用 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">每小时费用</h3>
                  <p className="font-semibold">¥{coach.hourlyRate} / 小时</p>
                </div>
                
                {/* 证书 */}
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">资质证书</h3>
                  <div className="flex flex-wrap gap-2">
                    {coach.certifications.length > 0 ? (
                      coach.certifications.map((cert, index) => (
                        <span key={index} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                          {cert}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">暂无证书</p>
                    )}
                  </div>
                </div>
                
                {/* 教学特长 */}
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">教学特长</h3>
                  <div className="flex flex-wrap gap-2">
                    {coach.specialties.length > 0 ? (
                      coach.specialties.map((specialty, index) => (
                        <span key={index} className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg">
                          {specialty}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">暂无特长</p>
                    )}
                  </div>
                </div>
                
                {/* 教学风格 */}
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">教学风格</h3>
                  <p className="text-gray-700">{coach.teachingStyle || '暂无描述'}</p>
                </div>
                
                {/* 教学区域 */}
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">教学区域</h3>
                  <div className="flex flex-wrap gap-2">
                    {coach.teachingAreas.length > 0 ? (
                      coach.teachingAreas.map((area, index) => (
                        <span key={index} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                          {area}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">暂无教学区域</p>
                    )}
                  </div>
                </div>
                
                {/* 可用日期 */}
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">可用日期</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { day: 1, name: '周一' },
                      { day: 2, name: '周二' },
                      { day: 3, name: '周三' },
                      { day: 4, name: '周四' },
                      { day: 5, name: '周五' },
                      { day: 6, name: '周六' },
                      { day: 7, name: '周日' },
                    ].map(item => (
                      <span
                        key={item.day}
                        className={`px-4 py-2 rounded-lg font-medium ${coach.availableDays.includes(item.day) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t">
                <h2 className="text-xl font-bold text-gray-900 mb-4">审核提示</h2>
                <p className="text-gray-700 mb-4">
                  {coach.status === 'pending' ? 
                    '您的教练资质正在审核中，审核通过后即可开始接单。' :
                    coach.status === 'approved' ?
                    '您的教练资质已通过审核，可以开始接单了！' :
                    '您的教练资质未通过审核，请完善您的资质信息后重新提交审核。'}
                </p>
                {coach.status === 'rejected' && (
                  <button
                    onClick={handleResubmitReview}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    重新提交审核
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">编辑资质信息</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* 教学年限 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    教学年限
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={editData.experienceYears}
                    onChange={(e) => setEditData(prev => ({ ...prev, experienceYears: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                
                {/* 每小时费用 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    每小时费用（元）
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editData.hourlyRate}
                    onChange={(e) => setEditData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                
                {/* 资质证书 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    资质证书
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {editData.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                        <span>{typeof cert === 'string' ? cert : cert.fileName}</span>
                        <button
                          onClick={() => handleRemoveCertification(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* 添加证书 */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="证书名称"
                      value={editData.newCertification}
                      onChange={(e) => setEditData(prev => ({ ...prev, newCertification: e.target.value }))}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <button
                      onClick={handleAddCertification}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      添加
                    </button>
                  </div>
                  
                  {/* 上传证书文件 */}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleUploadCertification}
                      disabled={uploading}
                      className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {uploading && <span className="text-sm text-gray-500">上传中...</span>}
                  </div>
                </div>
                
                {/* 教学特长 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    教学特长
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {editData.specialties.map((specialty, index) => (
                      <div key={index} className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg">
                        <span>{specialty}</span>
                        <button
                          onClick={() => handleRemoveSpecialty(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* 添加特长 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="教学特长（如：发球技术）"
                      value={editData.newSpecialty}
                      onChange={(e) => setEditData(prev => ({ ...prev, newSpecialty: e.target.value }))}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <button
                      onClick={handleAddSpecialty}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      添加
                    </button>
                  </div>
                </div>
                
                {/* 教学风格 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    教学风格
                  </label>
                  <textarea
                    placeholder="请描述您的教学风格..."
                    value={editData.teachingStyle}
                    onChange={(e) => setEditData(prev => ({ ...prev, teachingStyle: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                
                {/* 教学区域 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    教学区域
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {editData.teachingAreas.map((area, index) => (
                      <div key={index} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                        <span>{area}</span>
                        <button
                          onClick={() => handleRemoveTeachingArea(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* 添加教学区域 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="教学区域（如：朝阳区）"
                      value={editData.newTeachingArea}
                      onChange={(e) => setEditData(prev => ({ ...prev, newTeachingArea: e.target.value }))}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <button
                      onClick={handleAddTeachingArea}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      添加
                    </button>
                  </div>
                </div>
                
                {/* 可用日期 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    可用日期
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { day: 1, name: '周一' },
                      { day: 2, name: '周二' },
                      { day: 3, name: '周三' },
                      { day: 4, name: '周四' },
                      { day: 5, name: '周五' },
                      { day: 6, name: '周六' },
                      { day: 7, name: '周日' },
                    ].map(item => (
                      <button
                        key={item.day}
                        onClick={() => toggleAvailableDay(item.day)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${editData.availableDays.includes(item.day) ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-blue-50'}`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 pt-6 border-t">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
