import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { droneService } from '../services/DroneService';
import { CreateDroneRequest, DroneStatus } from '../../shared/types';

export class DroneController {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const { status } = req.query;
      let drones;

      if (status) {
        drones = droneService.getByStatus(status as DroneStatus);
      } else {
        drones = droneService.getAll();
      }

      res.json({
        success: true,
        data: drones
      });
    } catch (error) {
      console.error('[DroneController] GetAll error:', error);
      res.status(500).json({
        success: false,
        message: '获取无人机列表失败'
      });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const drone = droneService.getById(id);

      if (!drone) {
        return res.status(404).json({
          success: false,
          message: '无人机不存在'
        });
      }

      res.json({
        success: true,
        data: drone
      });
    } catch (error) {
      console.error('[DroneController] GetById error:', error);
      res.status(500).json({
        success: false,
        message: '获取无人机信息失败'
      });
    }
  }

  async getRealTimeStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const status = droneService.getRealTimeStatus(id);

      if (!status.drone) {
        return res.status(404).json({
          success: false,
          message: '无人机不存在'
        });
      }

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('[DroneController] GetRealTimeStatus error:', error);
      res.status(500).json({
        success: false,
        message: '获取无人机实时状态失败'
      });
    }
  }

  async getAvailableForPayload(req: AuthRequest, res: Response) {
    try {
      const { weight } = req.query;

      if (!weight) {
        return res.status(400).json({
          success: false,
          message: '请提供包裹重量'
        });
      }

      const drones = droneService.getAvailableForPayload(parseFloat(weight as string));

      res.json({
        success: true,
        data: drones
      });
    } catch (error) {
      console.error('[DroneController] GetAvailableForPayload error:', error);
      res.status(500).json({
        success: false,
        message: '获取可用无人机失败'
      });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const data = req.body as CreateDroneRequest;

      if (!data.name || !data.model || data.maxPayload === undefined) {
        return res.status(400).json({
          success: false,
          message: '无人机名称、型号和最大载荷不能为空'
        });
      }

      const drone = droneService.create(data);

      res.status(201).json({
        success: true,
        data: drone,
        message: '无人机创建成功'
      });
    } catch (error: any) {
      console.error('[DroneController] Create error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '创建无人机失败'
      });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;

      const drone = droneService.update(id, data);

      if (!drone) {
        return res.status(404).json({
          success: false,
          message: '无人机不存在'
        });
      }

      res.json({
        success: true,
        data: drone,
        message: '无人机更新成功'
      });
    } catch (error: any) {
      console.error('[DroneController] Update error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '更新无人机失败'
      });
    }
  }

  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: '状态不能为空'
        });
      }

      const drone = droneService.updateStatus(id, status);

      if (!drone) {
        return res.status(404).json({
          success: false,
          message: '无人机不存在'
        });
      }

      res.json({
        success: true,
        data: drone,
        message: '无人机状态更新成功'
      });
    } catch (error: any) {
      console.error('[DroneController] UpdateStatus error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '更新无人机状态失败'
      });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const success = droneService.delete(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: '无人机不存在'
        });
      }

      res.json({
        success: true,
        message: '无人机删除成功'
      });
    } catch (error) {
      console.error('[DroneController] Delete error:', error);
      res.status(500).json({
        success: false,
        message: '删除无人机失败'
      });
    }
  }

  async getStatusCount(req: AuthRequest, res: Response) {
    try {
      const counts = droneService.getStatusCount();
      res.json({
        success: true,
        data: counts
      });
    } catch (error) {
      console.error('[DroneController] GetStatusCount error:', error);
      res.status(500).json({
        success: false,
        message: '获取无人机状态统计失败'
      });
    }
  }
}

export const droneController = new DroneController();
