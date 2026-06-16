import { BaseRepository } from './BaseRepository';
import { NoFlyZone, NoFlyZoneType } from '../../shared/types';
import { queryOne, queryMany, execute } from '../database';
import { generateId } from '../utils/helpers';

interface NoFlyZoneRow {
  id: string;
  name: string;
  type: NoFlyZoneType;
  coordinates: string;
  min_altitude: number;
  max_altitude: number;
  effective_from?: string;
  effective_to?: string;
  reason: string;
  is_active?: number;
  created_at: string;
}

export class NoFlyZoneRepository extends BaseRepository<NoFlyZone> {
  protected tableName = 'no_fly_zones';

  protected mapRow(row: NoFlyZoneRow): NoFlyZone {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      coordinates: JSON.parse(row.coordinates),
      minAltitude: row.min_altitude,
      maxAltitude: row.max_altitude,
      effectiveFrom: row.effective_from,
      effectiveTo: row.effective_to,
      reason: row.reason,
      isActive: row.is_active !== undefined ? row.is_active === 1 : true,
      createdAt: row.created_at
    };
  }

  findByType(type: NoFlyZoneType): NoFlyZone[] {
    const sql = `SELECT * FROM no_fly_zones WHERE type = ? ORDER BY created_at DESC`;
    const rows = queryMany<NoFlyZoneRow>(sql, [type]);
    return rows.map(row => this.mapRow(row));
  }

  findActive(): NoFlyZone[] {
    const sql = `
      SELECT * FROM no_fly_zones 
      WHERE is_active = 1
        AND (effective_from IS NULL OR effective_from <= CURRENT_TIMESTAMP)
        AND (effective_to IS NULL OR effective_to >= CURRENT_TIMESTAMP)
      ORDER BY created_at DESC
    `;
    const rows = queryMany<NoFlyZoneRow>(sql);
    return rows.map(row => this.mapRow(row));
  }

  create(data: {
    name: string;
    type: NoFlyZoneType;
    coordinates: { lat: number; lng: number }[];
    minAltitude: number;
    maxAltitude: number;
    effectiveFrom?: string;
    effectiveTo?: string;
    reason: string;
  }): NoFlyZone {
    const id = generateId('nfz');
    const sql = `
      INSERT INTO no_fly_zones (id, name, type, coordinates, min_altitude, max_altitude, effective_from, effective_to, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    execute(sql, [
      id,
      data.name,
      data.type,
      JSON.stringify(data.coordinates),
      data.minAltitude,
      data.maxAltitude,
      data.effectiveFrom || null,
      data.effectiveTo || null,
      data.reason
    ]);
    return this.findById(id)!;
  }

  update(id: string, data: Partial<{
    name: string;
    type: NoFlyZoneType;
    coordinates: { lat: number; lng: number }[];
    minAltitude: number;
    maxAltitude: number;
    effectiveFrom: string;
    effectiveTo: string;
    reason: string;
    isActive: boolean;
  }>): NoFlyZone | null {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
    if (data.type !== undefined) { fields.push('type = ?'); params.push(data.type); }
    if (data.coordinates !== undefined) { fields.push('coordinates = ?'); params.push(JSON.stringify(data.coordinates)); }
    if (data.minAltitude !== undefined) { fields.push('min_altitude = ?'); params.push(data.minAltitude); }
    if (data.maxAltitude !== undefined) { fields.push('max_altitude = ?'); params.push(data.maxAltitude); }
    if (data.effectiveFrom !== undefined) { fields.push('effective_from = ?'); params.push(data.effectiveFrom || null); }
    if (data.effectiveTo !== undefined) { fields.push('effective_to = ?'); params.push(data.effectiveTo || null); }
    if (data.reason !== undefined) { fields.push('reason = ?'); params.push(data.reason); }
    if (data.isActive !== undefined) { fields.push('is_active = ?'); params.push(data.isActive ? 1 : 0); }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    const sql = `UPDATE no_fly_zones SET ${fields.join(', ')} WHERE id = ?`;
    execute(sql, params);
    return this.findById(id);
  }

  toggleActive(id: string, isActive: boolean): NoFlyZone | null {
    const sql = `UPDATE no_fly_zones SET is_active = ? WHERE id = ?`;
    execute(sql, [isActive ? 1 : 0, id]);
    return this.findById(id);
  }
}

export const noFlyZoneRepository = new NoFlyZoneRepository();
