import { useEffect, useRef, useState } from 'react';
import {
  PlaneTakeoff,
  Battery,
  Wifi,
  Thermometer,
  MapPin,
  AlertTriangle,
  Clock,
  Activity,
  Navigation2,
  ZoomIn,
  ZoomOut,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useDroneStore } from '../../stores/droneStore';
import { useMissionStore } from '../../stores/missionStore';
import { useNoFlyZoneStore } from '../../stores/noFlyZoneStore';
import { formatDate } from '../../lib/constants';
import StatusBadge from '../../components/ui/StatusBadge';
import { DroneStatus, MissionStatus } from '../../../shared/types';
import { getBatteryColor, getSignalColor } from '../../lib/helpers';

export default function DispatcherRealtime() {
  const { user } = useAuthStore();
  const { drones, fetchDrones, isLoading: dronesLoading } = useDroneStore();
  const {
    missions,
    fetchMissions,
    latestTelemetry,
    subscribeToTelemetry,
    subscribeToAbnormalEvents,
    abnormalEvents,
  } = useMissionStore();
  const { noFlyZones, fetchNoFlyZones } = useNoFlyZoneStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedDrone, setSelectedDrone] = useState<string | null>(null);
  const [zoom, setZoom] = useState(12);

  useEffect(() => {
    if (user) {
      fetchDrones();
      fetchMissions();
      fetchNoFlyZones();
    }
  }, [user]);

  useEffect(() => {
    const unsubTelemetry = subscribeToTelemetry(() => {
      fetchDrones();
    });
    const unsubAbnormal = subscribeToAbnormalEvents(() => {
      fetchMissions();
    });
    const interval = setInterval(() => {
      fetchDrones();
      fetchMissions();
    }, 3000);

    return () => {
      clearInterval(interval);
      unsubTelemetry();
      unsubAbnormal();
    };
  }, []);

  const activeDrones = drones.filter(
    (d) => d.status === DroneStatus.IN_FLIGHT || d.status === DroneStatus.DELIVERING || d.status === DroneStatus.RETURNING
  );

  const getDronePosition = (droneId: string) => {
    // 模拟无人机位置，实际应该从最新遥测数据获取
    const drone = drones.find((d) => d.id === droneId);
    if (!drone) return { lat: 39.9042, lng: 116.4074 };
    // 基于无人机ID生成不同的模拟位置
    const hash = droneId.charCodeAt(0) + droneId.charCodeAt(1);
    return {
      lat: 39.9042 + (hash % 10) * 0.01,
      lng: 116.4074 + ((hash * 7) % 10) * 0.01,
    };
  };

  const getMissionForDrone = (droneId: string) => {
    return missions.find(
      (m) =>
        m.droneId === droneId &&
        (m.status === MissionStatus.CRUISE ||
          m.status === MissionStatus.DELIVERING ||
          m.status === MissionStatus.RETURNING)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            实时监控
          </h1>
          <p className="text-dark-400 mt-1">
            实时监控所有无人机位置和飞行状态
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-success animate-pulse" />
            <span className="text-success">实时更新中</span>
          </div>
          <button
            onClick={() => {
              fetchDrones();
              fetchMissions();
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">飞行中</p>
              <p className="text-2xl font-bold text-white mt-1">
                {activeDrones.length}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <PlaneTakeoff className="w-5 h-5 text-primary-400" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">空闲</p>
              <p className="text-2xl font-bold text-success mt-1">
                {drones.filter((d) => d.status === DroneStatus.IDLE).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-success/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-success" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">充电中</p>
              <p className="text-2xl font-bold text-warning mt-1">
                {drones.filter((d) => d.status === DroneStatus.CHARGING).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center">
              <Battery className="w-5 h-5 text-warning" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">异常</p>
              <p className="text-2xl font-bold text-danger mt-1">
                {drones.filter((d) => d.status === DroneStatus.ERROR).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-danger/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="card p-0 overflow-hidden h-[calc(100vh-340px)]">
            <div className="relative w-full h-full bg-dark-900">
              <div
                ref={mapContainerRef}
                className="w-full h-full relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 grid-pattern opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-500/30">
                      <MapPin className="w-10 h-10 text-primary-400" />
                    </div>
                    <p className="text-dark-400 mb-2">地图模拟视图</p>
                    <p className="text-dark-500 text-xs">
                      实际部署时集成 Leaflet 地图组件
                    </p>
                    <p className="text-dark-500 text-xs mt-2">
                      当前缩放级别: {zoom}
                    </p>
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button
                    onClick={() => setZoom((z) => Math.min(z + 1, 20))}
                    className="w-10 h-10 bg-dark-800/90 backdrop-blur rounded-lg flex items-center justify-center text-white hover:bg-dark-700 transition-colors"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setZoom((z) => Math.max(z - 1, 1))}
                    className="w-10 h-10 bg-dark-800/90 backdrop-blur rounded-lg flex items-center justify-center text-white hover:bg-dark-700 transition-colors"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 bg-dark-800/90 backdrop-blur rounded-lg flex items-center justify-center text-white hover:bg-dark-700 transition-colors">
                    <Layers className="w-5 h-5" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div className="bg-dark-800/90 backdrop-blur rounded-lg p-3">
                    <p className="text-xs text-dark-400 mb-2">无人机图例</p>
                    <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-primary-500 rounded-full" />
                        <span className="text-dark-300">飞行中</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-warning rounded-full" />
                        <span className="text-dark-300">返航中</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-danger rounded-full" />
                        <span className="text-dark-300">异常</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500/50 rounded-full" />
                        <span className="text-dark-300">禁飞区</span>
                      </div>
                    </div>
                  </div>
                </div>
                {noFlyZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="absolute w-20 h-20 bg-red-500/20 border-2 border-dashed border-red-500/50 rounded-lg flex items-center justify-center"
                    style={{
                      left: `${30 + (zone.id.charCodeAt(0) % 50)}%`,
                      top: `${20 + (zone.id.charCodeAt(1) % 50)}%`,
                    }}
                  >
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                ))}
                {activeDrones.map((drone) => {
                  const pos = getDronePosition(drone.id);
                  const mission = getMissionForDrone(drone.id);
                  return (
                    <div
                      key={drone.id}
                      onClick={() => setSelectedDrone(drone.id)}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 ${
                        selectedDrone === drone.id ? 'scale-125 z-10' : ''
                      }`}
                      style={{
                        left: `${30 + ((pos.lng - 116.4) * 1000) % 40}%`,
                        top: `${30 + ((pos.lat - 39.9) * 1000) % 40}%`,
                      }}
                    >
                      <div
                        className={`relative ${
                          drone.status === DroneStatus.ERROR
                            ? 'animate-pulse'
                            : ''
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                            drone.status === DroneStatus.RETURNING
                              ? 'bg-warning'
                              : drone.status === DroneStatus.ERROR
                              ? 'bg-danger'
                              : 'bg-primary-500'
                          }`}
                        >
                          <PlaneTakeoff className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-dark-900/50 rounded-full blur-sm" />
                      </div>
                      <p className="text-xs text-white text-center mt-1 bg-dark-800/80 px-2 py-0.5 rounded whitespace-nowrap">
                        {drone.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card h-[calc(100vh-340px)] flex flex-col">
            <div className="p-4 border-b border-dark-700">
              <h2 className="font-semibold text-white">无人机列表</h2>
              <p className="text-xs text-dark-400 mt-1">
                点击查看详情
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {dronesLoading ? (
                <div className="p-4 text-center">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : (
                <div className="divide-y divide-dark-700/50">
                  {drones.map((drone) => (
                    <div
                      key={drone.id}
                      onClick={() => setSelectedDrone(drone.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedDrone === drone.id
                          ? 'bg-primary-900/30 border-l-4 border-primary-500'
                          : 'hover:bg-dark-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-white text-sm">
                          {drone.name}
                        </p>
                        <StatusBadge status={drone.status} type="drone" />
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Battery
                            className={`w-3 h-3 ${getBatteryColor(
                              drone.batteryLevel
                            )}`}
                          />
                          <span className={getBatteryColor(drone.batteryLevel)}>
                            {drone.batteryLevel}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wifi
                            className={`w-3 h-3 ${getSignalColor(
                              drone.signalStrength
                            )}`}
                          />
                          <span>{drone.signalStrength}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {abnormalEvents.length > 0 && (
            <div className="card">
              <div className="p-4 border-b border-dark-700">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  最近异常
                </h3>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {abnormalEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="p-3 border-b border-dark-700/50 last:border-0">
                    <StatusBadge status={event.type} type="abnormal" />
                    <p className="text-dark-300 text-xs mt-2">
                      {event.description}
                    </p>
                    <p className="text-dark-500 text-xs mt-1">
                      {formatDate(event.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
