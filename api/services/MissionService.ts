import { flightMissionRepository } from '../repositories/FlightMissionRepository';
import { telemetryRepository } from '../repositories/TelemetryRepository';
import { abnormalEventRepository } from '../repositories/AbnormalEventRepository';
import { droneRepository } from '../repositories/DroneRepository';
import { orderRepository } from '../repositories/OrderRepository';
import { userRepository } from '../repositories/UserRepository';
import { missionReassignmentRepository } from '../repositories/MissionReassignmentRepository';
import {
  FlightMission, MissionStatus, TelemetryData,
  AbnormalEvent, AbnormalType, Severity,
  DroneStatus, OrderStatus, UserRole, NotificationType, Order,
  MissionReassignment, OrderTimelineEvent
} from '../../shared/types';
import { notificationService } from './NotificationService';
import { orderService } from './OrderService';

export class MissionService {
  getAll(status?: MissionStatus, operatorId?: string): FlightMission[] {
    if (operatorId) {
      return flightMissionRepository.findByOperatorId(operatorId, status);
    }
    if (status) {
      return flightMissionRepository.findByStatus(status);
    }
    return flightMissionRepository.findAll();
  }

  getById(id: string): FlightMission | null {
    return flightMissionRepository.findById(id);
  }

  getByOrderId(orderId: string): FlightMission | null {
    return flightMissionRepository.findByOrderId(orderId);
  }

  getActiveMissions(): FlightMission[] {
    return flightMissionRepository.findActiveMissions();
  }

  startMission(id: string, operatorId: string): FlightMission | null {
    const mission = flightMissionRepository.startMission(id, operatorId);
    if (mission?.droneId) {
      droneRepository.updateStatus(mission.droneId, DroneStatus.READY);
    }
    return mission;
  }

  takeoff(id: string): FlightMission | null {
    const mission = flightMissionRepository.recordTakeoff(id);
    if (mission?.droneId) {
      droneRepository.updateStatus(mission.droneId, DroneStatus.FLYING);
      orderRepository.updateStatus(mission.orderId, OrderStatus.FLYING);
    }
    return mission;
  }

  recordDelivery(id: string): FlightMission | null {
    const mission = flightMissionRepository.recordDelivery(id);
    if (mission?.droneId) {
      droneRepository.updateStatus(mission.droneId, DroneStatus.DELIVERING);
      orderRepository.updateStatus(mission.orderId, OrderStatus.DELIVERED);
    }
    return mission;
  }

  startReturn(id: string): FlightMission | null {
    const mission = flightMissionRepository.startReturn(id);
    if (mission?.droneId) {
      droneRepository.updateStatus(mission.droneId, DroneStatus.RETURNING);
      orderRepository.updateStatus(mission.orderId, OrderStatus.RETURNING);
    }
    return mission;
  }

  completeMission(id: string, data: {
    actualFlightTime: number;
    actualDistance: number;
    batteryUsed: number;
    maxAltitude: number;
    maxSpeed: number;
  }): FlightMission | null {
    const mission = flightMissionRepository.completeMission(id, data);
    if (mission?.droneId) {
      droneRepository.updateStatus(mission.droneId, DroneStatus.IDLE);
      const remainingBattery = Math.max(0, 100 - data.batteryUsed);
      droneRepository.updateBattery(mission.droneId, remainingBattery);
    }
    return mission;
  }

  abortMission(id: string, handlerId: string): FlightMission | null {
    const mission = flightMissionRepository.abortMission(id);
    if (mission?.droneId) {
      droneRepository.updateStatus(mission.droneId, DroneStatus.ERROR);
      orderRepository.updateStatus(mission.orderId, OrderStatus.ERROR);
    }

    const dispatchers = userRepository.findByRole(UserRole.DISPATCHER);
    const dispatcherIds = dispatchers.map(d => d.id);
    notificationService.create({
      type: NotificationType.FLIGHT_ABNORMAL,
      title: '任务异常终止',
      content: `飞行任务已被紧急终止，请及时处理`,
      relatedId: id,
      relatedType: 'mission',
      recipientIds: [...dispatcherIds, handlerId]
    });

    return mission;
  }

