import { missionService } from './MissionService';
import { flightMissionRepository } from '../repositories/FlightMissionRepository';
import { flightRouteRepository } from '../repositories/FlightRouteRepository';
import { droneRepository } from '../repositories/DroneRepository';
import { orderService } from './OrderService';
import { AbnormalType, Severity, DroneStatus } from '../../shared/types';
import { haversineDistance, generateId } from '../utils/helpers';

interface SimulationState {
  missionId: string;
  droneId: string;
  orderId: string;
  routeId: string;
  waypoints: { lat: number; lng: number; altitude: number }[];
  currentWaypointIndex: number;
  currentLat: number;
  currentLng: number;
  currentAltitude: number;
  currentSpeed: number;
  currentHeading: number;
  battery: number;
  signalStrength: number;
  temperature: number;
  startTime: number;
  phase: 'takeoff' | 'to_destination' | 'delivering' | 'returning' | 'landing' | 'completed';
  distanceTraveled: number;
  maxAltitude: number;
  maxSpeed: number;
  intervalId: NodeJS.Timeout | null;
}

const activeSimulations = new Map<string, SimulationState>();

export class DroneSimulatorService {
  startSimulation(missionId: string): boolean {
    if (activeSimulations.has(missionId)) {
      return false;
    }

    const mission = flightMissionRepository.findById(missionId);
    if (!mission) return false;

    const route = flightRouteRepository.findById(mission.routeId);
    if (!route) return false;

    const state: SimulationState = {
      missionId,
      droneId: mission.droneId,
      orderId: mission.orderId,
      routeId: mission.routeId,
      waypoints: route.waypoints,
      currentWaypointIndex: 0,
      currentLat: route.waypoints[0].lat,
      currentLng: route.waypoints[0].lng,
      currentAltitude: route.waypoints[0].altitude,
      currentSpeed: 0,
      currentHeading: 0,
      battery: 95,
      signalStrength: 95,
      temperature: 25,
      startTime: Date.now(),
      phase: 'takeoff',
      distanceTraveled: 0,
      maxAltitude: 0,
      maxSpeed: 0,
      intervalId: null
    };

    activeSimulations.set(missionId, state);
    this.runSimulation(state);
    return true;
  }

  private runSimulation(state: SimulationState) {
    let tickCount = 0;

    state.intervalId = setInterval(() => {
      tickCount++;
      this.updateSimulation(state, tickCount);
    }, 1000);
  }

  private updateSimulation(state: SimulationState, tickCount: number) {
    const { waypoints, currentWaypointIndex } = state;

    if (tickCount < 3 && state.phase === 'takeoff') {
      state.currentAltitude = Math.min(state.currentAltitude + 15, waypoints[1].altitude);
      state.currentSpeed = 2;
      this.sendTelemetry(state);

      if (tickCount === 2) {
        state.phase = 'to_destination';
        state.currentWaypointIndex = 1;
      }
      return;
    }

    if (Math.random() < 0.02 && state.battery > 20) {
      const abnormalType = this.generateRandomAbnormal();
      if (abnormalType) {
        missionService.createAbnormalEvent(
          state.missionId,
          abnormalType,
          Math.random() < 0.3 ? Severity.CRITICAL : Severity.WARNING,
          this.getAbnormalDescription(abnormalType)
        );

        if (abnormalType === AbnormalType.EMERGENCY_LANDING) {
          this.emergencyLanding(state);
          return;
        }
      }
    }

    const targetWaypoint = waypoints[currentWaypointIndex];
    const distanceToTarget = haversineDistance(
      state.currentLat, state.currentLng,
      targetWaypoint.lat, targetWaypoint.lng
    );

    const moveDistance = 8 + Math.random() * 6;
    const ratio = Math.min(1, moveDistance / Math.max(distanceToTarget, 1));

    state.distanceTraveled += moveDistance;

    const newLat = state.currentLat + (targetWaypoint.lat - state.currentLat) * ratio * 0.1;
    const newLng = state.currentLng + (targetWaypoint.lng - state.currentLng) * ratio * 0.1;

    state.currentHeading = this.calculateHeading(
      state.currentLat, state.currentLng,
      targetWaypoint.lat, targetWaypoint.lng
    );

    state.currentLat = newLat;
    state.currentLng = newLng;
    state.currentAltitude = targetWaypoint.altitude;
    state.currentSpeed = moveDistance;
    state.battery = Math.max(5, state.battery - 0.15);
    state.signalStrength = Math.max(10, state.signalStrength + (Math.random() - 0.5) * 5);
    state.temperature = Math.max(15, Math.min(45, state.temperature + (Math.random() - 0.5) * 0.5));

    state.maxAltitude = Math.max(state.maxAltitude, state.currentAltitude);
    state.maxSpeed = Math.max(state.maxSpeed, state.currentSpeed);

    this.sendTelemetry(state);

    const remainingDistance = haversineDistance(
      state.currentLat, state.currentLng,
      targetWaypoint.lat, targetWaypoint.lng
    );

    if (remainingDistance < 5) {
      this.handleWaypointReached(state);
    }
  }

