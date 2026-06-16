import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { orderService } from '../services/OrderService';
import { routePlanningService } from '../services/RoutePlanningService';
import { CreateOrderRequest, OrderStatus } from '../../shared/types';

export class OrderController {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const { status, orderNo, receiverName, startDate, endDate } = req.query;
      const userId = req.user?.role === 'user' ? req.user.id : undefined;

      const filters: any = {};
      if (userId) filters.userId = userId;
      if (status) filters.status = status as OrderStatus;
      if (orderNo) filters.orderNo = orderNo as string;
      if (receiverName) filters.receiverName = receiverName as string;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;

      const orders = orderService.findWithFilters(filters);

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('[OrderController] GetAll error:', error);
      res.status(500).json({
        success: false,
        message: '获取订单列表失败'
      });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const order = orderService.getById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      if (req.user?.role === 'user' && order.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: '无权访问此订单'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('[OrderController] GetById error:', error);
      res.status(500).json({
        success: false,
        message: '获取订单信息失败'
      });
    }
  }

  async getByOrderNo(req: AuthRequest, res: Response) {
    try {
      const { orderNo } = req.params;
      const order = orderService.getByOrderNo(orderNo);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      if (req.user?.role === 'user' && order.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: '无权访问此订单'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('[OrderController] GetByOrderNo error:', error);
      res.status(500).json({
        success: false,
        message: '获取订单信息失败'
      });
    }
  }

  async planRoute(req: AuthRequest, res: Response) {
    try {
      const { startLat, startLng, endLat, endLng, packageWeight } = req.body;

      if (!startLat || !startLng || !endLat || !endLng || packageWeight === undefined) {
        return res.status(400).json({
          success: false,
          message: '请提供完整的起止坐标和包裹重量'
        });
      }

      const result = await routePlanningService.planRoute({
        startLat: parseFloat(startLat),
        startLng: parseFloat(startLng),
        endLat: parseFloat(endLat),
        endLng: parseFloat(endLng),
        packageWeight: parseFloat(packageWeight)
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[OrderController] PlanRoute error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '航线规划失败'
      });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const data = req.body as CreateOrderRequest;
      const userId = req.user!.id;

      if (!data.senderName || !data.senderPhone || !data.senderAddress ||
          !data.receiverName || !data.receiverPhone || !data.receiverAddress ||
          data.senderLat === undefined || data.senderLng === undefined ||
          data.receiverLat === undefined || data.receiverLng === undefined ||
          !data.packageType || data.packageWeight === undefined) {
        return res.status(400).json({
          success: false,
          message: '请填写完整的订单信息'
        });
      }

      const order = await orderService.create(userId, data);

      res.status(201).json({
        success: true,
        data: order,
        message: '订单创建成功'
      });
    } catch (error: any) {
      console.error('[OrderController] Create error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '创建订单失败'
      });
    }
  }

  async cancel(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const order = orderService.getById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      if (req.user?.role === 'user' && order.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: '无权取消此订单'
        });
      }

      if (!['pending', 'ready'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: '当前状态无法取消订单'
        });
      }

      const result = orderService.cancel(id);

      res.json({
        success: true,
        data: result,
        message: '订单已取消'
      });
    } catch (error: any) {
      console.error('[OrderController] Cancel error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '取消订单失败'
      });
    }
  }

  async getReceipt(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const order = orderService.getById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      if (req.user?.role === 'user' && order.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: '无权访问此订单凭证'
        });
      }

      if (order.status !== OrderStatus.RECEIVED && order.status !== OrderStatus.COMPLETED) {
        return res.status(400).json({
          success: false,
          message: '订单尚未完成签收'
        });
      }

      const receiptUrl = orderService.getReceiptUrl(id);

      res.json({
        success: true,
        data: {
          receiptImage: order.receiptImage,
          receiptUrl,
          receiptProof: order.receiptProof,
          orderNo: order.orderNo,
          deliveredAt: order.deliveredAt,
          receivedAt: order.receivedAt
        }
      });
    } catch (error) {
      console.error('[OrderController] GetReceipt error:', error);
      res.status(500).json({
        success: false,
        message: '获取签收凭证失败'
      });
    }
  }

  async downloadReceipt(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const order = orderService.getById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      if (req.user?.role === 'user' && order.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: '无权下载此凭证'
        });
      }

      if (!order.receiptImage) {
        return res.status(404).json({
          success: false,
          message: '签收凭证不存在'
        });
      }

      const base64Data = order.receiptImage.replace(/^data:image\/png;base64,/, '');
      const imgBuffer = Buffer.from(base64Data, 'base64');

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${order.orderNo}.png"`);
      res.send(imgBuffer);
    } catch (error) {
      console.error('[OrderController] DownloadReceipt error:', error);
      res.status(500).json({
        success: false,
        message: '下载凭证失败'
      });
    }
  }
}

export const orderController = new OrderController();
