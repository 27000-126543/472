import { noFlyZoneRepository } from '../repositories/NoFlyZoneRepository';
import { flightRouteRepository } from '../repositories/FlightRouteRepository';
import { flightMissionRepository } from '../repositories/FlightMissionRepository';
import { orderRepository } from '../repositories/OrderRepository';
import { userRepository } from '../repositories/UserRepository';
import { 
  NoFlyZone, NoFlyZoneType, CreateNoFlyZoneRequest,
  MissionStatus, OrderStatus, UserRole, NotificationType,
  FlightMission, Order, FlightRoute
} from '../../shared/types';
import { pointInPolygon } from '../utils/helpers';
import { notificationService } from './NotificationService';

export class NoFlyZoneService {
  getAll(): NoFlyZone[] {
    return noFlyZoneRepository.findAll();
  }

  getById(id: string): NoFlyZone | null {
    return noFlyZoneRepository.findById(id);
  }

  getActive(): NoFlyZone[] {
    return noFlyZoneRepository.findActive();
  }

  getByType(type: NoFlyZoneType): NoFlyZone[] {
    return noFlyZoneRepository.findByType(type);
  }

  create(request: CreateNoFlyZoneRequest): NoFlyZone {
    if (request.coordinates.length < 3) {
      throw new Error('禁飞区至少需要3个坐标点');
    }
    const zone = noFlyZoneRepository.create(request);
    this.validateAndNotifyAffectedMissions();
    return zone;
  }

  update(id: string, data: Partial<CreateNoFlyZoneRequest & { isActive: boolean }>): NoFlyZone | null {
    if (data.coordinates && data.coordinates.length < 3) {
      throw new Error('禁飞区至少需要3个坐标点');
    }
    const zone = noFlyZoneRepository.update(id, data);
    if (zone) {
      this.validateAndNotifyAffectedMissions();
    }
    return zone;
  }

  delete(id: string): boolean {
    const success = noFlyZoneRepository.delete(id);
    if (success) {
      this.validateAndNotifyAffectedMissions();
    }
    return success;
  }

  toggleActive(id: string, isActive: boolean): NoFlyZone | null {
    const zone = noFlyZoneRepository.toggleActive(id, isActive);
    if (zone) {
      this.validateAndNotifyAffectedMissions();
    }
    return zone;
  }

  previewImpact(zoneConfig: {
    id?: string;
    coordinates: { lat: number; lng: number }[];
    type: NoFlyZoneType;
    minAltitude?: number;
    maxAltitude: number;
    isActive?: boolean;
    effectiveFrom?: string;
    effectiveTo?: string;
  }): {
    affectedMissions: FlightMission[];
    affectedOrders: Order[];
    affectedRoutes: FlightRoute[];
    missionCount: number;
    orderCount: number;
    pendingCount: number;
    flyingCount: number;
  } {
    const pendingMissions = flightMissionRepository.findByStatus(MissionStatus.PENDING);
    const readyMissions = flightMissionRepository.findByStatus(MissionStatus.READY);
    const flyingMissions = flightMissionRepository.findByStatus(MissionStatus.FLYING);
    const allMissions = [...pendingMissions, ...readyMissions, ...flyingMissions];

    const affectedMissions: FlightMission[] = [];
    const affectedOrders: Order[] = [];
    const affectedRoutes: FlightRoute[] = [];

    const tempZone: NoFlyZone = {
      id: zoneConfig.id || 'preview-zone',
      name: '预览区域',
      type: zoneConfig.type,
      coordinates: zoneConfig.coordinates,
      minAltitude: zoneConfig.minAltitude || 0,
      maxAltitude: zoneConfig.maxAltitude,
      isActive: zoneConfig.isActive !== false,
      reason: '',
      createdAt: new Date().toISOString()
    };

    for (const mission of allMissions) {
      const route = flightRouteRepository.findById(mission.routeId);
      if (!route) continue;

      let affected = false;
      for (const wp of route.waypoints) {
        if (pointInPolygon({ lat: wp.lat, lng: wp.lng }, tempZone.coordinates)) {
          if (tempZone.type === NoFlyZoneType.FORBIDDEN) {
            affected = true;
            break;
          } else if (tempZone.type === NoFlyZoneType.RESTRICTED && wp.altitude < tempZone.maxAltitude) {
            affected = true;
            break;
          } else if (tempZone.type === NoFlyZoneType.WARNING) {
            affected = true;
            break;
          }
        }
      }

      if (affected) {
        affectedMissions.push(mission);
        affectedRoutes.push(route);
        const order = orderRepository.findById(mission.orderId);
        if (order) {
          affectedOrders.push(order);
        }
      }
    }

    const pendingCount = affectedMissions.filter(
      m => m.status === MissionStatus.PENDING || m.status === MissionStatus.READY
    ).length;
    const flyingCount = affectedMissions.filter(
      m => m.status === MissionStatus.FLYING
    ).length;

    return {
      affectedMissions,
      affectedOrders,
      affectedRoutes,
      missionCount: affectedMissions.length,
      orderCount: affectedOrders.length,
      pendingCount,
      flyingCount
    };
  }

