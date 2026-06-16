import { notificationRepository } from '../repositories/NotificationRepository';
import { Notification, NotificationType } from '../../shared/types';

export class NotificationService {
  getByUserId(userId: string, limit?: number): Notification[] {
    return notificationRepository.findByUserId(userId, limit);
  }

  getUnreadByUserId(userId: string): Notification[] {
    return notificationRepository.findUnreadByUserId(userId);
  }

  getUnreadCount(userId: string): number {
    return notificationRepository.getUnreadCount(userId);
  }

  create(data: {
    type: NotificationType;
    title: string;
    content: string;
    relatedId?: string;
    relatedType?: string;
    recipientIds: string[];
  }): Notification {
    const notification = notificationRepository.create(data);
    this.broadcast(notification);
    return notification;
  }

  markAsRead(id: string, userId: string): Notification | null {
    return notificationRepository.markAsRead(id, userId);
  }

  markAllAsRead(userId: string): number {
    return notificationRepository.markAllAsRead(userId);
  }

  private broadcast(notification: Notification): void {
    if (globalNotificationCallback) {
      globalNotificationCallback(notification);
    }
  }
}

let globalNotificationCallback: ((notification: Notification) => void) | null = null;

export function setNotificationCallback(callback: (notification: Notification) => void): void {
  globalNotificationCallback = callback;
}

export const notificationService = new NotificationService();
