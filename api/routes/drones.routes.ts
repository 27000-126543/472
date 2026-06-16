import { Router } from 'express';
import { droneController } from '../controllers/DroneController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../../shared/types';

const router = Router();

router.get('/', authenticateToken, droneController.getAll);
router.get('/status-count', authenticateToken, droneController.getStatusCount);
router.get('/available', authenticateToken, droneController.getAvailableForPayload);
router.get('/:id', authenticateToken, droneController.getById);
router.get('/:id/realtime', authenticateToken, droneController.getRealTimeStatus);
router.post('/', authenticateToken, requireRole(UserRole.ADMIN), droneController.create);
router.put('/:id', authenticateToken, requireRole(UserRole.ADMIN), droneController.update);
router.put('/:id/status', authenticateToken, requireRole(UserRole.ADMIN, UserRole.OPERATOR), droneController.updateStatus);
router.delete('/:id', authenticateToken, requireRole(UserRole.ADMIN), droneController.delete);

export default router;