  private validateAndNotifyAffectedMissions(): {
    affectedMissions: string[];
    affectedOrders: string[];
  } {
    const affectedMissions: string[] = [];
    const affectedOrders: string[] = [];

    const pendingMissions = flightMissionRepository.findByStatus(MissionStatus.PENDING);
    const readyMissions = flightMissionRepository.findByStatus(MissionStatus.READY);
    const allPendingMissions = [...pendingMissions, ...readyMissions];

    for (const mission of allPendingMissions) {
      const route = flightRouteRepository.findById(mission.routeId);
      if (!route) continue;

      const validation = this.validateRoute(route.waypoints);
      if (!validation.valid) {
        flightRouteRepository.invalidate(route.id, validation.violations.map(v => v.message));
        orderRepository.updateStatus(mission.orderId, OrderStatus.PENDING_PLANNING);
        affectedMissions.push(mission.id);
        affectedOrders.push(mission.orderId);
      }
    }

    if (affectedMissions.length > 0) {
      const dispatchers = userRepository.findByRole(UserRole.DISPATCHER);
      const dispatcherIds = dispatchers.map(d => d.id);

      notificationService.create({
        type: NotificationType.SYSTEM_ALERT,
        title: '航线需要重新规划',
        content: `禁飞区规则更新后，有 ${affectedMissions.length} 个任务的航线受影响，需要重新规划`,
        relatedType: 'mission',
        recipientIds: dispatcherIds
      });
    }

    return { affectedMissions, affectedOrders };
  }

  getAffectedMissions(): {
    mission: any;
    order: any;
    route: any;
    violations: any[];
  }[] {
    const result: any[] = [];
    const pendingMissions = flightMissionRepository.findByStatus(MissionStatus.PENDING);
    const readyMissions = flightMissionRepository.findByStatus(MissionStatus.READY);
    const allPendingMissions = [...pendingMissions, ...readyMissions];

    for (const mission of allPendingMissions) {
      const route = flightRouteRepository.findById(mission.routeId);
      if (!route) continue;

      const validation = this.validateRoute(route.waypoints);
      if (!validation.valid) {
        const order = orderRepository.findById(mission.orderId);
        result.push({
          mission,
          order,
          route,
          violations: validation.violations
        });
      }
    }

    return result;
  }

  checkPointInNoFlyZone(lat: number, lng: number, altitude: number): {
    inZone: boolean;
    zone?: NoFlyZone;
    violation: boolean;
  } {
    const activeZones = this.getActive();

    for (const zone of activeZones) {
      if (pointInPolygon({ lat, lng }, zone.coordinates)) {
        const violation = zone.type === 'forbidden' ||
          (zone.type === 'restricted' && altitude < zone.maxAltitude);
        return {
          inZone: true,
          zone,
          violation
        };
      }
    }
    return { inZone: false, violation: false };
  }

  validateRoute(waypoints: { lat: number; lng: number; altitude: number }[]): {
    valid: boolean;
    violations: { waypointIndex: number; zone: NoFlyZone; message: string }[];
    warnings: { waypointIndex: number; zone: NoFlyZone; message: string }[];
  } {
    const violations: { waypointIndex: number; zone: NoFlyZone; message: string }[] = [];
    const warnings: { waypointIndex: number; zone: NoFlyZone; message: string }[] = [];
    const activeZones = this.getActive();

    waypoints.forEach((wp, index) => {
      for (const zone of activeZones) {
        if (pointInPolygon({ lat: wp.lat, lng: wp.lng }, zone.coordinates)) {
          if (zone.type === 'forbidden') {
            violations.push({
              waypointIndex: index,
              zone,
              message: `航点${index + 1}经过禁飞区: ${zone.name}`
            });
          } else if (zone.type === 'restricted' && wp.altitude < zone.maxAltitude) {
            violations.push({
              waypointIndex: index,
              zone,
              message: `航点${index + 1}在限制区${zone.name}内高度不足，需要${zone.maxAltitude}m以上`
            });
          } else if (zone.type === 'warning') {
            warnings.push({
              waypointIndex: index,
              zone,
              message: `航点${index + 1}经过警告区域: ${zone.name}`
            });
          }
        }
      }
    });

    return {
      valid: violations.length === 0,
      violations,
      warnings
    };
  }
}

export const noFlyZoneService = new NoFlyZoneService();
