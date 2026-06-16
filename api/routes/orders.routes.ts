import { Router } from 'express';
import { orderController } from '../controllers/OrderController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../../shared/types';

const router = Router();

router.get('/', authenticateToken, orderController.getAll);
router.get('/:id', authenticateToken, orderController.getById);
router.get('/no/:orderNo', authenticateToken, orderController.getByOrderNo);
router.get('/:id/receipt', authenticateToken, orderController.getReceipt);
router.get('/:id/receipt/download', authenticateToken, orderController.downloadReceipt);
router.get('/:id/timeline', authenticateToken, orderController.getTimeline);
router.post('/plan-route', authenticateToken, orderController.planRoute);
router.post('/', authenticateToken, requireRole(UserRole.USER, UserRole.ADMIN), orderController.create);
router.put('/:id/cancel', authenticateToken, orderController.cancel);

export default router;
