import { Router } from 'express';
import { notificationController } from '../controllers/NotificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, notificationController.getMyNotifications);
router.get('/unread', authenticateToken, notificationController.getUnread);
router.get('/unread/count', authenticateToken, notificationController.getUnreadCount);
router.put('/:id/read', authenticateToken, notificationController.markAsRead);
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);

export default router;
