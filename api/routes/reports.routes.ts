import { Router } from 'express';
import { reportController } from '../controllers/ReportController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../../shared/types';

const router = Router();

router.get('/dashboard', authenticateToken, requireRole(UserRole.DISPATCHER, UserRole.ADMIN), reportController.getDashboardStats);
router.get('/trend', authenticateToken, requireRole(UserRole.DISPATCHER, UserRole.ADMIN), reportController.getTrendData);
router.get('/latest', authenticateToken, requireRole(UserRole.DISPATCHER, UserRole.ADMIN), reportController.getLatest);
router.get('/:id', authenticateToken, requireRole(UserRole.DISPATCHER, UserRole.ADMIN), reportController.getById);
router.get('/:id/download', authenticateToken, requireRole(UserRole.DISPATCHER, UserRole.ADMIN), reportController.downloadReport);
router.get('/', authenticateToken, requireRole(UserRole.DISPATCHER, UserRole.ADMIN), reportController.getByDateRange);
router.post('/generate-daily', authenticateToken, requireRole(UserRole.ADMIN), reportController.generateDailyReport);

export default router;
