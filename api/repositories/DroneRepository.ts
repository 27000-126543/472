import { BaseRepository } from './BaseRepository';
import { Drone, DroneStatus } from '../../shared/types';
import { queryOne, queryMany, execute } from '../database';
import { generateId } from '../utils/helpers';

interface DroneRow {
  id: string;
  name: string;
  model: string;
  serial_number: string;
  max_payload: number;
  max_flight_time: number;
  cruise_speed: number;
  status: DroneStatus;
  battery: number;
  current_lat?: number;
  current_lng?: number;
  altitude?: number;
  last_maintenance?: string;
  next_maintenance?: string;
  created_at: string;
}

export class DroneRepository extends BaseRepository<Drone> {
  protected tableName = 'drones';

  protected mapRow(row: DroneRow): Drone {
    return {
      id: row.id,
      name: row.name,
      model: row.model,
      serialNumber: row.serial_number,
      maxPayload: row.max_payload,
      maxFlightTime: row.max_flight_time,
      cruiseSpeed: row.cruise_speed,
      status: row.status,
      battery: row.battery,
      batteryLevel: row.battery,
      signalStrength: 100,
      currentLat: row.current_lat,
      currentLng: row.current_lng,
      altitude: row.altitude,
      lastMaintenance: row.last_maintenance,
      nextMaintenance: row.next_maintenance,
      createdAt: row.created_at
    };
  }

  findByStatus(status: DroneStatus): Drone[] {
    const sql = `SELECT * FROM drones WHERE status = ? ORDER BY created_at DESC`;
    const rows = queryMany<DroneRow>(sql, [status]);
    return rows.map(row => this.mapRow(row));
  }

  findAvailableForPayload(weight: number): Drone[] {
    const sql = `
      SELECT * FROM drones 
      WHERE status = 'ready' 
        AND max_payload >= ? 
        AND battery >= 20
      ORDER BY battery DESC
    `;
    const rows = queryMany<DroneRow>(sql, [weight]);
    return rows.map(row => this.mapRow(row));
  }

  create(data: {
    name: string;
    model: string;
    serialNumber: string;
    maxPayload: number;
    maxFlightTime: number;
    cruiseSpeed: number;
    status?: DroneStatus;
    battery?: number;
  }): Drone {
    const id = generateId('drone');
    const sql = `
      INSERT INTO drones (id, name, model, serial_number, max_payload, max_flight_time, cruise_speed, status, battery)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    execute(sql, [
      id,
      data.name,
      data.model,
      data.serialNumber,
      data.maxPayload,
      data.maxFlightTime,
      data.cruiseSpeed,
      data.status || 'idle',
      data.battery ?? 100
    ]);
    return this.findById(id)!;
  }

  updateStatus(id: string, status: DroneStatus): Drone | null {
    const sql = `UPDATE drones SET status = ? WHERE id = ?`;
    execute(sql, [status, id]);
    return this.findById(id);
  }

  updateBattery(id: string, battery: number): Drone | null {
    const sql = `UPDATE drones SET battery = ? WHERE id = ?`;
    execute(sql, [battery, id]);
    return this.findById(id);
  }

  updatePosition(id: string, lat: number, lng: number, altitude: number): Drone | null {
    const sql = `UPDATE drones SET current_lat = ?, current_lng = ?, altitude = ? WHERE id = ?`;
    execute(sql, [lat, lng, altitude, id]);
    return this.findById(id);
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
    lastMaintenance: string;
    nextMaintenance: string;
  }>): Drone | null {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
    if (data.model !== undefined) { fields.push('model = ?'); params.push(data.model); }
    if (data.serialNumber !== undefined) { fields.push('serial_number = ?'); params.push(data.serialNumber); }
    if (data.maxPayload !== undefined) { fields.push('max_payload = ?'); params.push(data.maxPayload); }
    if (data.maxFlightTime !== undefined) { fields.push('max_flight_time = ?'); params.push(data.maxFlightTime); }
    if (data.cruiseSpeed !== undefined) { fields.push('cruise_speed = ?'); params.push(data.cruiseSpeed); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }
    if (data.battery !== undefined) { fields.push('battery = ?'); params.push(data.battery); }
    if (data.lastMaintenance !== undefined) { fields.push('last_maintenance = ?'); params.push(data.lastMaintenance); }
    if (data.nextMaintenance !== undefined) { fields.push('next_maintenance = ?'); params.push(data.nextMaintenance); }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    const sql = `UPDATE drones SET ${fields.join(', ')} WHERE id = ?`;
    execute(sql, params);
    return this.findById(id);
  }

  getStatusCount(): Record<DroneStatus, number> {
    const sql = `SELECT status, COUNT(*) as count FROM drones GROUP BY status`;
    const rows = queryMany<{ status: DroneStatus; count: number }>(sql);
    const result: Record<DroneStatus, number> = {
      [DroneStatus.IDLE]: 0,
      [DroneStatus.CHARGING]: 0,
      [DroneStatus.READY]: 0,
      [DroneStatus.IN_FLIGHT]: 0,
      [DroneStatus.FLYING]: 0,
      [DroneStatus.DELIVERING]: 0,
      [DroneStatus.RETURNING]: 0,
      [DroneStatus.MAINTENANCE]: 0,
      [DroneStatus.ERROR]: 0,
    };
    for (const row of rows) {
      result[row.status] = row.count;
    }
    return result;
  }
}

export const droneRepository = new DroneRepository();
