"use client";

import { useState } from 'react';
import { Settings, Save, X, Check, AlertCircle } from 'lucide-react';

interface SettingSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  settings: Setting[];
}

interface Setting {
  id: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  value: string | number | boolean;
  options?: { value: string | number | boolean; label: string }[];
  description?: string;
  required?: boolean;
}

export default function SystemSettings() {
  const [activeSection, setActiveSection] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settings, setSettings] = useState<Record<string, SettingSection>>({
    basic: {
      id: 'basic',
      title: '基本设置',
      icon: <Settings className="w-5 h-5" />,
      settings: [
        {
          id: 'siteName',
          label: '网站名称',
          type: 'text',
          value: 'Tennis Link',
          description: '网站的显示名称',
          required: true
        },
        {
          id: 'siteDescription',
          label: '网站描述',
          type: 'text',
          value: '智能网球学习平台',
          description: '网站的简短描述'
        },
        {
          id: 'maintenanceMode',
          label: '维护模式',
          type: 'boolean',
          value: false,
          description: '开启后网站将进入维护状态'
        }
      ]
    },
    notification: {
      id: 'notification',
      title: '通知设置',
      icon: <Settings className="w-5 h-5" />,
      settings: [
        {
          id: 'emailNotifications',
          label: '邮件通知',
          type: 'boolean',
          value: true,
          description: '是否启用邮件通知'
        },
        {
          id: 'smsNotifications',
          label: '短信通知',
          type: 'boolean',
          value: false,
          description: '是否启用短信通知'
        },
        {
          id: 'pushNotifications',
          label: '推送通知',
          type: 'boolean',
          value: true,
          description: '是否启用应用推送通知'
        }
      ]
    },
    security: {
      id: 'security',
      title: '安全设置',
      icon: <Settings className="w-5 h-5" />,
      settings: [
        {
          id: 'enableRateLimit',
          label: '启用速率限制',
          type: 'boolean',
          value: true,
          description: '限制API请求频率，防止暴力攻击'
        },
        {
          id: 'sessionTimeout',
          label: '会话超时时间',
          type: 'number',
          value: 3600,
          description: '用户会话超时时间（秒）'
        },
        {
          id: 'enableTwoFactor',
          label: '启用两步验证',
          type: 'boolean',
          value: false,
          description: '为用户登录启用两步验证'
        }
      ]
    }
  });

  const handleSettingChange = (sectionId: string, settingId: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        settings: prev[sectionId].settings.map(setting =>
          setting.id === settingId ? { ...setting, value } : setting
        )
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    // 模拟保存操作
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      
      // 3秒后清除成功提示
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">系统设置</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              保存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              保存设置
            </>
          )}
        </button>
      </div>

      {/* 保存成功提示 */}
      {saveSuccess && (
        <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>
          <Check className="w-5 h-5" style={{ color: '#93c5fd' }} />
          <span style={{ color: '#93c5fd' }}>设置保存成功！</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 侧边栏 */}
        <div className="lg:col-span-1">
          <div className="rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <nav className="p-4 space-y-1">
              {Object.values(settings).map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${activeSection === section.id ? '' : ''}`}
                  style={activeSection === section.id
                    ? { background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }
                    : { color: 'rgba(255,255,255,0.7)' }
                  }
                  onMouseEnter={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                    }
                  }}
                >
                  {section.icon}
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 设置内容 */}
        <div className="lg:col-span-3">
          <div className="rounded-lg p-6" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 className="text-xl font-semibold text-white mb-6">{settings[activeSection].title}</h2>

            <div className="space-y-6">
              {settings[activeSection].settings.map(setting => (
                <div key={setting.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={`font-medium ${setting.required ? '' : ''}`} style={{ color: setting.required ? '#f87171' : 'rgba(255,255,255,0.85)' }}>
                      {setting.label}
                      {setting.required && <span className="ml-1">*</span>}
                    </label>
                  </div>

                  {setting.type === 'text' && (
                    <input
                      type="text"
                      value={setting.value as string}
                      onChange={(e) => handleSettingChange(activeSection, setting.id, e.target.value)}
                      className="w-full px-4 py-2 rounded-lg outline-none text-white placeholder-white/40"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)' }}
                      placeholder={setting.description}
                    />
                  )}

                  {setting.type === 'number' && (
                    <input
                      type="number"
                      value={setting.value as number}
                      onChange={(e) => handleSettingChange(activeSection, setting.id, parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 rounded-lg outline-none text-white placeholder-white/40"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)' }}
                      placeholder={setting.description}
                    />
                  )}

                  {setting.type === 'boolean' && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={setting.value as boolean}
                        onChange={(e) => handleSettingChange(activeSection, setting.id, e.target.checked)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: '#3b82f6' }}
                      />
                    </div>
                  )}

                  {setting.type === 'select' && setting.options && (
                    <select
                      value={setting.value as string | number}
                      onChange={(e) => handleSettingChange(activeSection, setting.id, e.target.value)}
                      className="w-full px-4 py-2 rounded-lg outline-none text-white"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                      {setting.options.map(option => (
                        <option key={option.value as string | number} value={option.value as string | number} style={{ color: '#000', background: '#fff' }}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {setting.description && (
                    <p className="text-sm text-white/50">{setting.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
