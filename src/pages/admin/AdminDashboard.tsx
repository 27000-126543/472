import { useEffect } from 'react';
import {
  Users,
  PlaneTakeoff,
  Shield,
  AlertTriangle,
  CheckCircle,
  MapPin,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUserStore } from '../../stores/userStore';
import { useDroneStore } from '../../stores/droneStore';
import { useOrderStore } from '../../stores/orderStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES, formatCurrency } from '../../lib/constants';
import StatCard from '../../components/ui/StatCard';
import { UserRole } from '../../../shared/types';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { users, fetchUsers, getStats: getUserStats, isLoading: usersLoading } = useUserStore();
  const { drones, fetchDrones, getStats: getDroneStats } = useDroneStore();
  const { orders, fetchOrders, getStats: getOrderStats } = useOrderStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchDrones();
      fetchOrders();
    }
  }, [user]);

  const userStats = getUserStats();
  const droneStats = getDroneStats();
  const orderStats = getOrderStats();

  const roleCounts = {
    user: users.filter((u) => u.role === UserRole.USER).length,
    operator: users.filter((u) => u.role === UserRole.OPERATOR).length,
    dispatcher: users.filter((u) => u.role === UserRole.DISPATCHER).length,
    admin: users.filter((u) => u.role === UserRole.ADMIN).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            管理中心
          </h1>
          <p className="text-dark-400 mt-1">
            系统全局管理和系统配置
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(ROUTES.ADMIN_USERS)}
            className="btn-secondary flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            用户管理
          </button>
          <button
            onClick={() => navigate(ROUTES.ADMIN_NO_FLY_ZONES)}
            className="btn-primary flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            禁飞区管理
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="用户总数"
          value={users.length}
          icon={Users}
          color="primary"
          trend={5}
          trendLabel="较上周"
          delay={0}
        />
        <StatCard
          title="无人机总数"
          value={drones.length}
          icon={PlaneTakeoff}
          color="primary"
          trend={2}
          trendLabel="较上周"
          delay={100}
        />
        <StatCard
          title="订单总数"
          value={orders.length}
          icon={BarChart3}
          color="success"
          trend={15}
          trendLabel="较上周"
          delay={200}
        />
        <StatCard
          title="总营收"
          value={formatCurrency(orderStats.totalRevenue || 0)}
          icon={DollarSign}
          color="warning"
          trend={8}
          trendLabel="较上周"
          delay={300}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-400" />
            用户角色分布
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">
                {roleCounts.user}
              </p>
              <p className="text-xs text-dark-400 mt-1">普通用户</p>
            </div>
            <div className="bg-dark-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-primary-400">
                {roleCounts.operator}
              </p>
              <p className="text-xs text-dark-400 mt-1">操作员</p>
            </div>
            <div className="bg-dark-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-success">
                {roleCounts.dispatcher}
              </p>
              <p className="text-xs text-dark-400 mt-1">调度员</p>
            </div>
            <div className="bg-dark-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-warning">
                {roleCounts.admin}
              </p>
              <p className="text-xs text-dark-400 mt-1">管理员</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-400" />
            无人机状态
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-dark-400 text-sm">空闲</span>
                <span className="text-white font-medium">
                  {droneStats.idle}
                </span>
              </div>
              <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full"
                  style={{
                    width: `${drones.length > 0
                      ? (droneStats.idle / drones.length) * 100
                      : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-dark-400 text-sm">飞行中</span>
                <span className="text-white font-medium">
                  {droneStats.inFlight}
                </span>
              </div>
              <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{
                    width: `${drones.length > 0
                      ? (droneStats.inFlight / drones.length) * 100
                      : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-dark-400 text-sm">充电中</span>
                <span className="text-white font-medium">
                  {droneStats.charging}
                </span>
              </div>
              <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning rounded-full"
                  style={{
                    width: `${drones.length > 0
                      ? (droneStats.charging / drones.length) * 100
                      : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
              <span className="text-dark-400 text-sm">故障</span>
              <span className="text-white font-medium">
                {droneStats.error}
              </span>
              </div>
              <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-danger rounded-full"
                  style={{
                    width: `${drones.length > 0
                      ? (droneStats.error / drones.length) * 100
                      : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-400" />
              系统状态
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="text-dark-300">数据库</span>
                </div>
                <span className="text-success text-sm">正常</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="text-dark-300">WebSocket服务</span>
                </div>
                <span className="text-success text-sm">正常</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="text-dark-300">航线规划服务</span>
                </div>
                <span className="text-success text-sm">正常</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                  <span className="text-dark-300">定时任务</span>
                </div>
                <span className="text-warning text-sm">运行中</span>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-primary-900/30 to-dark-900 border-primary-500/30">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-400" />
              快捷操作
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate(ROUTES.ADMIN_USERS)}
                className="w-full p-3 bg-dark-800 hover:bg-dark-700 rounded-lg text-left transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-white">管理用户账号</span>
              </button>
              <button
                onClick={() => navigate(ROUTES.ADMIN_NO_FLY_ZONES)}
                className="w-full p-3 bg-dark-800 hover:bg-dark-700 rounded-lg text-left transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-danger rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span className="text-white">管理禁飞区域</span>
              </button>
              <button
                onClick={() => navigate(ROUTES.DISPATCHER_REPORTS)}
                className="w-full p-3 bg-dark-800 hover:bg-dark-700 rounded-lg text-left transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-success rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <span className="text-white">查看统计报表</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
