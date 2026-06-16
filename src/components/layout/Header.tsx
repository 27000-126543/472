import { Bell, Menu, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useState, useEffect, useRef } from 'react';
import { formatDate, ROUTES } from '../../lib/constants';
import { useNavigate } from 'react-router-dom';
import { UserRole, NotificationType } from '../../../shared/types';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar, toggleNotificationPanel, notificationPanelOpen } = useUIStore();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (notificationPanelOpen && unreadCount > 0) {
      fetchNotifications(20);
    }
  }, [notificationPanelOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-md border-b border-dark-700">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-dark-800 transition-colors"
          >
            <Menu className="w-5 h-5 text-dark-300" />
          </button>
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-white">
              {user?.role === UserRole.USER && '用户中心'}
              {user?.role === UserRole.OPERATOR && '操作员中心'}
              {user?.role === UserRole.DISPATCHER && '调度中心'}
              {user?.role === UserRole.ADMIN && '管理中心'}
            </h2>
            <p className="text-xs text-dark-400">
              {new Date().toLocaleDateString('zh-CN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={toggleNotificationPanel}
              className="relative p-2 rounded-lg hover:bg-dark-800 transition-colors"
            >
              <Bell className="w-5 h-5 text-dark-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {notificationPanelOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
                  <h3 className="font-semibold text-white">通知中心</h3>
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-400 hover:text-primary-300"
                  >
                    全部已读
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-dark-400">
                      暂无通知
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const isRead = notification.readBy?.includes(user?.id || '') || notification.isRead;
                      return (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`px-4 py-3 border-b border-dark-700/50 cursor-pointer hover:bg-dark-800 transition-colors ${
                            !isRead ? 'bg-dark-800/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-2 h-2 mt-2 rounded-full ${
                                notification.type === NotificationType.FLIGHT_ABNORMAL
                                  ? 'bg-danger'
                                  : notification.type === NotificationType.MISSION_COMPLETED
                                  ? 'bg-success'
                                  : 'bg-primary-500'
                              }`}
                            />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm">
                              {notification.title}
                            </p>
                            <p className="text-xs text-dark-400 mt-1 line-clamp-2">
                              {notification.content}
                            </p>
                            <p className="text-xs text-dark-500 mt-1">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-800 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm text-dark-200">
                {user?.username}
              </span>
              <ChevronDown className="w-4 h-4 text-dark-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-dark-800 transition-colors text-danger"
                >
                  <LogOut className="w-4 h-4" />
                  <span>退出登录</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
