import { v4 as uuidv4 } from 'uuid';

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${uuidv4().slice(0, 8)}`;
}

export function generateOrderNo(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DD${dateStr}${random}`;
}

export function generateMissionNo(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FM${dateStr}${random}`;
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function calculateCost(distance: number, weight: number): number {
  const baseCost = 15;
  const distanceCost = (distance / 1000) * 2;
  const weightCost = weight * 5;
  return Math.round((baseCost + distanceCost + weightCost) * 100) / 100;
}

export function pointInPolygon(point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;

    if (((yi > point.lng) !== (yj > point.lng)) &&
      (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs}秒`;
}

export function generateReceiptProof(order: {
  id: string;
  orderNo: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  deliveredAt?: string;
}): string {
  const now = new Date();
  const proof = {
    orderId: order.id,
    orderNo: order.orderNo,
    receiverName: order.receiverName,
    receiverPhone: order.receiverPhone,
    receiverAddress: order.receiverAddress,
    deliveredAt: order.deliveredAt || now.toISOString(),
    receivedAt: now.toISOString(),
    verificationCode: `REC-${order.orderNo}-${now.getTime().toString(36).toUpperCase()}`,
    timestamp: now.getTime()
  };
  return JSON.stringify(proof, null, 2);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
