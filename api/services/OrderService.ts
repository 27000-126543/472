import { orderRepository } from '../repositories/OrderRepository';
import { flightRouteRepository } from '../repositories/FlightRouteRepository';
import { flightMissionRepository } from '../repositories/FlightMissionRepository';
import { droneRepository } from '../repositories/DroneRepository';
import { userRepository } from '../repositories/UserRepository';
import { Order, OrderStatus, CreateOrderRequest, DroneStatus, UserRole, NotificationType } from '../../shared/types';
import { routePlanningService } from './RoutePlanningService';
import { notificationService } from './NotificationService';
import { generateReceiptProof } from '../utils/helpers';

export class OrderService {
  getAll(userId?: string, status?: OrderStatus): Order[] {
    if (userId) {
      return orderRepository.findByUserId(userId, status);
    }
    if (status) {
      return orderRepository.findByStatus(status);
    }
    return orderRepository.findAll();
  }

  findWithFilters(filters: {
    userId?: string;
    orderNo?: string;
    receiverName?: string;
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
  }): Order[] {
    return orderRepository.findWithFilters(filters);
  }

  getById(id: string): Order | null {
    return orderRepository.findById(id);
  }

  getByOrderNo(orderNo: string): Order | null {
    return orderRepository.findByOrderNo(orderNo);
  }

  async create(userId: string, request: CreateOrderRequest): Promise<Order> {
    const routePlan = await routePlanningService.planRoute({
      startLat: request.senderLat,
      startLng: request.senderLng,
      endLat: request.receiverLat,
      endLng: request.receiverLng,
      packageWeight: request.packageWeight
    });

    if (!routePlan.route.isValid) {
      throw new Error(routePlan.route.validationErrors?.[0] || '无法规划有效航线');
    }

    if (routePlan.availableDrones.length === 0) {
      throw new Error('当前没有可用的无人机，请稍后再试');
    }

    const order = orderRepository.create({
      userId,
      ...request,
      estimatedCost: routePlan.estimatedCost
    });

    const route = flightRouteRepository.create({
      orderId: order.id,
      startLat: request.senderLat,
      startLng: request.senderLng,
      startAddress: request.senderAddress,
      endLat: request.receiverLat,
      endLng: request.receiverLng,
      endAddress: request.receiverAddress,
      waypoints: routePlan.route.waypoints,
      distance: routePlan.route.distance,
      estimatedTime: routePlan.route.estimatedTime,
      estimatedBattery: routePlan.route.estimatedBattery,
      isValid: true
    });

    const selectedDrone = routePlan.availableDrones[0];
    const mission = flightMissionRepository.create({
      orderId: order.id,
      droneId: selectedDrone.id,
      routeId: route.id
    });

    droneRepository.updateStatus(selectedDrone.id, DroneStatus.READY);

    const updatedOrder = orderRepository.assignDrone(order.id, selectedDrone.id, route.id, mission.id);

    const operators = userRepository.findByRole(UserRole.OPERATOR);
    const operatorIds = operators.map(op => op.id);
    notificationService.create({
      type: NotificationType.ORDER_CREATED,
      title: '新订单待处理',
      content: `订单 ${order.orderNo} 已创建，等待操作员执行配送任务`,
      relatedId: order.id,
      relatedType: 'order',
      recipientIds: [userId, ...operatorIds]
    });

    return updatedOrder!;
  }

  updateStatus(id: string, status: OrderStatus): Order | null {
    return orderRepository.updateStatus(id, status);
  }

  markDelivered(id: string): Order | null {
    const order = orderRepository.markDelivered(id);
    if (order) {
      notificationService.create({
        type: NotificationType.MISSION_COMPLETED,
        title: '订单已送达',
        content: `订单 ${order.orderNo} 已送达目的地，等待签收确认`,
        relatedId: order.id,
        relatedType: 'order',
        recipientIds: [order.userId]
      });
    }
    return order;
  }

  markReceived(id: string, receiptImage: string): Order | null {
    const order = orderRepository.getById(id);
    if (!order) return null;

    const receiptProof = generateReceiptProof(order);
    const receiptUrl = `/api/orders/${id}/receipt/download`;

    const updatedOrder = orderRepository.markReceived(id, receiptImage, receiptUrl, receiptProof);
    if (updatedOrder) {
      notificationService.create({
        type: NotificationType.MISSION_COMPLETED,
        title: '订单已签收',
        content: `订单 ${updatedOrder.orderNo} 已成功签收，您可以在订单详情中查看和下载签收凭证`,
        relatedId: updatedOrder.id,
        relatedType: 'order',
        recipientIds: [updatedOrder.userId]
      });
    }
    return updatedOrder;
  }

  cancel(id: string): Order | null {
    const order = orderRepository.updateStatus(id, OrderStatus.CANCELLED);
    if (order?.droneId) {
      droneRepository.updateStatus(order.droneId, DroneStatus.READY);
    }
    return order;
  }

  getReceiptUrl(id: string): string | null {
    const order = orderRepository.findById(id);
    return order?.receiptUrl || null;
  }
}

export const orderService = new OrderService();
