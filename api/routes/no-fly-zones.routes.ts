import { Router } from 'express';
import { noFlyZoneController } from '../controllers/NoFlyZoneController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../../shared/types';

const router = Router();

router.get('/', authenticateToken, noFlyZoneController.getAll);
router.get('/check-point', authenticateToken, noFlyZoneController.checkPoint);
router.get('/affected-missions', authenticateToken, requireRole(UserRole.DISPATCHER, UserRole.ADMIN), noFlyZoneController.getAffectedMissions);
router.get('/:id', authenticateToken, noFlyZoneController.getById);
router.post('/validate-route', authenticateToken, noFlyZoneController.validateRoute);
router.post('/preview-impact', authenticateToken, requireRole(UserRole.DISPATCHER, UserRole.ADMIN), noFlyZoneController.previewImpact);
router.post('/', authenticateToken, requireRole(UserRole.ADMIN), noFlyZoneController.create);
router.put('/:id', authenticateToken, requireRole(UserRole.ADMIN), noFlyZoneController.update);
router.put('/:id/toggle-active', authenticateToken, requireRole(UserRole.ADMIN), noFlyZoneController.toggleActive);
router.delete('/:id', authenticateToken, requireRole(UserRole.ADMIN), noFlyZoneController.delete);

export default router;
