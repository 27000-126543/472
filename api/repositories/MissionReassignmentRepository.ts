import { BaseRepository } from './BaseRepository';
import { MissionReassignment } from '../../shared/types';
import { queryOne, queryMany, execute } from '../database';
import { generateId } from '../utils/helpers';

interface MissionReassignmentRow {
  id: string;
  mission_id: string;
  order_id: string;
  old_drone_id: string;
  new_drone_id: string;
  reassigned_by: string;
  reason?: string;
  created_at: string;
}

export class MissionReassignmentRepository extends BaseRepository<MissionReassignment> {
  protected tableName = 'mission_reassignments';

  protected mapRow(row: MissionReassignmentRow): MissionReassignment {
    return {
      id: row.id,
      missionId: row.mission_id,
      orderId: row.order_id,
      oldDroneId: row.old_drone_id,
      newDroneId: row.new_drone_id,
      reassignedBy: row.reassigned_by,
      reason: row.reason,
      createdAt: row.created_at
    };
  }

  findByMissionId(missionId: string): MissionReassignment[] {
    const sql = `
      SELECT * FROM mission_reassignments 
      WHERE mission_id = ? 
      ORDER BY created_at DESC
    `;
    const rows = queryMany<MissionReassignmentRow>(sql, [missionId]);
    return rows.map(row => this.mapRow(row));
  }

  findByOrderId(orderId: string): MissionReassignment[] {
    const sql = `
      SELECT * FROM mission_reassignments 
      WHERE order_id = ? 
      ORDER BY created_at DESC
    `;
    const rows = queryMany<MissionReassignmentRow>(sql, [orderId]);
    return rows.map(row => this.mapRow(row));
  }

  create(data: {
    missionId: string;
    orderId: string;
    oldDroneId: string;
    newDroneId: string;
    reassignedBy: string;
    reason?: string;
  }): MissionReassignment {
    const id = generateId('reassign');
    const sql = `
      INSERT INTO mission_reassignments 
        (id, mission_id, order_id, old_drone_id, new_drone_id, reassigned_by, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    execute(sql, [
      id,
      data.missionId,
      data.orderId,
      data.oldDroneId,
      data.newDroneId,
      data.reassignedBy,
      data.reason || null
    ]);
    return this.findById(id)!;
  }
}

export const missionReassignmentRepository = new MissionReassignmentRepository();
