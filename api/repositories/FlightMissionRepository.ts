import { BaseRepository } from './BaseRepository';
import { FlightMission, MissionStatus } from '../../shared/types';
import { queryOne, queryMany, execute } from '../database';
import { generateId, generateMissionNo } from '../utils/helpers';

interface FlightMissionRow {
  id: string;
  mission_no: string;
  order_id: string;
  drone_id: string;
  route_id: string;
  operator_id?: string;
  status: MissionStatus;
  start_time?: string;
  takeoff_time?: string;
  delivery_time?: string;
  return_time?: string;
  end_time?: string;
  actual_flight_time?: number;
  actual_distance?: number;
  battery_used?: number;
  max_altitude?: number;
  max_speed?: number;
  created_at: string;
  updated_at?: string;
}

export class FlightMissionRepository extends BaseRepository<FlightMission> {
  protected tableName = 'flight_missions';

  protected mapRow(row: FlightMissionRow): FlightMission {
    return {
      id: row.id,
      missionNo: row.mission_no,
      orderId: row.order_id,
      droneId: row.drone_id,
      routeId: row.route_id,
      operatorId: row.operator_id,
      status: row.status,
      startTime: row.start_time,
      takeoffTime: row.takeoff_time,
      deliveryTime: row.delivery_time,
      returnTime: row.return_time,
      endTime: row.end_time,
      completedAt: row.end_time,
      actualFlightTime: row.actual_flight_time,
      actualDistance: row.actual_distance,
      batteryUsed: row.battery_used,
      maxAltitude: row.max_altitude,
      maxSpeed: row.max_speed,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  findByDroneId(droneId: string): FlightMission[] {
    const sql = `SELECT * FROM flight_missions WHERE drone_id = ? ORDER BY created_at DESC`;
    const rows = queryMany<FlightMissionRow>(sql, [droneId]);
    return rows.map(row => this.mapRow(row));
  }

  findByOperatorId(operatorId: string, status?: MissionStatus): FlightMission[] {
    let sql = `SELECT * FROM flight_missions WHERE operator_id = ?`;
    const params: any[] = [operatorId];
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY created_at DESC`;
    const rows = queryMany<FlightMissionRow>(sql, params);
    return rows.map(row => this.mapRow(row));
  }

  findByStatus(status: MissionStatus): FlightMission[] {
    const sql = `SELECT * FROM flight_missions WHERE status = ? ORDER BY created_at DESC`;
    const rows = queryMany<FlightMissionRow>(sql, [status]);
    return rows.map(row => this.mapRow(row));
  }

  findActiveMissions(): FlightMission[] {
    const sql = `SELECT * FROM flight_missions WHERE status IN ('flying', 'delivered', 'returning') ORDER BY created_at DESC`;
    const rows = queryMany<FlightMissionRow>(sql);
    return rows.map(row => this.mapRow(row));
  }

  findByOrderId(orderId: string): FlightMission | null {
    const sql = `SELECT * FROM flight_missions WHERE order_id = ?`;
    const row = queryOne<FlightMissionRow>(sql, [orderId]);
    return row ? this.mapRow(row) : null;
  }

  create(data: {
    orderId: string;
    droneId: string;
    routeId: string;
    operatorId?: string;
  }): FlightMission {
    const id = generateId('mission');
    const missionNo = generateMissionNo();
    const sql = `
      INSERT INTO flight_missions (id, mission_no, order_id, drone_id, route_id, operator_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    execute(sql, [id, missionNo, data.orderId, data.droneId, data.routeId, data.operatorId || null]);
    return this.findById(id)!;
  }

  updateStatus(id: string, status: MissionStatus): FlightMission | null {
    const sql = `UPDATE flight_missions SET status = ? WHERE id = ?`;
    execute(sql, [status, id]);
    return this.findById(id);
  }

  startMission(id: string, operatorId: string): FlightMission | null {
    const sql = `
      UPDATE flight_missions 
      SET status = 'ready', operator_id = ?, start_time = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    execute(sql, [operatorId, id]);
    return this.findById(id);
  }

  recordTakeoff(id: string): FlightMission | null {
    const sql = `
      UPDATE flight_missions 
      SET status = 'flying', takeoff_time = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    execute(sql, [id]);
    return this.findById(id);
  }

  recordDelivery(id: string): FlightMission | null {
    const sql = `
      UPDATE flight_missions 
      SET status = 'delivered', delivery_time = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    execute(sql, [id]);
    return this.findById(id);
  }

  startReturn(id: string): FlightMission | null {
    const sql = `
      UPDATE flight_missions 
      SET status = 'returning', return_time = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    execute(sql, [id]);
    return this.findById(id);
  }

  completeMission(id: string, data: {
    actualFlightTime: number;
    actualDistance: number;
    batteryUsed: number;
    maxAltitude: number;
    maxSpeed: number;
  }): FlightMission | null {
    const sql = `
      UPDATE flight_missions 
      SET status = 'completed', end_time = CURRENT_TIMESTAMP,
          actual_flight_time = ?, actual_distance = ?, battery_used = ?,
          max_altitude = ?, max_speed = ?
      WHERE id = ?
    `;
    execute(sql, [
      data.actualFlightTime, data.actualDistance, data.batteryUsed,
      data.maxAltitude, data.maxSpeed, id
    ]);
    return this.findById(id);
  }

  abortMission(id: string): FlightMission | null {
    const sql = `
      UPDATE flight_missions 
      SET status = 'aborted', end_time = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    execute(sql, [id]);
    return this.findById(id);
  }

  getStatisticsByDateRange(startDate: string, endDate: string): {
    totalMissions: number;
    completedMissions: number;
    totalFlightTime: number;
    totalDistance: number;
    avgFlightTime: number;
  } {
    const sql = `
      SELECT 
        COUNT(*) as totalMissions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedMissions,
        COALESCE(SUM(actual_flight_time), 0) as totalFlightTime,
        COALESCE(SUM(actual_distance), 0) as totalDistance,
        COALESCE(AVG(actual_flight_time), 0) as avgFlightTime
      FROM flight_missions 
      WHERE created_at >= ? AND created_at <= ?
    `;
    const result = queryOne<{
      totalMissions: number;
      completedMissions: number;
      totalFlightTime: number;
      totalDistance: number;
      avgFlightTime: number;
    }>(sql, [startDate, endDate]);
    return result || {
      totalMissions: 0, completedMissions: 0, totalFlightTime: 0,
      totalDistance: 0, avgFlightTime: 0
    };
  }

  reassignDrone(id: string, newDroneId: string): FlightMission | null {
    const sql = `
      UPDATE flight_missions 
      SET drone_id = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    execute(sql, [newDroneId, id]);
    return this.findById(id);
  }

  confirmReceipt(id: string): FlightMission | null {
    const sql = `
      UPDATE flight_missions 
      SET status = 'completed', end_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    execute(sql, [id]);
    return this.findById(id);
  }
}

export const flightMissionRepository = new FlightMissionRepository();
