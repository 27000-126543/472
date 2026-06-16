import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { notificationService } from '../services/NotificationService';

export class NotificationController {
  async getMyNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { limit } = req.query;

      const notifications = notificationService.getByUserId(
        userId,
        limit ? parseInt(limit as string) : undefined
      );

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('[NotificationController] GetMyNotifications error:', error);
      res.status(500).json({
        success: false,
        message: '获取通知列表失败'
      });
    }
  }

  async getUnread(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const notifications = notificationService.getUnreadByUserId(userId);

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('[NotificationController] GetUnread error:', error);
      res.status(500).json({
        success: false,
        message: '获取未读通知失败'
      });
    }
  }

  async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const count = notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('[NotificationController] GetUnreadCount error:', error);
      res.status(500).json({
        success: false,
        message: '获取未读通知数量失败'
      });
    }
  }

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const notification = notificationService.markAsRead(id, userId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: '通知不存在'
        });
      }

      res.json({
        success: true,
        data: notification,
        message: '通知已标记为已读'
      });
    } catch (error) {
      console.error('[NotificationController] MarkAsRead error:', error);
      res.status(500).json({
        success: false,
        message: '标记已读失败'
      });
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const count = notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        data: { count },
        message: `已标记 ${count} 条通知为已读`
      });
    } catch (error) {
      console.error('[NotificationController] MarkAllAsRead error:', error);
      res.status(500).json({
        success: false,
        message: '批量标记已读失败'
      });
    }
  }
}

export const notificationController = new NotificationController();
