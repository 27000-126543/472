import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { missionService } from '../services/MissionService';
import { droneSimulatorService } from '../services/DroneSimulatorService';
import { MissionStatus } from '../../shared/types';

export class MissionController {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const { status } = req.query;
      const operatorId = req.user?.role === 'operator' ? req.user.id : undefined;
      const missions = missionService.getAll(status as MissionStatus, operatorId);

      res.json({
        success: true,
        data: missions
      });
    } catch (error) {
      console.error('[MissionController] GetAll error:', error);
      res.status(500).json({
        success: false,
        message: '获取任务列表失败'
      });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const mission = missionService.getById(id);

      if (!mission) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      if (req.user?.role === 'operator' && mission.operatorId && mission.operatorId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: '无权访问此任务'
        });
      }

      res.json({
        success: true,
        data: mission
      });
    } catch (error) {
      console.error('[MissionController] GetById error:', error);
      res.status(500).json({
        success: false,
        message: '获取任务信息失败'
      });
    }
  }

  async getActiveMissions(req: AuthRequest, res: Response) {
    try {
      const missions = missionService.getActiveMissions();
      res.json({
        success: true,
        data: missions
      });
    } catch (error) {
      console.error('[MissionController] GetActiveMissions error:', error);
      res.status(500).json({
        success: false,
        message: '获取活跃任务失败'
      });
    }
  }

  async startMission(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const operatorId = req.user!.id;

      const mission = missionService.startMission(id, operatorId);

      if (!mission) {
        return res.status(404).json({
          success: false,
          message: '任务不存在或无法启动'
        });
      }

      res.json({
        success: true,
        data: mission,
        message: '任务已启动'
      });
    } catch (error: any) {
      console.error('[MissionController] StartMission error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '启动任务失败'
      });
    }
  }

  async takeoff(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const mission = missionService.takeoff(id);
      if (!mission) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      droneSimulatorService.startSimulation(id);

      res.json({
        success: true,
        data: mission,
        message: '无人机已起飞'
      });
    } catch (error: any) {
      console.error('[MissionController] Takeoff error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '起飞失败'
      });
    }
  }

  async startReturn(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const mission = missionService.startReturn(id);

      if (!mission) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      res.json({
        success: true,
        data: mission,
        message: '无人机正在返航'
      });
    } catch (error: any) {
      console.error('[MissionController] StartReturn error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '返航失败'
      });
    }
  }

  async abortMission(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const handlerId = req.user!.id;

      const mission = missionService.abortMission(id, handlerId);
      if (!mission) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      droneSimulatorService.stopSimulation(id);

      res.json({
        success: true,
        data: mission,
        message: '任务已紧急终止'
      });
    } catch (error: any) {
      console.error('[MissionController] AbortMission error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '终止任务失败'
      });
    }
  }

  async getTelemetry(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { limit } = req.query;

      const telemetry = missionService.getTelemetry(id, limit ? parseInt(limit as string) : undefined);

      res.json({
        success: true,
        data: telemetry
      });
    } catch (error) {
      console.error('[MissionController] GetTelemetry error:', error);
      res.status(500).json({
        success: false,
        message: '获取遥测数据失败'
      });
    }
  }

  async getLatestTelemetry(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const telemetry = missionService.getLatestTelemetry(id);

      res.json({
        success: true,
        data: telemetry
      });
    } catch (error) {
      console.error('[MissionController] GetLatestTelemetry error:', error);
      res.status(500).json({
        success: false,
        message: '获取最新遥测数据失败'
      });
    }
  }

  async getAbnormalEvents(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const events = missionService.getAbnormalEvents(id);

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      console.error('[MissionController] GetAbnormalEvents error:', error);
      res.status(500).json({
        success: false,
        message: '获取异常事件失败'
      });
    }
  }

  async getAllUnhandledAbnormalEvents(req: AuthRequest, res: Response) {
    try {
      const events = missionService.getAllUnhandledAbnormalEvents();
      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      console.error('[MissionController] GetAllUnhandledAbnormalEvents error:', error);
      res.status(500).json({
        success: false,
        message: '获取未处理异常事件失败'
      });
    }
  }

  async handleAbnormalEvent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const handlerId = req.user!.id;

      const event = missionService.handleAbnormalEvent(id, handlerId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: '异常事件不存在'
        });
      }

      res.json({
        success: true,
        data: event,
        message: '异常事件已处理'
      });
    } catch (error: any) {
      console.error('[MissionController] HandleAbnormalEvent error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '处理异常事件失败'
      });
    }
  }

  async getMissionSummary(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const summary = missionService.getMissionSummary(id);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('[MissionController] GetMissionSummary error:', error);
      res.status(500).json({
        success: false,
        message: '获取任务摘要失败'
      });
    }
  }

  async getSimulationState(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const state = droneSimulatorService.getSimulationState(id);

      if (!state) {
        return res.status(404).json({
          success: false,
          message: '模拟任务不存在'
        });
      }

      res.json({
        success: true,
        data: {
          missionId: state.missionId,
          phase: state.phase,
          currentLat: state.currentLat,
          currentLng: state.currentLng,
          currentAltitude: state.currentAltitude,
          currentSpeed: state.currentSpeed,
          currentHeading: state.currentHeading,
          battery: state.battery,
          distanceTraveled: state.distanceTraveled
        }
      });
    } catch (error) {
      console.error('[MissionController] GetSimulationState error:', error);
      res.status(500).json({
        success: false,
        message: '获取模拟状态失败'
      });
    }
  }

  async recordPhoto(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { photoData } = req.body;

      if (!photoData) {
        return res.status(400).json({
          success: false,
          message: '请提供照片数据'
        });
      }

      const mission = missionService.recordPhoto(id, photoData);
      if (!mission) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      res.json({
        success: true,
        data: mission,
        message: '拍照成功'
      });
    } catch (error: any) {
      console.error('[MissionController] RecordPhoto error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '拍照失败'
      });
    }
  }

  async confirmReceipt(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { receiptImage } = req.body;

      if (!receiptImage) {
        return res.status(400).json({
          success: false,
          message: '请提供签收照片'
        });
      }

      const result = missionService.confirmReceipt(id, receiptImage);
      if (!result.mission) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      res.json({
        success: true,
        data: result,
        message: '签收确认成功'
      });
    } catch (error: any) {
      console.error('[MissionController] ConfirmReceipt error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '签收确认失败'
      });
    }
  }

  async reassignMission(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { newDroneId, reason } = req.body;
      const operatorId = req.user!.id;

      if (!newDroneId) {
        return res.status(400).json({
          success: false,
          message: '请选择目标无人机'
        });
      }

      const result = missionService.reassignMission(id, newDroneId, operatorId, reason);
      if (!result) {
        return res.status(400).json({
          success: false,
          message: '任务状态不支持改派或无人机不可用'
        });
      }

      res.json({
        success: true,
        data: result,
        message: '任务改派成功'
      });
    } catch (error: any) {
      console.error('[MissionController] ReassignMission error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '改派失败'
      });
    }
  }

  async getReassignments(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const reassignments = missionService.getReassignmentsByMissionId(id);

      res.json({
        success: true,
        data: reassignments
      });
    } catch (error) {
      console.error('[MissionController] GetReassignments error:', error);
      res.status(500).json({
        success: false,
        message: '获取改派记录失败'
      });
    }
  }

  async getOrderTimeline(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const timeline = missionService.getOrderTimeline(orderId);

      res.json({
        success: true,
        data: timeline
      });
    } catch (error) {
      console.error('[MissionController] GetOrderTimeline error:', error);
      res.status(500).json({
        success: false,
        message: '获取订单时间线失败'
      });
    }
  }

  async getAvailableDronesForReassignment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const drones = missionService.getAvailableDronesForReassignment(id);

      res.json({
        success: true,
        data: drones
      });
    } catch (error) {
      console.error('[MissionController] GetAvailableDronesForReassignment error:', error);
      res.status(500).json({
        success: false,
        message: '获取可用无人机失败'
      });
    }
  }

  async getMissionPlaybackData(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = missionService.getMissionPlaybackData(id);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('[MissionController] GetMissionPlaybackData error:', error);
      res.status(500).json({
        success: false,
        message: '获取回放数据失败'
      });
    }
  }

  async exportPlaybackData(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = missionService.getMissionPlaybackData(id);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      const exportData = JSON.stringify(data, null, 2);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="mission-playback-${id}.json"`);
      res.send(exportData);
    } catch (error) {
      console.error('[MissionController] ExportPlaybackData error:', error);
      res.status(500).json({
        success: false,
        message: '导出回放数据失败'
      });
    }
  }
}

export const missionController = new MissionController();
