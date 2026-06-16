import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/logout', authenticateToken, authController.logout);

export default router;
