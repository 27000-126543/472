import { BaseRepository } from './BaseRepository';
import { Order, OrderStatus } from '../../shared/types';
import { queryOne, queryMany, execute } from '../database';
import { generateId, generateOrderNo } from '../utils/helpers';

interface OrderRow {
  id: string;
  order_no: string;
  user_id: string;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  sender_lat: number;
  sender_lng: number;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  receiver_lat: number;
  receiver_lng: number;
  package_type: string;
  package_weight: number;
  package_length?: number;
  package_width?: number;
  package_height?: number;
  estimated_cost: number;
  actual_cost?: number;
  total_cost?: number;
  distance?: number;
  status: OrderStatus;
  drone_id?: string;
  route_id?: string;
  mission_id?: string;
  receipt_image?: string;
  receipt_url?: string;
  receipt_proof?: string;
  remark?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  delivered_at?: string;
  received_at?: string;
}

export class OrderRepository extends BaseRepository<Order> {
  protected tableName = 'orders';

  protected mapRow(row: OrderRow): Order {
    return {
      id: row.id,
      orderNo: row.order_no,
      userId: row.user_id,
      senderName: row.sender_name,
      senderPhone: row.sender_phone,
      senderAddress: row.sender_address,
      senderLat: row.sender_lat,
      senderLng: row.sender_lng,
      receiverName: row.receiver_name,
      receiverPhone: row.receiver_phone,
      receiverAddress: row.receiver_address,
      receiverLat: row.receiver_lat,
      receiverLng: row.receiver_lng,
      packageType: row.package_type,
      packageWeight: row.package_weight,
      packageLength: row.package_length,
      packageWidth: row.package_width,
      packageHeight: row.package_height,
      estimatedCost: row.estimated_cost,
      actualCost: row.actual_cost,
      totalCost: row.total_cost,
      distance: row.distance,
      status: row.status,
      droneId: row.drone_id,
      routeId: row.route_id,
      missionId: row.mission_id,
      receiptImage: row.receipt_image,
      receiptUrl: row.receipt_url,
      receiptProof: row.receipt_proof,
      remark: row.remark,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deliveredAt: row.delivered_at,
      receivedAt: row.received_at
    };
  }