  private handleWaypointReached(state: SimulationState) {
    const { waypoints, currentWaypointIndex } = state;

    if (state.phase === 'to_destination' && currentWaypointIndex >= waypoints.length - 1) {
      state.phase = 'delivering';

      missionService.recordDelivery(state.missionId);

      setTimeout(() => {
        if (activeSimulations.has(state.missionId)) {
          state.phase = 'returning';
          state.currentWaypointIndex = waypoints.length - 2;
          missionService.startReturn(state.missionId);
        }
      }, 5000);
      return;
    }

    if (state.phase === 'returning' && currentWaypointIndex <= 0) {
      state.phase = 'landing';
      missionService.startReturn(state.missionId);

      let landingTicks = 0;
      const landingInterval = setInterval(() => {
        landingTicks++;
        state.currentAltitude = Math.max(0, state.currentAltitude - 10);
        state.currentSpeed = Math.max(0, state.currentSpeed - 2);
        this.sendTelemetry(state);

        if (landingTicks >= 3 || state.currentAltitude <= 0) {
          clearInterval(landingInterval);
          this.completeSimulation(state);
        }
      }, 1000);
      return;
    }

    if (state.phase === 'returning') {
      state.currentWaypointIndex = currentWaypointIndex - 1;
    } else {
      state.currentWaypointIndex = currentWaypointIndex + 1;
    }
  }

  private sendTelemetry(state: SimulationState) {
    missionService.addTelemetry({
      missionId: state.missionId,
      droneId: state.droneId,
      lat: state.currentLat,
      lng: state.currentLng,
      altitude: state.currentAltitude,
      speed: state.currentSpeed,
      heading: state.currentHeading,
      battery: state.battery,
      signalStrength: state.signalStrength,
      temperature: state.temperature
    });
  }

  private generateRandomAbnormal(): AbnormalType | null {
    const rand = Math.random();
    if (rand < 0.05) return AbnormalType.LOW_BATTERY;
    if (rand < 0.08) return AbnormalType.SIGNAL_LOST;
    if (rand < 0.09) return AbnormalType.GPS_ERROR;
    if (rand < 0.095) return AbnormalType.MOTOR_FAILURE;
    if (rand < 0.098) return AbnormalType.EMERGENCY_LANDING;
    return null;
  }

  private getAbnormalDescription(type: AbnormalType): string {
    const descriptions: Record<AbnormalType, string> = {
      [AbnormalType.LOW_BATTERY]: `无人机电量过低，当前电量: ${Math.floor(Math.random() * 15) + 10}%`,
      [AbnormalType.SIGNAL_LOST]: `无人机信号连接弱，请检查通信链路`,
      [AbnormalType.GPS_ERROR]: 'GPS信号丢失，切换至惯性导航',
      [AbnormalType.MOTOR_FAILURE]: '检测到电机异常，已启动安全模式',
      [AbnormalType.EMERGENCY_LANDING]: '紧急情况，执行迫降程序',
      [AbnormalType.WEATHER]: '检测到恶劣天气条件',
      [AbnormalType.COLLISION_RISK]: '前方检测到碰撞风险',
      [AbnormalType.SYSTEM_ERROR]: '系统错误',
      [AbnormalType.NO_FLY_ZONE]: '进入禁飞区'
    };
    return descriptions[type];
  }

  private emergencyLanding(state: SimulationState) {
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    const landingInterval = setInterval(() => {
      state.currentAltitude = Math.max(0, state.currentAltitude - 15);
      state.currentSpeed = Math.max(0, state.currentSpeed - 3);
      this.sendTelemetry(state);

      if (state.currentAltitude <= 0) {
        clearInterval(landingInterval);
        droneRepository.updateStatus(state.droneId, DroneStatus.ERROR);
        activeSimulations.delete(state.missionId);
      }
    }, 1000);
  }

  private completeSimulation(state: SimulationState) {
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    const actualFlightTime = Math.floor((Date.now() - state.startTime) / 1000);
    const batteryUsed = 95 - state.battery;
    const receiptImage = this.generateReceiptImage();

    missionService.completeMission(state.missionId, {
      actualFlightTime,
      actualDistance: Math.round(state.distanceTraveled),
      batteryUsed: Math.round(batteryUsed),
      maxAltitude: Math.round(state.maxAltitude),
      maxSpeed: Math.round(state.maxSpeed)
    });

    const receiptUrl = `/api/orders/${state.orderId}/receipt`;
    orderService.markDelivered(state.orderId, receiptImage, receiptUrl);

    activeSimulations.delete(state.missionId);
  }

  private generateReceiptImage(): string {
    const timestamp = new Date().toISOString();
    const signature = generateId('sig').substring(0, 8).toUpperCase();
    return `data:image/png;base64,${Buffer.from(`Drone Delivery Receipt\nTimestamp: ${timestamp}\nSignature: ${signature}`).toString('base64')}`;
  }

  private calculateHeading(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
    let heading = Math.atan2(y, x) * 180 / Math.PI;
    return (heading + 360) % 360;
  }

  stopSimulation(missionId: string): boolean {
    const state = activeSimulations.get(missionId);
    if (!state) return false;

    if (state.intervalId) {
      clearInterval(state.intervalId);
    }
    activeSimulations.delete(missionId);
    return true;
  }

  getSimulationState(missionId: string): SimulationState | null {
    return activeSimulations.get(missionId) || null;
  }

  getAllActiveSimulations(): string[] {
    return Array.from(activeSimulations.keys());
  }
}

export const droneSimulatorService = new DroneSimulatorService();
