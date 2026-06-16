import { useEffect } from 'react';
import {
  PlaneTakeoff,
  Package,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Clock,
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
  Navigation2,
  Map,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useDroneStore } from '../../stores/droneStore';
import { useOrderStore } from '../../stores/orderStore';
import { useMissionStore } from '../../stores/missionStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES, formatDate, formatCurrency, formatDistance } from '../../lib/constants';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { DroneStatus, OrderStatus, MissionStatus } from '../../../shared/types';
import { getBatteryColor } from '../../lib/helpers';

export default function DispatcherDashboard() {
  const { user } = useAuthStore();
  const { drones, fetchDrones, getStats: getDroneStats, isLoading: dronesLoading } = useDroneStore();
  const { orders, fetchOrders, getStats: getOrderStats, isLoading: ordersLoading } = useOrderStore();
  const { missions, fetchMissions, getStats: getMissionStats, isLoading: missionsLoading } = useMissionStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchDrones();
      fetchOrders();
      fetchMissions();
    }
  }, [user]);

  const droneStats = getDroneStats();
  const orderStats = getOrderStats();
  const missionStats = getMissionStats();

  const activeMissions = missions.filter(
    (m) => m.status !== MissionStatus.COMPLETED && m.status !== MissionStatus.ABORTED
  );

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            调度中心
          </h1>
          <p className="text-dark-400 mt-1">
            全局监控无人机运力和订单状态
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(ROUTES.DISPATCHER_REALTIME)}
            className="btn-secondary flex items-center gap-2"
          >
            <Map className="w-4 h-4" />
            实时监控
          </button>
          <button
            onClick={() => navigate(ROUTES.DISPATCHER_REPORTS)}
            className="btn-primary flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            统计报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="无人机总数"
          value={drones.length}
          icon={PlaneTakeoff}
          color="primary"
          trend={12}
          trendLabel="较昨日"
          delay={0}
        />
        <StatCard
          title="飞行中"
          value={droneStats.inFlight}
          icon={Activity}
          color="success"
          delay={100}
        />
        <StatCard
          title="今日订单"
          value={orderStats.total}
          icon={Package}
          color="primary"
          trend={8}
          trendLabel="较昨日"
          delay={200}
        />
        <StatCard
          title="异常告警"
          value={missionStats.abnormalToday}
          icon={AlertTriangle}
          color="danger"
          trend={-3}
          trendLabel="较昨日"
          delay={300}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="text-lg font-semibold text-white">
                无人机状态概览
              </h2>
              <span className="text-sm text-dark-400">
                共 {drones.length} 架无人机
              </span>
            </div>
            {dronesLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-dark-400 mt-2">加载中...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {droneStats.idle}
                  </p>
                  <p className="text-xs text-dark-400">空闲</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Navigation2 className="w-6 h-6 text-primary-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {droneStats.inFlight}
                  </p>
                  <p className="text-xs text-dark-400">飞行中</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-warning/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-6 h-6 text-warning" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {droneStats.charging}
                  </p>
                  <p className="text-xs text-dark-400">充电中</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-danger/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <AlertTriangle className="w-6 h-6 text-danger" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {droneStats.error}
                  </p>
                  <p className="text-xs text-dark-400">故障</p>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="text-lg font-semibold text-white">
                最近订单
              </h2>
              <button
                onClick={() => navigate(ROUTES.USER_ORDERS)}
                className="text-sm text-primary-400 hover:text-primary-300"
              >
                查看全部
              </button>
            </div>
            {ordersLoading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-dark-400 mt-2 text-sm">加载中...</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center text-dark-400 text-sm">
                <Package className="w-10 h-10 mx-auto mb-3 text-dark-600" />
                <p>暂无订单</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-700/50">
                {recentOrders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-dark-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-dark-800 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">
                            #{order.orderNo}
                          </p>
                          <p className="text-xs text-dark-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {order.receiverAddress}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={order.status} type="order" />
                        <p className="text-primary-400 font-semibold text-sm mt-1">
                          {formatCurrency(order.totalCost)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              执行中任务
            </h2>
            {missionsLoading ? (
              <div className="py-4 text-center">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-dark-400 mt-2 text-sm">加载中...</p>
              </div>
            ) : activeMissions.length === 0 ? (
              <div className="py-8 text-center text-dark-400 text-sm">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success/30" />
                <p>暂无执行中任务</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activeMissions.slice(0, 6).map((mission) => {
                  const drone = drones.find((d) => d.id === mission.droneId);
                  return (
                    <div
                      key={mission.id}
                      className="p-3 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors cursor-pointer"
                      onClick={() => navigate(ROUTES.DISPATCHER_REALTIME)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white text-sm font-medium">
                          {mission.missionNo}
                        </p>
                        <StatusBadge status={mission.status} type="mission" />
                      </div>
                      {drone && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-dark-400">{drone.name}</span>
                          <span className={getBatteryColor(drone.batteryLevel)}>
                            电量 {drone.batteryLevel}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              运力统计
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-dark-400">订单完成率</span>
                  <span className="text-white font-medium">
                    {orders.length > 0
                      ? Math.round((orderStats.completed / orders.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full"
                    style={{
                      width: `${
                        orders.length > 0
                          ? (orderStats.completed / orders.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-dark-400">无人机利用率</span>
                  <span className="text-white font-medium">
                    {drones.length > 0
                      ? Math.round((droneStats.inFlight / drones.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-success to-emerald-500 rounded-full"
                    style={{
                      width: `${
                        drones.length > 0
                          ? (droneStats.inFlight / drones.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-dark-400">今日飞行时长</span>
                  <span className="text-white font-medium">
                    {missionStats.totalFlightTimeToday
                      ? Math.round(missionStats.totalFlightTimeToday / 60)
                      : 0}{' '}
                    分钟
                  </span>
                </div>
                <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-warning to-yellow-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((missionStats.totalFlightTimeToday || 0) / 480) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-primary-900/30 to-dark-900 border-primary-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">系统状态</p>
                <p className="text-xs text-dark-400">运行正常</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-dark-400 text-xs">今日营收</p>
                <p className="text-white font-semibold">
                  {formatCurrency(orderStats.totalRevenueToday || 0)}
                </p>
              </div>
              <div>
                <p className="text-dark-400 text-xs">配送距离</p>
                <p className="text-white font-semibold">
                  {formatDistance(orderStats.totalDistanceToday || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
