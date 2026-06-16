import { BaseRepository } from './BaseRepository';
import { DailyReport } from '../../shared/types';
import { queryOne, queryMany, execute } from '../database';

interface DailyReportRow {
  id: string;
  date: string;
  report_date: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_orders: number;
  total_flight_time: number;
  total_distance: number;
  avg_delivery_time: number;
  success_rate: number;
  abnormal_count: number;
  abnormal_stats: string;
  drones_active: number;
  drones_in_maintenance: number;
  revenue: number;
  generated_at: string;
}

export class DailyReportRepository extends BaseRepository<DailyReport> {
  protected tableName = 'daily_reports';

  protected mapRow(row: DailyReportRow): DailyReport {
    let abnormalStats;
    try {
      abnormalStats = row.abnormal_stats ? JSON.parse(row.abnormal_stats) : {
        total: row.abnormal_count,
        critical: Math.floor(row.abnormal_count * 0.3),
        warning: Math.floor(row.abnormal_count * 0.7),
        unhandled: Math.floor(row.abnormal_count * 0.4)
      };
    } catch {
      abnormalStats = {
        total: row.abnormal_count,
        critical: Math.floor(row.abnormal_count * 0.3),
        warning: Math.floor(row.abnormal_count * 0.7),
        unhandled: Math.floor(row.abnormal_count * 0.4)
      };
    }
    return {
      id: row.id,
      date: row.date,
      reportDate: row.report_date || row.date,
      totalOrders: row.total_orders,
      completedOrders: row.completed_orders,
      cancelledOrders: row.cancelled_orders,
      pendingOrders: row.pending_orders || 0,
      totalFlightTime: row.total_flight_time,
      totalDistance: row.total_distance,
      avgDeliveryTime: row.avg_delivery_time,
      successRate: row.success_rate,
      abnormalCount: row.abnormal_count,
      abnormalStats,
      dronesActive: row.drones_active,
      dronesInMaintenance: row.drones_in_maintenance,
      revenue: row.revenue,
      generatedAt: row.generated_at
    };
  }

  findByDate(date: string): DailyReport | null {
    const sql = `SELECT * FROM daily_reports WHERE date = ?`;
    const row = queryOne<DailyReportRow>(sql, [date]);
    return row ? this.mapRow(row) : null;
  }

  findByDateRange(startDate: string, endDate: string): DailyReport[] {
    const sql = `SELECT * FROM daily_reports WHERE date >= ? AND date <= ? ORDER BY date DESC`;
    const rows = queryMany<DailyReportRow>(sql, [startDate, endDate]);
    return rows.map(row => this.mapRow(row));
  }

  create(data: DailyReport): DailyReport {
    const sql = `
      INSERT OR REPLACE INTO daily_reports (
        id, date, report_date, total_orders, completed_orders, cancelled_orders, pending_orders,
        total_flight_time, total_distance, avg_delivery_time, success_rate,
        abnormal_count, abnormal_stats, drones_active, drones_in_maintenance, revenue, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    execute(sql, [
      data.id, data.date, data.reportDate, data.totalOrders, data.completedOrders, data.cancelledOrders, data.pendingOrders,
      data.totalFlightTime, data.totalDistance, data.avgDeliveryTime, data.successRate,
      data.abnormalCount, JSON.stringify(data.abnormalStats), data.dronesActive, data.dronesInMaintenance, data.revenue, data.generatedAt
    ]);
    return this.findByDate(data.date)!;
  }

  getLatest(limit: number = 30): DailyReport[] {
    const sql = `SELECT * FROM daily_reports ORDER BY date DESC LIMIT ?`;
    const rows = queryMany<DailyReportRow>(sql, [limit]);
    return rows.map(row => this.mapRow(row));
  }
}

export const dailyReportRepository = new DailyReportRepository();
