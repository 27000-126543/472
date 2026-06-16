import { BaseRepository } from './BaseRepository';
import { FlightRoute } from '../../shared/types';
import { queryOne, queryMany, execute } from '../database';
import { generateId } from '../utils/helpers';

interface FlightRouteRow {
  id: string;
  order_id: string;
  start_lat: number;
  start_lng: number;
  start_address: string;
  end_lat: number;
  end_lng: number;
  end_address: string;
  waypoints: string;
  distance: number;
  estimated_time: number;
  estimated_battery: number;
  is_valid: number;
  validation_errors?: string;
  created_at: string;
}

export class FlightRouteRepository extends BaseRepository<FlightRoute> {
  protected tableName = 'flight_routes';

  protected mapRow(row: FlightRouteRow): FlightRoute {
    return {
      id: row.id,
      orderId: row.order_id,
      startLat: row.start_lat,
      startLng: row.start_lng,
      startAddress: row.start_address,
      endLat: row.end_lat,
      endLng: row.end_lng,
      endAddress: row.end_address,
      waypoints: JSON.parse(row.waypoints),
      distance: row.distance,
      estimatedTime: row.estimated_time,
      estimatedBattery: row.estimated_battery,
      isValid: row.is_valid === 1,
      validationErrors: row.validation_errors ? JSON.parse(row.validation_errors) : undefined,
      createdAt: row.created_at
    };
  }

  findByOrderId(orderId: string): FlightRoute | null {
    const sql = `SELECT * FROM flight_routes WHERE order_id = ?`;
    const row = queryOne<FlightRouteRow>(sql, [orderId]);
    return row ? this.mapRow(row) : null;
  }

  create(data: {
    orderId: string;
    startLat: number;
    startLng: number;
    startAddress: string;
    endLat: number;
    endLng: number;
    endAddress: string;
    waypoints: { lat: number; lng: number; altitude: number }[];
    distance: number;
    estimatedTime: number;
    estimatedBattery: number;
    isValid: boolean;
    validationErrors?: string[];
  }): FlightRoute {
    const id = generateId('route');
    const sql = `
      INSERT INTO flight_routes (
        id, order_id, start_lat, start_lng, start_address,
        end_lat, end_lng, end_address, waypoints, distance,
        estimated_time, estimated_battery, is_valid, validation_errors
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    execute(sql, [
      id, data.orderId,
      data.startLat, data.startLng, data.startAddress,
      data.endLat, data.endLng, data.endAddress,
      JSON.stringify(data.waypoints),
      data.distance,
      data.estimatedTime,
      data.estimatedBattery,
      data.isValid ? 1 : 0,
      data.validationErrors ? JSON.stringify(data.validationErrors) : null
    ]);
    return this.findById(id)!;
  }

  invalidate(id: string, errors: string[]): FlightRoute | null {
    const sql = `
      UPDATE flight_routes 
      SET is_valid = 0, validation_errors = ? 
      WHERE id = ?
    `;
    execute(sql, [JSON.stringify(errors), id]);
    return this.findById(id);
  }
}

export const flightRouteRepository = new FlightRouteRepository();
