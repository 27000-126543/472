import { Router } from 'express';
import { missionController } from '../controllers/MissionController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../../shared/types';

const router = Router();

router.get('/', authenticateToken, missionController.getAll);
router.get('/active', authenticateToken, missionController.getActiveMissions);
router.get('/abnormal/unhandled', authenticateToken, requireRole(UserRole.DISPATCHER, UserRole.ADMIN), missionController.getAllUnhandledAbnormalEvents);
router.get('/:id', authenticateToken, missionController.getById);
router.get('/:id/telemetry', authenticateToken, missionController.getTelemetry);
router.get('/:id/telemetry/latest', authenticateToken, missionController.getLatestTelemetry);
router.get('/:id/abnormal', authenticateToken, missionController.getAbnormalEvents);
router.get('/:id/summary', authenticateToken, missionController.getMissionSummary);
router.get('/:id/simulation', authenticateToken, missionController.getSimulationState);
router.get('/:id/playback', authenticateToken, requireRole(UserRole.DISPATCHER, UserRole.ADMIN), missionController.getMissionPlaybackData);
router.get('/:id/playback/export', authenticateToken, requireRole(UserRole.DISPATCHER, UserRole.ADMIN), missionController.exportPlaybackData);
router.get('/:id/available-drones', authenticateToken, requireRole(UserRole.DISPATCHER, UserRole.ADMIN), missionController.getAvailableDronesForReassignment);
router.put('/:id/start', authenticateToken, requireRole(UserRole.OPERATOR, UserRole.ADMIN), missionController.startMission);
router.put('/:id/takeoff', authenticateToken, requireRole(UserRole.OPERATOR, UserRole.ADMIN), missionController.takeoff);
router.put('/:id/return', authenticateToken, requireRole(UserRole.OPERATOR, UserRole.ADMIN), missionController.startReturn);
router.put('/:id/abort', authenticateToken, requireRole(UserRole.OPERATOR, UserRole.DISPATCHER, UserRole.ADMIN), missionController.abortMission);
router.put('/:id/photo', authenticateToken, requireRole(UserRole.OPERATOR, UserRole.ADMIN), missionController.recordPhoto);
router.put('/:id/confirm-receipt', authenticateToken, requireRole(UserRole.OPERATOR, UserRole.ADMIN), missionController.confirmReceipt);
router.put('/:id/reassign', authenticateToken, requireRole(UserRole.DISPATCHER, UserRole.ADMIN), missionController.reassignMission);
router.put('/abnormal/:id/handle', authenticateToken, requireRole(UserRole.DISPATCHER, UserRole.ADMIN), missionController.handleAbnormalEvent);

export default router;
