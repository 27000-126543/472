import { BaseRepository } from './BaseRepository';
import { AbnormalEvent, AbnormalType, Severity } from '../../shared/types';
import { queryOne, queryMany, execute } from '../database';
import { generateId } from '../utils/helpers';

interface AbnormalEventRow {
  id: string;
  mission_id: string;
  type: AbnormalType;
  severity: Severity;
  timestamp: string;
  description: string;
  handled: number;
  handled_at?: string;
  handler_id?: string;
}

export class AbnormalEventRepository extends BaseRepository<AbnormalEvent> {
  protected tableName = 'abnormal_events';

  protected mapRow(row: AbnormalEventRow): AbnormalEvent {
    return {
      id: row.id,
      missionId: row.mission_id,
      type: row.type,
      severity: row.severity,
      timestamp: row.timestamp,
      description: row.description,
      handled: row.handled === 1,
      handledAt: row.handled_at,
      handlerId: row.handler_id,
      resolved: row.handled === 1
    };
  }

  findByMissionId(missionId: string): AbnormalEvent[] {
    const sql = `SELECT * FROM abnormal_events WHERE mission_id = ? ORDER BY timestamp DESC`;
    const rows = queryMany<AbnormalEventRow>(sql, [missionId]);
    return rows.map(row => this.mapRow(row));
  }

  findUnhandled(): AbnormalEvent[] {
    const sql = `SELECT * FROM abnormal_events WHERE handled = 0 ORDER BY timestamp DESC`;
    const rows = queryMany<AbnormalEventRow>(sql);
    return rows.map(row => this.mapRow(row));
  }

  findBySeverity(severity: Severity): AbnormalEvent[] {
    const sql = `SELECT * FROM abnormal_events WHERE severity = ? ORDER BY timestamp DESC`;
    const rows = queryMany<AbnormalEventRow>(sql, [severity]);
    return rows.map(row => this.mapRow(row));
  }

  create(data: {
    missionId: string;
    type: AbnormalType;
    severity: Severity;
    description: string;
  }): AbnormalEvent {
    const id = generateId('abn');
    const sql = `
      INSERT INTO abnormal_events (id, mission_id, type, severity, description)
      VALUES (?, ?, ?, ?, ?)
    `;
    execute(sql, [id, data.missionId, data.type, data.severity, data.description]);
    return this.findById(id)!;
  }

  markAsHandled(id: string, handlerId: string): AbnormalEvent | null {
    const sql = `
      UPDATE abnormal_events 
      SET handled = 1, handled_at = CURRENT_TIMESTAMP, handler_id = ? 
      WHERE id = ?
    `;
    execute(sql, [handlerId, id]);
    return this.findById(id);
  }

  getCountByDateRange(startDate: string, endDate: string): {
    total: number;
    critical: number;
    warning: number;
    unhandled: number;
  } {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning,
        SUM(CASE WHEN handled = 0 THEN 1 ELSE 0 END) as unhandled
      FROM abnormal_events 
      WHERE timestamp >= ? AND timestamp <= ?
    `;
    const result = queryOne<{
      total: number;
      critical: number;
      warning: number;
      unhandled: number;
    }>(sql, [startDate, endDate]);
    return result || { total: 0, critical: 0, warning: 0, unhandled: 0 };
  }
}

export const abnormalEventRepository = new AbnormalEventRepository();
