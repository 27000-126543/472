import { flightRouteRepository } from '../repositories/FlightRouteRepository';
import { noFlyZoneRepository } from '../repositories/NoFlyZoneRepository';
import { droneRepository } from '../repositories/DroneRepository';
import { FlightRoute, Drone, NoFlyZone, NoFlyZoneType, PlanRouteRequest, PlanRouteResponse } from '../../shared/types';
import { generateId } from '../utils/helpers';
import { haversineDistance, calculateCost, pointInPolygon } from '../utils/helpers';

export class RoutePlanningService {
  async planRoute(request: PlanRouteRequest): Promise<PlanRouteResponse> {
    const { startLat, startLng, endLat, endLng, packageWeight } = request;

    const noFlyZones = noFlyZoneRepository.findActive();

    const route = this.calculateOptimalRoute(
      startLat, startLng, endLat, endLng, noFlyZones
    );

    const availableDrones = droneRepository.findAvailableForPayload(packageWeight)
      .filter(d => d.battery >= route.estimatedBattery + 10);

    if (availableDrones.length === 0) {
      route.isValid = false;
      route.validationErrors = ['没有可用的无人机满足当前配送需求'];
    }

    const estimatedCost = calculateCost(route.distance, packageWeight);
    const avoidedZones: string[] = [];

    for (const wp of route.waypoints) {
      for (const nfz of noFlyZones) {
        if (pointInPolygon({ lat: wp.lat, lng: wp.lng }, nfz.coordinates)) {
          if (!avoidedZones.includes(nfz.id)) {
            avoidedZones.push(nfz.id);
          }
        }
      }
    }

    const fullRoute: FlightRoute = {
      id: generateId('route'),
      orderId: '',
      ...route,
      createdAt: new Date().toISOString()
    };

    return {
      route: fullRoute,
      availableDrones,
      estimatedCost,
      distance: route.distance,
      estimatedDuration: route.estimatedTime,
      waypoints: route.waypoints,
      avoidedZones
    };
  }

  validateRoute(route: {
    waypoints: { lat: number; lng: number; altitude: number }[];
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const noFlyZones = noFlyZoneRepository.findActive();

    for (const wp of route.waypoints) {
      for (const nfz of noFlyZones) {
        if (pointInPolygon({ lat: wp.lat, lng: wp.lng }, nfz.coordinates)) {
          if (nfz.type === NoFlyZoneType.FORBIDDEN) {
            errors.push(`航线经过禁飞区: ${nfz.name}`);
          } else if (nfz.type === NoFlyZoneType.RESTRICTED && wp.altitude < nfz.maxAltitude) {
            errors.push(`航线在限制区 ${nfz.name} 内高度过低，需要高于 ${nfz.maxAltitude}m`);
          } else if (nfz.type === NoFlyZoneType.WARNING) {
            errors.push(`航线经过警告区域: ${nfz.name}，请注意`);
          }
        }
      }
    }

    return {
      valid: errors.filter(e => !e.includes('警告')).length === 0,
      errors
    };
  }

  private calculateOptimalRoute(
    startLat: number, startLng: number,
    endLat: number, endLng: number,
    noFlyZones: NoFlyZone[]
  ): Omit<FlightRoute, 'id' | 'orderId' | 'createdAt'> {
    const waypoints: { lat: number; lng: number; altitude: number }[] = [];

    const midLat = (startLat + endLat) / 2;
    const midLng = (startLng + endLng) / 2;

    const startPoint = { lat: startLat, lng: startLng };
    const midPoint = { lat: midLat, lng: midLng };
    const endPoint = { lat: endLat, lng: endLng };

    let baseAltitude = 60;
    for (const nfz of noFlyZones) {
      if (pointInPolygon(midPoint, nfz.coordinates) && nfz.type !== NoFlyZoneType.WARNING) {
        baseAltitude = Math.max(baseAltitude, nfz.maxAltitude + 20);
      }
    }

    waypoints.push({ ...startPoint, altitude: 50 });
    waypoints.push({ lat: startLat + 0.001, lng: startLng + 0.001, altitude: baseAltitude });
    waypoints.push({ ...midPoint, altitude: baseAltitude });
    waypoints.push({ lat: endLat - 0.001, lng: endLng - 0.001, altitude: baseAltitude });
    waypoints.push({ ...endPoint, altitude: 30 });

    const totalDistance = waypoints.reduce((sum, wp, i) => {
      if (i === 0) return 0;
      const prev = waypoints[i - 1];
      return sum + haversineDistance(prev.lat, prev.lng, wp.lat, wp.lng);
    }, 0);

    const avgSpeed = 12;
    const estimatedTime = Math.ceil(totalDistance / avgSpeed);
    const batteryConsumptionRate = 0.15;
    const estimatedBattery = Math.ceil((estimatedTime / 60) * batteryConsumptionRate * 100) + 15;

    const validation = this.validateRoute({ waypoints });

    return {
      startLat,
      startLng,
      startAddress: '',
      endLat,
      endLng,
      endAddress: '',
      waypoints,
      distance: Math.round(totalDistance),
      estimatedTime,
      estimatedBattery: Math.min(estimatedBattery, 95),
      isValid: validation.valid,
      validationErrors: validation.errors
    };
  }

  saveRoute(data: {
    orderId: string;
    startLat: number;
    startLng: number;
    startAddress: string;
    endLat: number;
    endLng: number;
    endAddress: string;
  }): FlightRoute {
    const noFlyZones = noFlyZoneRepository.findActive();
    const route = this.calculateOptimalRoute(
      data.startLat, data.startLng, data.endLat, data.endLng, noFlyZones
    );

    return flightRouteRepository.create({
      orderId: data.orderId,
      startLat: data.startLat,
      startLng: data.startLng,
      startAddress: data.startAddress,
      endLat: data.endLat,
      endLng: data.endLng,
      endAddress: data.endAddress,
      waypoints: route.waypoints,
      distance: route.distance,
      estimatedTime: route.estimatedTime,
      estimatedBattery: route.estimatedBattery,
      isValid: route.isValid,
      validationErrors: route.validationErrors
    });
  }

  getByOrderId(orderId: string): FlightRoute | null {
    return flightRouteRepository.findByOrderId(orderId);
  }
}

export const routePlanningService = new RoutePlanningService();
