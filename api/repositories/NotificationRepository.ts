import { BaseRepository } from './BaseRepository';
import { Notification, NotificationType } from '../../shared/types';
import { queryOne, queryMany, execute } from '../database';
import { generateId } from '../utils/helpers';

interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  related_id?: string;
  related_type?: string;
  recipient_ids: string;
  read_by: string;
  created_at: string;
}

export class NotificationRepository extends BaseRepository<Notification> {
  protected tableName = 'notifications';

  protected mapRow(row: NotificationRow): Notification {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content,
      relatedId: row.related_id,
      relatedType: row.related_type,
      recipientIds: JSON.parse(row.recipient_ids),
      readBy: JSON.parse(row.read_by),
      createdAt: row.created_at
    };
  }

  findByUserId(userId: string, limit: number = 50): Notification[] {
    const sql = `
      SELECT * FROM notifications 
      WHERE recipient_ids LIKE ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    const rows = queryMany<NotificationRow>(sql, [`%${userId}%`, limit]);
    return rows
      .map(row => this.mapRow(row))
      .filter(n => n.recipientIds.includes(userId));
  }

  findUnreadByUserId(userId: string): Notification[] {
    const all = this.findByUserId(userId, 100);
    return all.filter(n => !n.readBy.includes(userId));
  }

  create(data: {
    type: NotificationType;
    title: string;
    content: string;
    relatedId?: string;
    relatedType?: string;
    recipientIds: string[];
  }): Notification {
    const id = generateId('notif');
    const sql = `
      INSERT INTO notifications (id, type, title, content, related_id, related_type, recipient_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    execute(sql, [
      id, data.type, data.title, data.content,
      data.relatedId || null, data.relatedType || null,
      JSON.stringify(data.recipientIds)
    ]);
    return this.findById(id)!;
  }

  markAsRead(id: string, userId: string): Notification | null {
    const notification = this.findById(id);
    if (!notification) return null;

    const readBy = notification.readBy.includes(userId)
      ? notification.readBy
      : [...notification.readBy, userId];

    const sql = `UPDATE notifications SET read_by = ? WHERE id = ?`;
    execute(sql, [JSON.stringify(readBy), id]);
    return this.findById(id);
  }

  markAllAsRead(userId: string): number {
    const notifications = this.findUnreadByUserId(userId);
    notifications.forEach(n => this.markAsRead(n.id, userId));
    return notifications.length;
  }

  getUnreadCount(userId: string): number {
    return this.findUnreadByUserId(userId).length;
  }
}

export const notificationRepository = new NotificationRepository();
