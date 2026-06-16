import { create } from 'zustand';
import { Notification } from '../../shared/types';
import { notificationApi } from '../lib/api';
import { wsClient } from '../lib/websocket';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (limit?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  subscribeToNotifications: (callback: (notification: Notification) => void) => () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (limit?: number) => {
    set({ isLoading: true });
    try {
      const response = await notificationApi.getAll(limit);
      if (response.success) {
        set({ notifications: response.data || [], isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      if (response.success && response.data) {
        set({ unreadCount: response.data.count });
      }
    } catch (e) {
      console.error('获取未读数量失败:', e);
    }
  },

  markAsRead: async (id: string) => {
    try {
      const response = await notificationApi.markAsRead(id);
      if (response.success) {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await notificationApi.markAllAsRead();
      if (response.success) {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  subscribeToNotifications: (callback) => {
    return wsClient.onNotification((notification) => {
      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
      callback(notification);
    });
  },
}));
