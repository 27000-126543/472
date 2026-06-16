import { useEffect } from 'react';
import {
  PlaneTakeoff,
  Battery,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Clock,
  Activity,
  Wifi,
  Thermometer,
  Wind,
  Navigation2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useDroneStore } from '../../stores/droneStore';
import { useMissionStore } from '../../stores/missionStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES, formatDate } from '../../lib/constants';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { DroneStatus, MissionStatus } from '../../../shared/types';
import { getBatteryColor } from '../../lib/helpers';

export default function OperatorDashboard() {
  const { user } = useAuthStore();
  const { drones, fetchDrones, getStats: getDroneStats, isLoading: dronesLoading } = useDroneStore();
  const {
    missions,
    fetchMissions,
    getStats: getMissionStats,
    isLoading: missionsLoading,
  } = useMissionStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchDrones();
      fetchMissions();
    }
  }, [user]);

  const droneStats = getDroneStats();
  const missionStats = getMissionStats();
  const myDrones = drones.filter((d) => d.operatorId === user?.id);
  const myMissions = missions.filter(
    (m) => m.status === MissionStatus.PENDING ||
      m.status === MissionStatus.TAKEOFF ||
      m.status === MissionStatus.CRUISE ||
      m.status === MissionStatus.DELIVERING ||
      m.status === MissionStatus.RETURNING
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            操作员控制台
          </h1>
          <p className="text-dark-400 mt-1">
            管理无人机执行飞行任务
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.OPERATOR_MISSIONS)}
          className="btn-primary flex items-center gap-2"
        >
          <PlaneTakeoff className="w-4 h-4" />
          任务管理
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="我的无人机"
          value={myDrones.length}
          icon={PlaneTakeoff}
          color="primary"
          delay={0}
        />
        <StatCard
          title="待执行任务"
          value={missionStats.pending}
          icon={Clock}
          color="warning"
          delay={100}
        />
        <StatCard
          title="飞行中"
          value={missionStats.inProgress}
          icon={Activity}
          color="success"
          delay={200}
        />
        <StatCard
          title="今日完成"
          value={missionStats.completedToday}
          icon={CheckCircle}
          color="primary"
          delay={300}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6 border-b border-dark-700">
              <h2 className="text-lg font-semibold text-white">
                我的无人机
              </h2>
            </div>
            {dronesLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-dark-400 mt-2">加载中...</p>
              </div>
            ) : myDrones.length === 0 ? (
                <div className="p-8 text-center text-dark-400">
                  <PlaneTakeoff className="w-12 h-12 mx-auto mb-4 text-dark-600" />
                  <p>暂无分配的无人机</p>
                </div>
              ) : (
                <div className="divide-y divide-dark-700/50">
                  {myDrones.map((drone) => (
                    <div key={drone.id} className="p-6 hover:bg-dark-800/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              drone.status === DroneStatus.IN_FLIGHT ||
                              drone.status === DroneStatus.DELIVERING
                                ? 'bg-primary-600'
                                : drone.status === DroneStatus.ERROR
                                ? 'bg-red-600'
                                : 'bg-dark-800'
                            }`}
                          >
                            <PlaneTakeoff className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {drone.name}
                            </p>
                            <p className="text-sm text-dark-400">
                              型号: {drone.model}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={drone.status} type="drone" />
                          <div className="flex items-center gap-2 mt-2 text-sm">
                            <Battery
                              className={`w-4 h-4 ${getBatteryColor(drone.batteryLevel)}`}
                            />
                            <span
                              className={getBatteryColor(drone.batteryLevel)}
                            >
                              {drone.batteryLevel}%
                            </span>
                          </div>
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
            <h2 className="text-lg font-semibold text-white mb-4">待执行任务</h2>
            {missionsLoading ? (
              <div className="py-8 text-center">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-dark-400 mt-2 text-sm">加载中...</p>
              </div>
            ) : myMissions.length === 0 ? (
              <div className="py-8 text-center text-dark-400 text-sm">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success/30" />
                <p>暂无待执行任务</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myMissions.slice(0, 5).map((mission) => (
                <div
                  key={mission.id}
                  className="p-3 bg-dark-800 rounded-lg cursor-pointer hover:bg-dark-700 transition-colors"
                  onClick={() => navigate(ROUTES.OPERATOR_MISSIONS)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white text-sm font-medium">
                      任务 #{mission.missionNo}
                    </p>
                    <StatusBadge status={mission.status} type="mission" />
                  </div>
                  <p className="text-dark-400 text-xs">
                    订单: {mission.orderId.slice(0, 8)}...
                  </p>
                </div>
              ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">操作提示</h2>
            <div className="space-y-3 text-sm text-dark-300">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2" />
                <p>起飞前请检查无人机电池电量、GPS信号和天气状况</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-success rounded-full mt-2" />
                <p>飞行过程中请保持实时监控飞行状态和遥测数据</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-warning rounded-full mt-2" />
                <p>收到异常预警时请及时介入，必要时触发紧急返航</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-danger rounded-full mt-2" />
                <p>任务完成后请确认签收凭证已生成并拍照存档</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