  addTelemetry(data: {
    missionId: string;
    droneId: string;
    lat: number;
    lng: number;
    altitude: number;
    speed: number;
    heading: number;
    battery: number;
    signalStrength: number;
    temperature: number;
    isAbnormal?: boolean;
    abnormalType?: AbnormalType;
  }): TelemetryData {
    const telemetry = telemetryRepository.create(data);

    if (data.battery < 20 && !data.isAbnormal) {
      this.createAbnormalEvent(data.missionId, AbnormalType.LOW_BATTERY, Severity.WARNING, `电量过低: ${data.battery}%`);
    }
    if (data.signalStrength < 30 && !data.isAbnormal) {
      this.createAbnormalEvent(data.missionId, AbnormalType.SIGNAL_LOST, Severity.WARNING, `信号弱: ${data.signalStrength}%`);
    }

    droneRepository.updatePosition(data.droneId, data.lat, data.lng, data.altitude);
    droneRepository.updateBattery(data.droneId, data.battery);

    if (globalTelemetryCallback) {
      globalTelemetryCallback(telemetry);
    }

    return telemetry;
  }

  getTelemetry(missionId: string, limit?: number): TelemetryData[] {
    return telemetryRepository.findByMissionId(missionId, limit);
  }

  getLatestTelemetry(missionId: string): TelemetryData | null {
    return telemetryRepository.findLatestByMissionId(missionId);
  }

  createAbnormalEvent(
    missionId: string,
    type: AbnormalType,
    severity: Severity,
    description: string
  ): AbnormalEvent {
    const event = abnormalEventRepository.create({ missionId, type, severity, description });

    const dispatchers = userRepository.findByRole(UserRole.DISPATCHER);
    const mission = flightMissionRepository.findById(missionId);
    const dispatcherIds = dispatchers.map(d => d.id);
    const recipientIds = mission?.operatorId
      ? [...dispatcherIds, mission.operatorId]
      : dispatcherIds;

    notificationService.create({
      type: NotificationType.FLIGHT_ABNORMAL,
      title: severity === Severity.CRITICAL ? '严重飞行异常' : '飞行异常警告',
      content: description,
      relatedId: missionId,
      relatedType: 'mission',
      recipientIds
    });

    if (globalAbnormalCallback) {
      globalAbnormalCallback(event);
    }

    return event;
  }

  getAbnormalEvents(missionId: string): AbnormalEvent[] {
    return abnormalEventRepository.findByMissionId(missionId);
  }

  getAllUnhandledAbnormalEvents(): AbnormalEvent[] {
    return abnormalEventRepository.findUnhandled();
  }

  handleAbnormalEvent(id: string, handlerId: string): AbnormalEvent | null {
    return abnormalEventRepository.markAsHandled(id, handlerId);
  }

  getMissionSummary(missionId: string) {
    return telemetryRepository.getMissionSummary(missionId);
  }

  recordPhoto(missionId: string, photoData: string): FlightMission | null {
    const mission = flightMissionRepository.findById(missionId);
    if (!mission) return null;

    const order = orderRepository.findById(mission.orderId);
    if (order) {
      orderRepository.updateReceiptImage(order.id, photoData);
    }

    return mission;
  }

  confirmReceipt(missionId: string, receiptImage: string): {
    mission: FlightMission | null;
    order: Order | null;
  } {
    const mission = flightMissionRepository.findById(missionId);
    if (!mission) return { mission: null, order: null };

    const order = orderService.markReceived(mission.orderId, receiptImage);
    const updatedMission = flightMissionRepository.confirmReceipt(missionId);
    
    if (updatedMission?.droneId) {
      droneRepository.updateStatus(updatedMission.droneId, DroneStatus.IDLE);
    }
    
    return { mission: updatedMission, order };
  }

