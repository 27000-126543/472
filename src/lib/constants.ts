import { UserRole, OrderStatus, DroneStatus, MissionStatus, NotificationType, AbnormalType, NoFlyZoneType } from '../../shared/types';

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.USER]: '普通用户',
  [UserRole.OPERATOR]: '无人机操作员',
  [UserRole.DISPATCHER]: '调度员',
  [UserRole.ADMIN]: '系统管理员',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_PLANNING]: '规划中',
  [OrderStatus.PENDING_ASSIGNMENT]: '分配中',
  [OrderStatus.PENDING]: '待处理',
  [OrderStatus.ASSIGNED]: '已分配',
  [OrderStatus.IN_TRANSIT]: '配送中',
  [OrderStatus.FLYING]: '飞行中',
  [OrderStatus.DELIVERED]: '已送达',
  [OrderStatus.RETURNING]: '返航中',
  [OrderStatus.RECEIVED]: '已签收',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.FAILED]: '失败',
  [OrderStatus.ERROR]: '异常',
};

export const DRONE_STATUS_LABELS: Record<DroneStatus, string> = {
  [DroneStatus.IDLE]: '空闲',
  [DroneStatus.CHARGING]: '充电中',
  [DroneStatus.READY]: '待起飞',
  [DroneStatus.IN_FLIGHT]: '飞行中',
  [DroneStatus.FLYING]: '飞行中',
  [DroneStatus.DELIVERING]: '配送中',
  [DroneStatus.RETURNING]: '返航中',
  [DroneStatus.MAINTENANCE]: '维护中',
  [DroneStatus.ERROR]: '故障',
};

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  [MissionStatus.PENDING]: '待处理',
  [MissionStatus.READY]: '待起飞',
  [MissionStatus.TAKEOFF]: '起飞中',
  [MissionStatus.CRUISE]: '巡航中',
  [MissionStatus.FLYING]: '飞行中',
  [MissionStatus.DELIVERING]: '配送中',
  [MissionStatus.DELIVERED]: '已送达',
  [MissionStatus.RETURNING]: '返航中',
  [MissionStatus.COMPLETED]: '已完成',
  [MissionStatus.ABORTED]: '已终止',
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.ORDER_CREATED]: '新订单',
  [NotificationType.FLIGHT_ABNORMAL]: '飞行异常',
  [NotificationType.MISSION_COMPLETED]: '任务完成',
  [NotificationType.SYSTEM_ALERT]: '系统提醒',
};

export const ABNORMAL_TYPE_LABELS: Record<AbnormalType, string> = {
  [AbnormalType.LOW_BATTERY]: '低电量',
  [AbnormalType.SIGNAL_LOST]: '信号丢失',
  [AbnormalType.GPS_ERROR]: 'GPS故障',
  [AbnormalType.MOTOR_FAILURE]: '电机故障',
  [AbnormalType.EMERGENCY_LANDING]: '紧急迫降',
  [AbnormalType.WEATHER]: '恶劣天气',
  [AbnormalType.COLLISION_RISK]: '碰撞风险',
  [AbnormalType.SYSTEM_ERROR]: '系统错误',
  [AbnormalType.NO_FLY_ZONE]: '禁飞区',
};

export const NO_FLY_ZONE_TYPE_LABELS: Record<NoFlyZoneType, string> = {
  [NoFlyZoneType.FORBIDDEN]: '禁飞区',
  [NoFlyZoneType.RESTRICTED]: '限制区',
  [NoFlyZoneType.WARNING]: '警告区',
};

export const PACKAGE_TYPES = [
  { value: 'document', label: '文件资料' },
  { value: 'food', label: '餐饮外卖' },
  { value: 'medicine', label: '医疗用品' },
  { value: 'electronics', label: '电子产品' },
  { value: 'clothing', label: '服装鞋帽' },
  { value: 'other', label: '其他物品' },
];

export const BEIJING_COORDINATES = {
  lat: 39.9042,
  lng: 116.4074,
};

export const DEFAULT_MAP_CENTER = [39.9042, 116.4074] as [number, number];
export const DEFAULT_MAP_ZOOM = 13;

export const ROUTES = {
  LOGIN: '/login',
  USER_DASHBOARD: '/user/dashboard',
  USER_ORDERS: '/user/orders',
  USER_NEW_ORDER: '/user/new-order',
  OPERATOR_DASHBOARD: '/operator/dashboard',
  OPERATOR_MISSIONS: '/operator/missions',
  DISPATCHER_DASHBOARD: '/dispatcher/dashboard',
  DISPATCHER_REALTIME: '/dispatcher/realtime',
  DISPATCHER_REPORTS: '/dispatcher/reports',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_NO_FLY_ZONES: '/admin/no-fly-zones',
};

export const getRoleHomePage = (role: UserRole): string => {
  const homePages: Record<UserRole, string> = {
    [UserRole.USER]: ROUTES.USER_DASHBOARD,
    [UserRole.OPERATOR]: ROUTES.OPERATOR_DASHBOARD,
    [UserRole.DISPATCHER]: ROUTES.DISPATCHER_DASHBOARD,
    [UserRole.ADMIN]: ROUTES.ADMIN_DASHBOARD,
  };
  return homePages[role];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}时${minutes}分`;
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)}米`;
  return `${(meters / 1000).toFixed(2)}公里`;
};

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};