  findByUserId(userId: string, status?: OrderStatus): Order[] {
    let sql = `SELECT * FROM orders WHERE user_id = ?`;
    const params: any[] = [userId];
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY created_at DESC`;
    const rows = queryMany<OrderRow>(sql, params);
    return rows.map(row => this.mapRow(row));
  }

  findByStatus(status: OrderStatus): Order[] {
    const sql = `SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC`;
    const rows = queryMany<OrderRow>(sql, [status]);
    return rows.map(row => this.mapRow(row));
  }

  findByOrderNo(orderNo: string): Order | null {
    const sql = `SELECT * FROM orders WHERE order_no = ?`;
    const row = queryOne<OrderRow>(sql, [orderNo]);
    return row ? this.mapRow(row) : null;
  }

  create(data: {
    userId: string;
    senderName: string;
    senderPhone: string;
    senderAddress: string;
    senderLat: number;
    senderLng: number;
    receiverName: string;
    receiverPhone: string;
    receiverAddress: string;
    receiverLat: number;
    receiverLng: number;
    packageType: string;
    packageWeight: number;
    packageLength?: number;
    packageWidth?: number;
    packageHeight?: number;
    estimatedCost: number;
    remark?: string;
  }): Order {
    const id = generateId('order');
    const orderNo = generateOrderNo();
    const sql = `
      INSERT INTO orders (
        id, order_no, user_id, sender_name, sender_phone, sender_address, sender_lat, sender_lng,
        receiver_name, receiver_phone, receiver_address, receiver_lat, receiver_lng,
        package_type, package_weight, package_length, package_width, package_height,
        estimated_cost, remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    execute(sql, [
      id, orderNo, data.userId,
      data.senderName, data.senderPhone, data.senderAddress, data.senderLat, data.senderLng,
      data.receiverName, data.receiverPhone, data.receiverAddress, data.receiverLat, data.receiverLng,
      data.packageType, data.packageWeight,
      data.packageLength || null, data.packageWidth || null, data.packageHeight || null,
      data.estimatedCost, data.remark || null
    ]);
    return this.findById(id)!;
  }

  updateStatus(id: string, status: OrderStatus): Order | null {
    const sql = `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    execute(sql, [status, id]);
    return this.findById(id);
  }

  assignDrone(id: string, droneId: string, routeId: string, missionId: string): Order | null {
    const sql = `
      UPDATE orders 
      SET drone_id = ?, route_id = ?, mission_id = ?, status = 'assigned', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    execute(sql, [droneId, routeId, missionId, id]);
    return this.findById(id);
  }

  markDelivered(id: string): Order | null {
    const sql = `
      UPDATE orders 
      SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    execute(sql, [id]);
    return this.findById(id);
  }

  markReceived(id: string, receiptImage: string, receiptUrl: string, receiptProof: string): Order | null {
    const sql = `
      UPDATE orders 
      SET status = 'received', receipt_image = ?, receipt_url = ?, receipt_proof = ?,
          received_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    execute(sql, [receiptImage, receiptUrl, receiptProof, id]);
    return this.findById(id);
  }

  findWithFilters(filters: {
    userId?: string;
    orderNo?: string;
    receiverName?: string;
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
  }): Order[] {
    let sql = `SELECT * FROM orders WHERE 1=1`;
    const params: any[] = [];

    if (filters.userId) {
      sql += ` AND user_id = ?`;
      params.push(filters.userId);
    }
    if (filters.orderNo) {
      sql += ` AND order_no LIKE ?`;
      params.push(`%${filters.orderNo}%`);
    }
    if (filters.receiverName) {
      sql += ` AND receiver_name LIKE ?`;
      params.push(`%${filters.receiverName}%`);
    }
    if (filters.status) {
      sql += ` AND status = ?`;
      params.push(filters.status);
    }
    if (filters.startDate) {
      sql += ` AND created_at >= ?`;
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      sql += ` AND created_at <= ?`;
      params.push(filters.endDate);
    }

    sql += ` ORDER BY created_at DESC`;
    const rows = queryMany<OrderRow>(sql, params);
    return rows.map(row => this.mapRow(row));
  }

  update(id: string, data: Partial<{
    status: OrderStatus;
    actualCost: number;
    remark: string;
  }>): Order | null {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }
    if (data.actualCost !== undefined) { fields.push('actual_cost = ?'); params.push(data.actualCost); }
    if (data.remark !== undefined) { fields.push('remark = ?'); params.push(data.remark); }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;
    execute(sql, params);
    return this.findById(id);
  }

  getStatisticsByDateRange(startDate: string, endDate: string): {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    pendingOrders: number;
    totalRevenue: number;
  } {
    const sql = `
      SELECT 
        COUNT(*) as totalOrders,
        SUM(CASE WHEN status IN ('completed', 'delivered', 'received') THEN 1 ELSE 0 END) as completedOrders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelledOrders,
        SUM(CASE WHEN status IN ('pending', 'pending_planning', 'pending_assignment', 'assigned') THEN 1 ELSE 0 END) as pendingOrders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN actual_cost ELSE estimated_cost END), 0) as totalRevenue
      FROM orders 
      WHERE created_at >= ? AND created_at <= ?
    `;
    const result = queryOne<{
      totalOrders: number;
      completedOrders: number;
      cancelledOrders: number;
      pendingOrders: number;
      totalRevenue: number;
    }>(sql, [startDate, endDate]);
    return result || { totalOrders: 0, completedOrders: 0, cancelledOrders: 0, pendingOrders: 0, totalRevenue: 0 };
  }

  updateReceiptImage(id: string, receiptImage: string): Order | null {
    const sql = `UPDATE orders SET receipt_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    execute(sql, [receiptImage, id]);
    return this.findById(id);
  }

  updateDroneId(id: string, droneId: string): Order | null {
    const sql = `UPDATE orders SET drone_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    execute(sql, [droneId, id]);
    return this.findById(id);
  }
}

export const orderRepository = new OrderRepository();
