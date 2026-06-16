import { BaseRepository } from './BaseRepository';
import { TelemetryData, AbnormalType } from '../../shared/types';
import { queryOne, queryMany, execute } from '../database';
import { generateId } from '../utils/helpers';

interface TelemetryRow {
  id: string;
  mission_id: string;
  drone_id: string;
  timestamp: string;
  lat: number;
  lng: number;
  altitude: number;
  speed: number;
  heading: number;
  battery: number;
  signal_strength: number;
  temperature: number;
  is_abnormal: number;
  abnormal_type?: string;
}

export class TelemetryRepository extends BaseRepository<TelemetryData> {
  protected tableName = 'telemetry';

  protected mapRow(row: TelemetryRow): TelemetryData {
    return {
      id: row.id,
      missionId: row.mission_id,
      droneId: row.drone_id,
      timestamp: row.timestamp,
      lat: row.lat,
      lng: row.lng,
      altitude: row.altitude,
      speed: row.speed,
      heading: row.heading,
      battery: row.battery,
      batteryLevel: row.battery,
      signalStrength: row.signal_strength,
      temperature: row.temperature,
      isAbnormal: row.is_abnormal === 1,
      abnormalType: row.abnormal_type as AbnormalType | undefined
    };
  }

  findByMissionId(missionId: string, limit?: number): TelemetryData[] {
    let sql = `SELECT * FROM telemetry WHERE mission_id = ? ORDER BY timestamp DESC`;
    const params: any[] = [missionId];
    if (limit) {
      sql += ` LIMIT ?`;
      params.push(limit);
    }
    const rows = queryMany<TelemetryRow>(sql, params);
    return rows.map(row => this.mapRow(row));
  }

  findByDroneId(droneId: string, limit: number = 100): TelemetryData[] {
    const sql = `SELECT * FROM telemetry WHERE drone_id = ? ORDER BY timestamp DESC LIMIT ?`;
    const rows = queryMany<TelemetryRow>(sql, [droneId, limit]);
    return rows.map(row => this.mapRow(row));
  }

  findLatestByMissionId(missionId: string): TelemetryData | null {
    const sql = `SELECT * FROM telemetry WHERE mission_id = ? ORDER BY timestamp DESC LIMIT 1`;
    const row = queryOne<TelemetryRow>(sql, [missionId]);
    return row ? this.mapRow(row) : null;
  }

  create(data: {
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
    const id = generateId('tel');
    const sql = `
      INSERT INTO telemetry (
        id, mission_id, drone_id, lat, lng, altitude, speed, heading,
        battery, signal_strength, temperature, is_abnormal, abnormal_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    execute(sql, [
      id, data.missionId, data.droneId,
      data.lat, data.lng, data.altitude, data.speed, data.heading,
      data.battery, data.signalStrength, data.temperature,
      data.isAbnormal ? 1 : 0, data.abnormalType || null
    ]);
    return this.findById(id)!;
  }

  findAbnormalByMissionId(missionId: string): TelemetryData[] {
    const sql = `SELECT * FROM telemetry WHERE mission_id = ? AND is_abnormal = 1 ORDER BY timestamp DESC`;
    const rows = queryMany<TelemetryRow>(sql, [missionId]);
    return rows.map(row => this.mapRow(row));
  }

  getMissionSummary(missionId: string): {
    maxAltitude: number;
    maxSpeed: number;
    avgBattery: number;
    minBattery: number;
    abnormalCount: number;
  } {
    const sql = `
      SELECT 
        MAX(altitude) as maxAltitude,
        MAX(speed) as maxSpeed,
        AVG(battery) as avgBattery,
        MIN(battery) as minBattery,
        SUM(CASE WHEN is_abnormal = 1 THEN 1 ELSE 0 END) as abnormalCount
      FROM telemetry WHERE mission_id = ?
    `;
    const result = queryOne<{
      maxAltitude: number;
      maxSpeed: number;
      avgBattery: number;
      minBattery: number;
      abnormalCount: number;
    }>(sql, [missionId]);
    return result || {
      maxAltitude: 0, maxSpeed: 0, avgBattery: 0, minBattery: 0, abnormalCount: 0
    };
  }
}

export const telemetryRepository = new TelemetryRepository();
