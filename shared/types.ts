export enum UserRole {
  USER = 'user',
  OPERATOR = 'operator',
  DISPATCHER = 'dispatcher',
  ADMIN = 'admin',
}

export enum OrderStatus {
  PENDING_PLANNING = 'pending_planning',
  PENDING_ASSIGNMENT = 'pending_assignment',
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_TRANSIT = 'in_transit',
  FLYING = 'flying',
  DELIVERED = 'delivered',
  RETURNING = 'returning',
  RECEIVED = 'received',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  ERROR = 'error',
}

export enum DroneStatus {
  IDLE = 'idle',
  CHARGING = 'charging',
  READY = 'ready',
  IN_FLIGHT = 'in_flight',
  FLYING = 'flying',
  DELIVERING = 'delivering',
  RETURNING = 'returning',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
}

export enum MissionStatus {
  PENDING = 'pending',
  READY = 'ready',
  TAKEOFF = 'takeoff',
  CRUISE = 'cruise',
  FLYING = 'flying',
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
  RETURNING = 'returning',
  COMPLETED = 'completed',
  ABORTED = 'aborted',
}

export enum NotificationType {
  ORDER_CREATED = 'order_created',
  FLIGHT_ABNORMAL = 'flight_abnormal',
  MISSION_COMPLETED = 'mission_completed',
  SYSTEM_ALERT = 'system_alert',
}

export enum NoFlyZoneType {
  RESTRICTED = 'restricted',
  WARNING = 'warning',
  FORBIDDEN = 'forbidden',
}

export enum AbnormalType {
  LOW_BATTERY = 'low_battery',
  SIGNAL_LOST = 'signal_lost',
  WEATHER = 'weather',
  COLLISION_RISK = 'collision_risk',
  SYSTEM_ERROR = 'system_error',
  NO_FLY_ZONE = 'no_fly_zone',
  GPS_ERROR = 'gps_error',
  MOTOR_FAILURE = 'motor_failure',
  EMERGENCY_LANDING = 'emergency_landing',
}

export enum Severity {
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  fullName?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Drone {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  maxPayload: number;
  maxFlightTime: number;
  cruiseSpeed: number;
  status: DroneStatus;
  battery: number;
  batteryLevel: number;
  signalStrength: number;
  operatorId?: string;
  currentLat?: number;
  currentLng?: number;
  altitude?: number;
  lastMaintenance?: string;
  nextMaintenance?: string;
  createdAt: string;
}

export interface NoFlyZone {
  id: string;
  name: string;
  type: NoFlyZoneType;
  coordinates: { lat: number; lng: number }[];
  minAltitude: number;
  maxAltitude: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  reason: string;
  isActive: boolean;
  createdAt: string;
}

export interface FlightRoute {
  id: string;
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
  createdAt: string;
}

export interface Order {
  id: string;
  orderNo: string;
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
  actualCost?: number;
  totalCost?: number;
  distance?: number;
  status: OrderStatus;
  droneId?: string;
  routeId?: string;
  missionId?: string;
  receiptImage?: string;
  receiptUrl?: string;
  receiptProof?: string;
  remark?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}

export interface FlightMission {
  id: string;
  missionNo: string;
  orderId: string;
  droneId: string;
  routeId: string;
  operatorId?: string;
  status: MissionStatus;
  startTime?: string;
  takeoffTime?: string;
  deliveryTime?: string;
  returnTime?: string;
  endTime?: string;
  actualFlightTime?: number;
  actualDistance?: number;
  batteryUsed?: number;
  maxAltitude?: number;
  maxSpeed?: number;
  createdAt: string;
}

export interface TelemetryData {
  id: string;
  missionId: string;
  droneId: string;
  timestamp: string;
  lat: number;
  lng: number;
  altitude: number;
  speed: number;
  heading: number;
  battery: number;
  batteryLevel: number;
  signalStrength: number;
  temperature: number;
  isAbnormal: boolean;
  abnormalType?: AbnormalType;
}

export interface AbnormalEvent {
  id: string;
  missionId: string;
  type: AbnormalType;
  severity: Severity;
  timestamp: string;
  description: string;
  handled: boolean;
  resolved: boolean;
  handledAt?: string;
  handlerId?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  relatedId?: string;
  relatedType?: string;
  recipientIds: string[];
  readBy: string[];
  isRead?: boolean;
  createdAt: string;
}

export interface DailyReport {
  id: string;
  date: string;
  reportDate: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  totalFlightTime: number;
  totalDistance: number;
  avgDeliveryTime: number;
  successRate: number;
  abnormalCount: number;
  abnormalStats: {
    total: number;
    critical: number;
    warning: number;
    unhandled: number;
  };
  dronesActive: number;
  dronesInMaintenance: number;
  revenue: number;
  generatedAt: string;
}

export interface CreateDroneRequest {
  name: string;
  model: string;
  serialNumber: string;
  maxPayload: number;
  maxFlightTime: number;
  cruiseSpeed: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateOrderRequest {
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
  remark?: string;
}

export interface PlanRouteRequest {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  packageWeight: number;
}

export interface PlanRouteResponse {
  route: FlightRoute;
  availableDrones: Drone[];
  estimatedCost: number;
  distance: number;
  estimatedDuration: number;
  waypoints: { lat: number; lng: number; altitude: number }[];
  avoidedZones?: string[];
}

export interface CreateNoFlyZoneRequest {
  name: string;
  type: NoFlyZoneType;
  coordinates: { lat: number; lng: number }[];
  minAltitude: number;
  maxAltitude: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  reason: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  phone: string;
  fullName?: string;
  role: UserRole;
  password: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  phone?: string;
  fullName?: string;
  role?: UserRole;
  password?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
