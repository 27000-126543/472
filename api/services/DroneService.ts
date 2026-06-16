import { droneRepository } from '../repositories/DroneRepository';
import { Drone, DroneStatus } from '../../shared/types';

export class DroneService {
  getAll(): Drone[] {
    return droneRepository.findAll();
  }

  getById(id: string): Drone | null {
    return droneRepository.findById(id);
  }

  getByStatus(status: DroneStatus): Drone[] {
    return droneRepository.findByStatus(status);
  }

  getAvailableForPayload(weight: number): Drone[] {
    return droneRepository.findAvailableForPayload(weight);
  }

  create(data: {
    name: string;
    model: string;
    serialNumber: string;
    maxPayload: number;
    maxFlightTime: number;
    cruiseSpeed: number;
  }): Drone {
    return droneRepository.create(data);
  }

  update(id: string, data: Partial<{
    name: string;
    model: string;
    serialNumber: string;
    maxPayload: number;
    maxFlightTime: number;
    cruiseSpeed: number;
    status: DroneStatus;
    battery: number;
  }>): Drone | null {
    return droneRepository.update(id, data);
  }

  updateStatus(id: string, status: DroneStatus): Drone | null {
    return droneRepository.updateStatus(id, status);
  }

  updateBattery(id: string, battery: number): Drone | null {
    return droneRepository.updateBattery(id, battery);
  }

  updatePosition(id: string, lat: number, lng: number, altitude: number): Drone | null {
    return droneRepository.updatePosition(id, lat, lng, altitude);
  }

  delete(id: string): boolean {
    return droneRepository.delete(id);
  }

  getStatusCount(): Record<DroneStatus, number> {
    return droneRepository.getStatusCount();
  }

  getRealTimeStatus(id: string): {
    drone: Drone | null;
    battery: number;
    isCharging: boolean;
    lastUpdate: string;
  } {
    const drone = this.getById(id);
    return {
      drone,
      battery: drone?.battery ?? 0,
      isCharging: drone?.status === 'charging',
      lastUpdate: new Date().toISOString()
    };
  }
}

export const droneService = new DroneService();
