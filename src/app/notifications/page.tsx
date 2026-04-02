"use client";

import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/notifications/client';
import { Notification } from '@/storage/database/shared/schema';
import { Bell, Check, Trash2, ChevronDown, Filter, X, AlertCircle, Calendar, Star, Users, Trophy, CreditCard, Crown } from 'lucide-react';

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [filter, typeFilter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? undefined : filter;
      const data = await getNotifications({ 
        status, 
        type: typeFilter,
        limit: 50 
      });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, status: 'read' } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // 如果被删除的是未读通知，更新未读计数
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification?.status === 'unread') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'booking':
        return <Calendar className="h-5 w-5 text-green-500" />;
      case 'coach_review':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'matchup':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'tournament':
        return <Trophy className="h-5 w-5 text-orange-500" />;
      case 'payment':
        return <CreditCard className="h-5 w-5 text-emerald-500" />;
      case 'vip':
        return <Crown className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'system':
        return '系统通知';
      case 'booking':
        return '预约通知';
      case 'coach_review':
        return '评价通知';
      case 'matchup':
        return '约球通知';
      case 'tournament':
        return '赛事通知';
      case 'payment':
        return '支付通知';
      case 'vip':
        return '会员通知';
      default:
        return '通知';
    }
  };

  const formatNotificationDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">通知中心</h1>
          <p className="text-gray-600 mt-2">查看和管理您的系统通知</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              全部标为已读
            </button>
          )}
          
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              筛选
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-10">
                <button
                  onClick={() => {
                    setFilter('all');
                    setShowFilterMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  全部通知
                </button>
                <button
                  onClick={() => {
                    setFilter('unread');
                    setShowFilterMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  未读通知
                </button>
                <button
                  onClick={() => {
                    setFilter('read');
                    setShowFilterMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  已读通知
                </button>
                <button
                  onClick={() => {
                    setTypeFilter(null);
                    setShowFilterMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  全部类型
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {unreadCount > 0 && (
        <div className="mb-6">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            您有 {unreadCount} 条未读通知
          </span>
        </div>
      )}

      <div className="max-h-[70vh] overflow-y-auto">
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Bell className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无通知</h3>
              <p className="text-gray-600">当有新的系统通知时，它们会显示在这里</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-md shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${notification.status === 'unread' ? 'border-l-4 border-blue-500 bg-blue-50/50' : ''}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 truncate">{notification.title}</h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                            {getNotificationTypeLabel(notification.type)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formatNotificationDate(notification.createdAt)}
                          </span>
                          
                          <div className="relative">
                            <button
                              className="p-1 hover:bg-gray-100 rounded-full"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mt-2 line-clamp-2">{notification.message || '通知内容'}</p>
                      
                      {notification.actionUrl && (
                        <div className="mt-3">
                          <a
                            href={notification.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            查看详情
                          </a>
                        </div>
                      )}
                      
                      <div className="mt-3 flex gap-2">
                        {notification.status === 'unread' && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          >
                            标为已读
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        >
                          删除通知
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
          <p>显示 {notifications.length} 条通知</p>
          <button
            onClick={() => {
              setFilter('all');
              setTypeFilter(null);
            }}
            className="flex items-center gap-1 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
            清除筛选
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;