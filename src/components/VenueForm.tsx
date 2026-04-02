'use client';

import { useState, useEffect } from 'react';
import { X, Upload, MapPin } from 'lucide-react';

interface VenueFormData {
  name: string;
  type: 'indoor' | 'outdoor' | 'mixed';
  address: string;
  city: string;
  district: string;
  phone: string;
  facilities: string[];
  description: string;
  operatingHours: {
    open: string;
    close: string;
  };
  pricing: {
    hourlyRate: number;
    peakHourRate: number;
  };
  images: string[];
}

interface VenueFormProps {
  venue?: any;
  onSubmit: (data: VenueFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const FACILITY_OPTIONS = [
  '停车场', '更衣室', '淋浴', '餐厅', '商店', '租赁服务', 
  '灯光设备', '观众席', '空调', 'WiFi', '储物柜'
];

const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安'];
const DISTRICTS = {
  '北京': ['朝阳区', '海淀区', '东城区', '西城区', '丰台区', '石景山区'],
  '上海': ['浦东新区', '黄浦区', '徐汇区', '长宁区', '静安区', '普陀区'],
  '广州': ['天河区', '越秀区', '海珠区', '荔湾区', '白云区', '黄埔区'],
  '深圳': ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区', '龙华区'],
  '杭州': ['西湖区', '上城区', '下城区', '江干区', '拱墅区', '滨江区'],
  '成都': ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '龙泉驿区'],
  '武汉': ['武昌区', '洪山区', '江汉区', '江岸区', '硚口区', '汉阳区'],
  '西安': ['雁塔区', '碑林区', '莲湖区', '新城区', '未央区', '灞桥区'],
};

export default function VenueForm({ venue, onSubmit, onCancel, loading = false }: VenueFormProps) {
  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    type: 'indoor',
    address: '',
    city: '北京',
    district: '朝阳区',
    phone: '',
    facilities: [],
    description: '',
    operatingHours: {
      open: '06:00',
      close: '22:00',
    },
    pricing: {
      hourlyRate: 100,
      peakHourRate: 150,
    },
    images: [],
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);

  useEffect(() => {
    if (venue) {
      setFormData({
        name: venue.name || '',
        type: venue.type || 'indoor',
        address: venue.address || '',
        city: venue.city || '北京',
        district: venue.district || '朝阳区',
        phone: venue.phone || '',
        facilities: venue.facilities || [],
        description: venue.description || '',
        operatingHours: {
          open: venue.operatingHours?.open || '06:00',
          close: venue.operatingHours?.close || '22:00',
        },
        pricing: {
          hourlyRate: venue.pricing?.hourlyRate || 100,
          peakHourRate: venue.pricing?.peakHourRate || 150,
        },
        images: venue.images || [],
      });
    }
  }, [venue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 处理图片上传
    let imageUrls = formData.images;
    if (imageFiles.length > 0) {
      const uploadPromises = imageFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'venue');
        formData.append('isPublic', 'true');
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        if (data.success) {
          return data.url;
        } else {
          throw new Error(data.error || '上传失败');
        }
      });

      try {
        const uploadedUrls = await Promise.all(uploadPromises);
        imageUrls = [...imageUrls, ...uploadedUrls];
      } catch (error) {
        console.error('图片上传失败:', error);
        // 可以选择是否阻止表单提交
        // return;
      }
    }
    
    await onSubmit({
      ...formData,
      images: imageUrls,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: string | number) => {
    setFormData(prev => {
      const parentValue = prev[parent as keyof typeof prev];
      const existingData = typeof parentValue === 'object' && parentValue !== null ? parentValue : {};
      return {
        ...prev,
        [parent]: {
          ...(existingData as Record<string, any>),
          [field]: value,
        },
      };
    });
  };

  const handleFacilityToggle = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility],
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(prev => [...prev, ...files]);
    
    // 创建预览URL
    const newImages = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {venue ? '编辑场地' : '新增场地'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  场地名称 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  场地类型 *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="indoor">室内</option>
                  <option value="outdoor">室外</option>
                  <option value="mixed">混合</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  联系电话
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* 地址信息 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  城市 *
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  区域 *
                </label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {(DISTRICTS[formData.city as keyof typeof DISTRICTS] || []).map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  详细地址 *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* 设施 */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              场地设施
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FACILITY_OPTIONS.map(facility => (
                <label
                  key={facility}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.facilities.includes(facility)}
                    onChange={() => handleFacilityToggle(facility)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{facility}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 营业时间 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                营业时间
              </label>
              <div className="flex space-x-2">
                <input
                  type="time"
                  value={formData.operatingHours.open}
                  onChange={(e) => handleNestedInputChange('operatingHours', 'open', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="self-center">至</span>
                <input
                  type="time"
                  value={formData.operatingHours.close}
                  onChange={(e) => handleNestedInputChange('operatingHours', 'close', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* 价格 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                价格（元/小时）
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={formData.pricing.hourlyRate}
                  onChange={(e) => handleNestedInputChange('pricing', 'hourlyRate', parseInt(e.target.value) || 0)}
                  placeholder="平时"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="number"
                  value={formData.pricing.peakHourRate}
                  onChange={(e) => handleNestedInputChange('pricing', 'peakHourRate', parseInt(e.target.value) || 0)}
                  placeholder="高峰"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* 描述 */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              场地描述
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="请输入场地详细描述..."
            />
          </div>

          {/* 图片上传 */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              场地图片
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  点击上传图片或拖拽至此处
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  支持 JPG、PNG 格式，单个文件不超过 5MB
                </span>
              </label>
            </div>

            {/* 图片预览 */}
            {formData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`场地图片 ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 按钮 */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '保存中...' : (venue ? '更新' : '创建')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}