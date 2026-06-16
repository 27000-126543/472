import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { noFlyZoneService } from '../services/NoFlyZoneService';
import { CreateNoFlyZoneRequest, NoFlyZoneType } from '../../shared/types';

export class NoFlyZoneController {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const { type, active } = req.query;
      let zones;

      if (type) {
        zones = noFlyZoneService.getByType(type as NoFlyZoneType);
      } else if (active === 'true') {
        zones = noFlyZoneService.getActive();
      } else {
        zones = noFlyZoneService.getAll();
      }

      res.json({
        success: true,
        data: zones
      });
    } catch (error) {
      console.error('[NoFlyZoneController] GetAll error:', error);
      res.status(500).json({
        success: false,
        message: '获取禁飞区列表失败'
      });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const zone = noFlyZoneService.getById(id);

      if (!zone) {
        return res.status(404).json({
          success: false,
          message: '禁飞区不存在'
        });
      }

      res.json({
        success: true,
        data: zone
      });
    } catch (error) {
      console.error('[NoFlyZoneController] GetById error:', error);
      res.status(500).json({
        success: false,
        message: '获取禁飞区信息失败'
      });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const data = req.body as CreateNoFlyZoneRequest;

      if (!data.name || !data.type || !data.coordinates) {
        return res.status(400).json({
          success: false,
          message: '禁飞区名称、类型和坐标不能为空'
        });
      }

      const zone = noFlyZoneService.create(data);

      res.status(201).json({
        success: true,
        data: zone,
        message: '禁飞区创建成功'
      });
    } catch (error: any) {
      console.error('[NoFlyZoneController] Create error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '创建禁飞区失败'
      });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;

      const zone = noFlyZoneService.update(id, data);

      if (!zone) {
        return res.status(404).json({
          success: false,
          message: '禁飞区不存在'
        });
      }

      res.json({
        success: true,
        data: zone,
        message: '禁飞区更新成功'
      });
    } catch (error: any) {
      console.error('[NoFlyZoneController] Update error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '更新禁飞区失败'
      });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const success = noFlyZoneService.delete(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: '禁飞区不存在'
        });
      }

      res.json({
        success: true,
        message: '禁飞区删除成功'
      });
    } catch (error) {
      console.error('[NoFlyZoneController] Delete error:', error);
      res.status(500).json({
        success: false,
        message: '删除禁飞区失败'
      });
    }
  }

  async checkPoint(req: AuthRequest, res: Response) {
    try {
      const { lat, lng, altitude } = req.query;

      if (!lat || !lng || !altitude) {
        return res.status(400).json({
          success: false,
          message: '请提供完整的坐标和高度信息'
        });
      }

      const result = noFlyZoneService.checkPointInNoFlyZone(
        parseFloat(lat as string),
        parseFloat(lng as string),
        parseFloat(altitude as string)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[NoFlyZoneController] CheckPoint error:', error);
      res.status(500).json({
        success: false,
        message: '检查坐标失败'
      });
    }
  }

  async validateRoute(req: AuthRequest, res: Response) {
    try {
      const { waypoints } = req.body;

      if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的航线航点'
        });
      }

      const result = noFlyZoneService.validateRoute(waypoints);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[NoFlyZoneController] ValidateRoute error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '航线校验失败'
      });
    }
  }

  async toggleActive(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const zone = noFlyZoneService.toggleActive(id, isActive);
      if (!zone) {
        return res.status(404).json({
          success: false,
          message: '禁飞区不存在'
        });
      }

      res.json({
        success: true,
        data: zone,
        message: isActive ? '禁飞区已启用' : '禁飞区已停用'
      });
    } catch (error: any) {
      console.error('[NoFlyZoneController] ToggleActive error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '操作失败'
      });
    }
  }

  async getAffectedMissions(req: AuthRequest, res: Response) {
    try {
      const missions = noFlyZoneService.getAffectedMissions();

      res.json({
        success: true,
        data: missions
      });
    } catch (error) {
      console.error('[NoFlyZoneController] GetAffectedMissions error:', error);
      res.status(500).json({
        success: false,
        message: '获取受影响任务失败'
      });
    }
  }
}

export const noFlyZoneController = new NoFlyZoneController();
