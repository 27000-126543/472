import { Router } from 'express';
import { userController } from '../controllers/UserController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../../shared/types';

const router = Router();

router.get('/', authenticateToken, requireRole(UserRole.ADMIN), userController.getAll);
router.get('/:id', authenticateToken, requireRole(UserRole.ADMIN), userController.getById);
router.post('/', authenticateToken, requireRole(UserRole.ADMIN), userController.create);
router.put('/:id', authenticateToken, requireRole(UserRole.ADMIN), userController.update);
router.delete('/:id', authenticateToken, requireRole(UserRole.ADMIN), userController.delete);

export default router;
