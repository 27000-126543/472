import { cn } from '../../lib/utils';
import { OrderStatus, DroneStatus, MissionStatus, AbnormalType } from '../../../shared/types';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'drone' | 'mission' | 'abnormal';
  className?: string;
}

const statusMap = {
  order: {
    [OrderStatus.PENDING_PLANNING]: { label: '规划中', className: 'status-warning' },
    [OrderStatus.PENDING_ASSIGNMENT]: { label: '分配中', className: 'status-info' },
    [OrderStatus.PENDING]: { label: '待处理', className: 'status-warning' },
    [OrderStatus.ASSIGNED]: { label: '已分配', className: 'status-primary' },
    [OrderStatus.IN_TRANSIT]: { label: '配送中', className: 'status-info' },
    [OrderStatus.FLYING]: { label: '飞行中', className: 'status-info' },
    [OrderStatus.DELIVERED]: { label: '已送达', className: 'status-success' },
    [OrderStatus.RETURNING]: { label: '返航中', className: 'status-info' },
    [OrderStatus.RECEIVED]: { label: '已签收', className: 'status-success' },
    [OrderStatus.COMPLETED]: { label: '已完成', className: 'status-success' },
    [OrderStatus.CANCELLED]: { label: '已取消', className: 'status-danger' },
    [OrderStatus.FAILED]: { label: '失败', className: 'status-danger' },
    [OrderStatus.ERROR]: { label: '异常', className: 'status-danger' },
  },
  drone: {
    [DroneStatus.IDLE]: { label: '空闲', className: 'status-success' },
    [DroneStatus.CHARGING]: { label: '充电中', className: 'status-warning' },
    [DroneStatus.READY]: { label: '就绪', className: 'status-primary' },
    [DroneStatus.IN_FLIGHT]: { label: '飞行中', className: 'status-info' },
    [DroneStatus.FLYING]: { label: '飞行中', className: 'status-info' },
    [DroneStatus.DELIVERING]: { label: '配送中', className: 'status-info' },
    [DroneStatus.RETURNING]: { label: '返航中', className: 'status-info' },
    [DroneStatus.MAINTENANCE]: { label: '维护中', className: 'status-warning' },
    [DroneStatus.ERROR]: { label: '故障', className: 'status-danger' },
  },
  mission: {
    [MissionStatus.PENDING]: { label: '待执行', className: 'status-warning' },
    [MissionStatus.READY]: { label: '就绪', className: 'status-primary' },
    [MissionStatus.TAKEOFF]: { label: '起飞中', className: 'status-info' },
    [MissionStatus.CRUISE]: { label: '巡航中', className: 'status-info' },
    [MissionStatus.FLYING]: { label: '飞行中', className: 'status-info' },
    [MissionStatus.DELIVERING]: { label: '配送中', className: 'status-info' },
    [MissionStatus.DELIVERED]: { label: '已送达', className: 'status-success' },
    [MissionStatus.RETURNING]: { label: '返航中', className: 'status-info' },
    [MissionStatus.COMPLETED]: { label: '已完成', className: 'status-success' },
    [MissionStatus.ABORTED]: { label: '已中止', className: 'status-danger' },
  },
  abnormal: {
    [AbnormalType.LOW_BATTERY]: { label: '低电量', className: 'status-danger' },
    [AbnormalType.SIGNAL_LOST]: { label: '信号丢失', className: 'status-warning' },
    [AbnormalType.WEATHER]: { label: '恶劣天气', className: 'status-warning' },
    [AbnormalType.COLLISION_RISK]: { label: '碰撞风险', className: 'status-danger' },
    [AbnormalType.SYSTEM_ERROR]: { label: '系统错误', className: 'status-danger' },
    [AbnormalType.NO_FLY_ZONE]: { label: '禁飞区', className: 'status-warning' },
    [AbnormalType.GPS_ERROR]: { label: 'GPS故障', className: 'status-danger' },
    [AbnormalType.MOTOR_FAILURE]: { label: '电机故障', className: 'status-danger' },
    [AbnormalType.EMERGENCY_LANDING]: { label: '紧急迫降', className: 'status-danger' },
  },
};

export default function StatusBadge({ status, type = 'order', className }: StatusBadgeProps) {
  const config = statusMap[type]?.[status] || {
    label: status,
    className: 'status-secondary',
  };

  return (
    <span className={cn('badge', config.className, className)}>
      {config.label}
    </span>
  );
}
