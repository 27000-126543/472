import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './users.routes.js';
import droneRoutes from './drones.routes.js';
import orderRoutes from './orders.routes.js';
import missionRoutes from './missions.routes.js';
import noFlyZoneRoutes from './no-fly-zones.routes.js';
import notificationRoutes from './notifications.routes.js';
import reportRoutes from './reports.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/drones', droneRoutes);
router.use('/orders', orderRoutes);
router.use('/missions', missionRoutes);
router.use('/no-fly-zones', noFlyZoneRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);

export default router;