  reassignMission(missionId: string, newDroneId: string, operatorId: string, reason?: string): {
    mission: FlightMission | null;
    oldDroneId: string;
    newDroneId: string;
    reassignment: MissionReassignment | null;
  } | null {
    const mission = flightMissionRepository.findById(missionId);
    if (!mission) return null;

    if (mission.status !== MissionStatus.PENDING && 
        mission.status !== MissionStatus.READY &&
        mission.status !== MissionStatus.FLYING) {
      return null;
    }

    const oldDroneId = mission.droneId;
    const newDrone = droneRepository.findById(newDroneId);
    if (!newDrone || (newDrone.status !== DroneStatus.IDLE && newDrone.status !== DroneStatus.READY)) {
      return null;
    }

    const updatedMission = flightMissionRepository.reassignDrone(missionId, newDroneId);
    let reassignment: MissionReassignment | null = null;
    
    if (updatedMission) {
      droneRepository.updateStatus(oldDroneId, DroneStatus.IDLE);
      droneRepository.updateStatus(newDroneId, DroneStatus.READY);
      orderRepository.updateDroneId(mission.orderId, newDroneId);

      reassignment = missionReassignmentRepository.create({
        missionId,
        orderId: mission.orderId,
        oldDroneId,
        newDroneId,
        reassignedBy: operatorId,
        reason
      });

      const dispatchers = userRepository.findByRole(UserRole.DISPATCHER);
      const dispatcherIds = dispatchers.map(d => d.id);
      const order = orderRepository.findById(mission.orderId);
      
      notificationService.create({
        type: NotificationType.FLIGHT_ABNORMAL,
        title: '任务已改派',
        content: `飞行任务 ${mission.missionNo} 已改派至无人机 ${newDrone.name}，请相关人员注意`,
        relatedId: missionId,
        relatedType: 'mission',
        recipientIds: [...dispatcherIds, operatorId, ...(mission.operatorId ? [mission.operatorId] : [])]
      });

      if (order) {
        notificationService.create({
          type: NotificationType.MISSION_COMPLETED,
          title: '配送无人机调整',
          content: `您的订单 ${order.orderNo} 配送无人机已调整，请留意配送进度`,
          relatedId: order.id,
          relatedType: 'order',
          recipientIds: [order.userId]
        });
      }
    }

    return { mission: updatedMission, oldDroneId, newDroneId, reassignment };
  }

  getReassignmentsByMissionId(missionId: string): MissionReassignment[] {
    const reassignments = missionReassignmentRepository.findByMissionId(missionId);
    return reassignments.map(r => {
      const oldDrone = droneRepository.findById(r.oldDroneId);
      const newDrone = droneRepository.findById(r.newDroneId);
      const reassignedBy = userRepository.findById(r.reassignedBy);
      return {
        ...r,
        oldDroneName: oldDrone?.name,
        newDroneName: newDrone?.name,
        reassignedByName: reassignedBy?.fullName || reassignedBy?.username
      };
    });
  }

