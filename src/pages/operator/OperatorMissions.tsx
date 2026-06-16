import { useEffect, useState } from 'react';
import {
  PlaneTakeoff,
  Battery,
  Wifi,
  Thermometer,
  Wind,
  Navigation2,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  RotateCcw,
  Eye,
  Play,
  StopCircle,
  Camera,
  Download,
  Activity,
  Gauge,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useMissionStore } from '../../stores/missionStore';
import { useOrderStore } from '../../stores/orderStore';
import { formatDate, formatDistance, formatDuration } from '../../lib/constants';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  FlightMission,
  MissionStatus,
  TelemetryData,
  AbnormalEvent,
  Order,
} from '../../../shared/types';
import { getBatteryColor, getSignalColor, downloadFile } from '../../lib/helpers';

export default function OperatorMissions() {
  const { user } = useAuthStore();
  const {
    missions,
    fetchMissions,
    telemetryData,
    abnormalEvents,
    startMission,
    returnToBase,
    takePhoto,
    fetchTelemetry,
    fetchAbnormalEvents,
    subscribeToTelemetry,
    subscribeToAbnormalEvents,
    isLoading,
    selectedMission,
    selectMission,
    latestTelemetry,
  } = useMissionStore();
  const { orders, fetchOrders } = useOrderStore();
  const [statusFilter, setStatusFilter] = useState<MissionStatus | 'all'>('all');

  useEffect(() => {
    if (user) {
      fetchMissions();
      fetchOrders();
    }
  }, [user]);

  useEffect(() => {
    if (selectedMission) {
      fetchTelemetry(selectedMission.id, 50);
      fetchAbnormalEvents(selectedMission.id);

      const unsubTelemetry = subscribeToTelemetry((data) => {
        if (data.missionId === selectedMission.id) {
          // telemetry is handled by store
        }
      });

      const unsubAbnormal = subscribeToAbnormalEvents((event) => {
        if (event.missionId === selectedMission.id) {
          fetchAbnormalEvents(selectedMission.id);
        }
      });

      const interval = setInterval(() => {
        fetchTelemetry(selectedMission.id, 50);
      }, 2000);

      return () => {
        clearInterval(interval);
        unsubTelemetry();
        unsubAbnormal();
      };
    }
  }, [selectedMission]);

  const getOrderById = (orderId: string): Order | undefined => {
    return orders.find((o) => o.id === orderId);
  };

  const filteredMissions = missions.filter((m) => {
    if (statusFilter === 'all') return true;
    return m.status === statusFilter;
  });

  const handleStartMission = async (missionId: string) => {
    await startMission(missionId);
    if (selectedMission?.id === missionId) {
      const updatedMission = missions.find(m => m.id === missionId);
      selectMission(updatedMission || null);
    }
  };

  const handleReturnToBase = async (missionId: string) => {
    await returnToBase(missionId);
  };

  const handleTakePhoto = async (missionId: string) => {
    await takePhoto(missionId);
  };

  const handleDownloadProof = async (mission: FlightMission, order: Order | undefined) => {
    if (order?.receiptProof) {
      const blob = new Blob([JSON.stringify(order.receiptProof, null, 2)], { type: 'application/json' });
      downloadFile(blob, `签收凭证-${mission.missionNo}.json`);
    }
  };

  const statusFilters = [
    { value: 'all', label: '全部' },
    { value: MissionStatus.PENDING, label: '待执行' },
    { value: MissionStatus.READY, label: '就绪' },
    { value: MissionStatus.TAKEOFF, label: '起飞中' },
    { value: MissionStatus.CRUISE, label: '巡航中' },
    { value: MissionStatus.FLYING, label: '飞行中' },
    { value: MissionStatus.DELIVERING, label: '配送中' },
    { value: MissionStatus.DELIVERED, label: '已送达' },
    { value: MissionStatus.RETURNING, label: '返航中' },
    { value: MissionStatus.COMPLETED, label: '已完成' },
    { value: MissionStatus.ABORTED, label: '已中止' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            飞行任务管理
          </h1>
          <p className="text-dark-400 mt-1">
            监控和控制无人机执行配送任务
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value as MissionStatus | 'all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === f.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <div className="card h-[calc(100vh-280px)] flex flex-col">
            <div className="p-4 border-b border-dark-700">
              <h2 className="font-semibold text-white">任务列表</h2>
              <p className="text-xs text-dark-400 mt-1">
                共 {filteredMissions.length} 个任务
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-dark-400 mt-2 text-sm">加载中...</p>
                </div>
              ) : filteredMissions.length === 0 ? (
                <div className="p-8 text-center text-dark-400 text-sm">
                  <PlaneTakeoff className="w-12 h-12 mx-auto mb-4 text-dark-600" />
                  <p>暂无任务</p>
                </div>
              ) : (
                <div className="divide-y divide-dark-700/50">
                  {filteredMissions.map((mission) => {
                    const order = getOrderById(mission.orderId);
                    return (
                      <div
                        key={mission.id}
                        onClick={() => selectMission(mission)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedMission?.id === mission.id
                            ? 'bg-primary-900/30 border-l-4 border-primary-500'
                            : 'hover:bg-dark-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-white text-sm">
                            {mission.missionNo}
                          </p>
                          <StatusBadge status={mission.status} type="mission" />
                        </div>
                        {order && (
                          <p className="text-xs text-dark-400 truncate">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {order.receiverAddress}
                          </p>
                        )}
                        <p className="text-xs text-dark-500 mt-1">
                          {formatDate(mission.createdAt)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {selectedMission ? (
            <>
              <div className="card">
                <div className="p-6 border-b border-dark-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-white text-lg">
                        任务详情
                      </h2>
                      <p className="text-dark-400 text-sm mt-1">
                        {selectedMission.missionNo}
                      </p>
                    </div>
                    <StatusBadge status={selectedMission.status} type="mission" />
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-dark-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-dark-400 text-xs mb-2">
                        <Battery className="w-4 h-4" />
                        电池
                      </div>
                      <p
                        className={`text-xl font-bold ${getBatteryColor(
                          latestTelemetry?.batteryLevel || 0
                        )}`}
                      >
                        {latestTelemetry?.batteryLevel || '-'}%
                      </p>
                    </div>
                    <div className="bg-dark-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-dark-400 text-xs mb-2">
                        <Gauge className="w-4 h-4" />
                        速度
                      </div>
                      <p className="text-xl font-bold text-white">
                        {latestTelemetry?.speed || '-'} m/s
                      </p>
                    </div>
                    <div className="bg-dark-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-dark-400 text-xs mb-2">
                        <Navigation2 className="w-4 h-4" />
                        高度
                      </div>
                      <p className="text-xl font-bold text-white">
                        {latestTelemetry?.altitude || '-'} m
                      </p>
                    </div>
                    <div className="bg-dark-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-dark-400 text-xs mb-2">
                        <Wifi className="w-4 h-4" />
                        信号
                      </div>
                      <p
                        className={`text-xl font-bold ${getSignalColor(
                          latestTelemetry?.signalStrength || 0
                        )}`}
                      >
                        {latestTelemetry?.signalStrength || '-'}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-dark-400 text-xs uppercase tracking-wider mb-2">
                        配送信息
                      </p>
                      {(() => {
                        const order = getOrderById(selectedMission.orderId);
                        if (!order) return <p className="text-dark-500">-</p>;
                        return (
                          <div className="bg-dark-800 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-dark-400">收件人</span>
                              <span className="text-white">
                                {order.receiverName}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-dark-400">电话</span>
                              <span className="text-white">
                                {order.receiverPhone}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-dark-400">地址</span>
                              <span className="text-white text-right max-w-[60%]">
                                {order.receiverAddress}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-dark-400">重量</span>
                              <span className="text-white">
                                {order.packageWeight} kg
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div>
                      <p className="text-dark-400 text-xs uppercase tracking-wider mb-2">
                        任务信息
                      </p>
                      <div className="bg-dark-800 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-dark-400">任务编号</span>
                          <span className="text-white">
                            {selectedMission.missionNo}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-400">航线ID</span>
                          <span className="text-white font-mono text-xs">
                            {selectedMission.routeId.slice(0, 8)}...
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-400">创建时间</span>
                          <span className="text-white text-sm">
                            {formatDate(selectedMission.createdAt)}
                          </span>
                        </div>
                        {selectedMission.startTime && (
                          <div className="flex justify-between">
                            <span className="text-dark-400">起飞时间</span>
                            <span className="text-white text-sm">
                              {formatDate(selectedMission.startTime)}
                            </span>
                          </div>
                        )}
                        {selectedMission.endTime && (
                          <div className="flex justify-between">
                            <span className="text-dark-400">完成时间</span>
                            <span className="text-white text-sm">
                              {formatDate(selectedMission.endTime)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {selectedMission.status === MissionStatus.PENDING && (
                      <button
                        onClick={() => handleStartMission(selectedMission.id)}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        一键起飞
                      </button>
                    )}

                    {(selectedMission.status === MissionStatus.CRUISE ||
                      selectedMission.status === MissionStatus.DELIVERING ||
                      selectedMission.status === MissionStatus.TAKEOFF) && (
                      <button
                        onClick={() => handleReturnToBase(selectedMission.id)}
                        className="btn-warning flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        紧急返航
                      </button>
                    )}

                    {selectedMission.status === MissionStatus.DELIVERING && (
                      <button
                        onClick={() => handleTakePhoto(selectedMission.id)}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        拍照确认
                      </button>
                    )}

                    {selectedMission.status === MissionStatus.COMPLETED &&
                      getOrderById(selectedMission.orderId)?.receiptProof && (
                        <button
                          onClick={() =>
                            handleDownloadProof(
                              selectedMission,
                              getOrderById(selectedMission.orderId)
                            )
                          }
                          className="btn-secondary flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          下载签收凭证
                        </button>
                      )}
                  </div>
                </div>
              </div>

              {abnormalEvents.length > 0 && (
                <div className="card">
                  <div className="p-4 border-b border-dark-700">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                      异常事件记录
                    </h3>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <div className="divide-y divide-dark-700/50">
                      {abnormalEvents.map((event) => (
                        <div key={event.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <StatusBadge
                                status={event.type}
                                type="abnormal"
                              />
                              <div>
                                <p className="text-white text-sm">
                                  {event.description}
                                </p>
                                <p className="text-dark-500 text-xs mt-1">
                                  {formatDate(event.timestamp)}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                event.resolved
                                  ? 'bg-success/20 text-success'
                                  : 'bg-warning/20 text-warning'
                              }`}
                            >
                              {event.resolved ? '已处理' : '待处理'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card h-[calc(100vh-280px)] flex items-center justify-center">
              <div className="text-center text-dark-400">
                <Eye className="w-16 h-16 mx-auto mb-4 text-dark-600" />
                <p>选择一个任务查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