  getOrderTimeline(orderId: string): OrderTimelineEvent[] {
    const events: OrderTimelineEvent[] = [];
    const order = orderRepository.findById(orderId);
    if (!order) return events;

    const mission = flightMissionRepository.findByOrderId(orderId);
    const reassignments = mission ? missionReassignmentRepository.findByMissionId(mission.id) : [];
    const drone = mission ? droneRepository.findById(mission.droneId) : null;
    const operator = mission?.operatorId ? userRepository.findById(mission.operatorId) : null;

    events.push({
      id: `created-${order.id}`,
      type: 'created',
      title: '订单已创建',
      description: '订单提交成功，等待分配无人机',
      timestamp: order.createdAt,
      metadata: { orderNo: order.orderNo }
    });

    if (mission && mission.droneId) {
      events.push({
        id: `assigned-${mission.id}`,
        type: 'assigned',
        title: '无人机已分配',
        description: `无人机 ${drone?.name || ''} 已分配至该订单`,
        timestamp: mission.createdAt,
        droneId: mission.droneId,
        droneName: drone?.name
      });
    }

    if (mission?.takeoffTime) {
      events.push({
        id: `takeoff-${mission.id}`,
        type: 'takeoff',
        title: '无人机已起飞',
        description: '无人机已起飞，正在前往目的地',
        timestamp: mission.takeoffTime,
        droneId: mission.droneId,
        droneName: drone?.name,
        operatorId: mission.operatorId,
        operatorName: operator?.fullName || operator?.username
      });
    }

    if (mission?.deliveryTime) {
      events.push({
        id: `delivered-${mission.id}`,
        type: 'delivered',
        title: '已送达目的地',
        description: '无人机已到达目的地，等待签收确认',
        timestamp: mission.deliveryTime,
        droneId: mission.droneId,
        droneName: drone?.name
      });
    }

    if (mission?.returnTime) {
      events.push({
        id: `returning-${mission.id}`,
        type: 'returning',
        title: '无人机返航中',
        description: '签收完成，无人机正在返航',
        timestamp: mission.returnTime,
        droneId: mission.droneId,
        droneName: drone?.name
      });
    }

    if (order.receivedAt) {
      events.push({
        id: `received-${order.id}`,
        type: 'received',
        title: '已签收',
        description: '收件人已确认签收',
        timestamp: order.receivedAt,
        operatorId: mission?.operatorId,
        operatorName: operator?.fullName || operator?.username
      });
    }

    if (order.receiptUrl && order.receivedAt) {
      events.push({
        id: `receipt-${order.id}`,
        type: 'receipt',
        title: '凭证已生成',
        description: '签收凭证已生成，可在订单详情中查看',
        timestamp: order.receivedAt,
        metadata: { receiptUrl: order.receiptUrl, receiptProof: order.receiptProof }
      });
    }

    if (mission?.status === MissionStatus.COMPLETED && mission.endTime) {
      events.push({
        id: `completed-${mission.id}`,
        type: 'completed',
        title: '任务已完成',
        description: '配送任务已完成，无人机已返航',
        timestamp: mission.endTime,
        droneId: mission.droneId,
        droneName: drone?.name
      });
    }

    for (const reassignment of reassignments) {
      const oldDrone = droneRepository.findById(reassignment.oldDroneId);
      const newDrone = droneRepository.findById(reassignment.newDroneId);
      const reassignedBy = userRepository.findById(reassignment.reassignedBy);
      events.push({
        id: `reassign-${reassignment.id}`,
        type: 'reassigned',
        title: '无人机已改派',
        description: `由 ${reassignedBy?.fullName || reassignedBy?.username} 从 ${oldDrone?.name} 改派至 ${newDrone?.name}${reassignment.reason ? `（原因：${reassignment.reason}）` : ''}`,
        timestamp: reassignment.createdAt,
        droneId: reassignment.newDroneId,
        droneName: newDrone?.name,
        operatorId: reassignment.reassignedBy,
        operatorName: reassignedBy?.fullName || reassignedBy?.username,
        metadata: {
          oldDroneId: reassignment.oldDroneId,
          oldDroneName: oldDrone?.name,
          reason: reassignment.reason
        }
      });
    }

    const typeOrder: Record<string, number> = {
      'created': 1,
      'assigned': 2,
      'reassigned': 3,
      'takeoff': 4,
      'delivered': 5,
      'returning': 6,
      'received': 7,
      'receipt': 8,
      'completed': 9
    };
    
    events.sort((a, b) => {
      const timeDiff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (timeDiff !== 0) return timeDiff;
      const orderA = typeOrder[a.type] || 10;
      const orderB = typeOrder[b.type] || 10;
      return orderA - orderB;
    });
    
    return events;
  }

  getMissionPlaybackData(missionId: string) {
    const mission = flightMissionRepository.findById(missionId);
    if (!mission) return null;

    const telemetry = telemetryRepository.findByMissionId(missionId);
    const abnormalEvents = abnormalEventRepository.findByMissionId(missionId);
    
    const photoNodes: { timestamp: string; type: string; description: string }[] = [];
    if (mission.deliveryTime) {
      photoNodes.push({
        timestamp: mission.deliveryTime,
        type: 'delivery',
        description: '抵达目的地，准备投递'
      });
    }
    if (mission.returnTime) {
      photoNodes.push({
        timestamp: mission.returnTime,
        type: 'photo',
        description: '签收拍照完成'
      });
    }

    return {
      mission,
      telemetry,
      abnormalEvents,
      photoNodes
    };
  }

  getAvailableDronesForReassignment(missionId: string) {
    const mission = flightMissionRepository.findById(missionId);
    if (!mission) return [];

    const order = orderRepository.findById(mission.orderId);
    if (!order) return [];

    const allDrones = droneRepository.findAll();
    return allDrones.filter(drone => 
      drone.id !== mission.droneId && 
      (drone.status === DroneStatus.IDLE || drone.status === DroneStatus.READY) &&
      drone.maxPayload >= order.packageWeight &&
      drone.battery >= 30
    );
  }
}

let globalTelemetryCallback: ((data: TelemetryData) => void) | null = null;
let globalAbnormalCallback: ((event: AbnormalEvent) => void) | null = null;

export function setTelemetryCallback(callback: (data: TelemetryData) => void): void {
  globalTelemetryCallback = callback;
}

export function setAbnormalCallback(callback: (event: AbnormalEvent) => void): void {
  globalAbnormalCallback = callback;
}

export const missionService = new MissionService();
