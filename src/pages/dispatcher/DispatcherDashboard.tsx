import { useEffect, useState } from 'react';
import {
  PlaneTakeoff,
  Package,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Clock,
  Activity,
  Navigation2,
  Map,
  BarChart3,
  Settings,
  History,
  Repeat,
  Eye,
  Download,
  X,
  ChevronRight,
  Camera,
  Zap,
  Gauge,
  AlertOctagon,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  List,
  User,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useDroneStore } from '../../stores/droneStore';
import { useOrderStore } from '../../stores/orderStore';
import { useMissionStore } from '../../stores/missionStore';
import { useNoFlyZoneStore } from '../../stores/noFlyZoneStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES, formatDate, formatCurrency, formatDistance } from '../../lib/constants';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { DroneStatus, OrderStatus, MissionStatus } from '../../../shared/types';
import { getBatteryColor } from '../../lib/helpers';
import type { FlightMission, Drone } from '../../../shared/types';

export default function DispatcherDashboard() {
  const { user } = useAuthStore();
  const { drones, fetchDrones, getStats: getDroneStats, isLoading: dronesLoading } = useDroneStore();
  const { orders, fetchOrders, getStats: getOrderStats, isLoading: ordersLoading } = useOrderStore();
  const { 
    missions, 
    fetchMissions, 
    getStats: getMissionStats, 
    isLoading: missionsLoading,
    playbackData,
    availableDrones,
    reassignments,
    reassignmentsLoading,
    fetchPlaybackData,
    fetchAvailableDrones,
    fetchReassignments,
    reassignMission,
    exportPlaybackData,
    clearPlaybackData,
    error: missionError,
  } = useMissionStore();
  const { noFlyZones, fetchNoFlyZones, fetchAffectedMissions, affectedMissions } = useNoFlyZoneStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'missions' | 'playback' | 'affected'>('overview');
  const [selectedMission, setSelectedMission] = useState<FlightMission | null>(null);
  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showPlaybackModal, setShowPlaybackModal] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reassignReason, setReassignReason] = useState('');
  const [selectedReassignDrone, setSelectedReassignDrone] = useState<string>('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (missionError) {
      setToast({ type: 'error', message: missionError });
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [missionError]);

  useEffect(() => {
    if (user) {
      fetchDrones();
      fetchOrders();
      fetchMissions();
      fetchNoFlyZones();
      fetchAffectedMissions();
    }
  }, [user]);

  useEffect(() => {
    let interval: number | null = null;
    if (isPlaying && playbackData) {
      interval = window.setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= playbackData.duration) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackData]);

  const droneStats = getDroneStats();
  const orderStats = getOrderStats();
  const missionStats = getMissionStats();

  const handleReassign = async (missionId: string) => {
    if (!selectedReassignDrone) return;
    const success = await reassignMission(missionId, selectedReassignDrone, reassignReason);
    if (success) {
      setShowReassignModal(false);
      setReassignReason('');
      setSelectedReassignDrone('');
      setToast({ type: 'success', message: '任务改派成功！任务和无人机状态已同步更新' });
      await fetchDrones();
      await fetchOrders();
      const updatedMission = missions.find((m) => m.id === missionId);
      if (updatedMission) {
        setSelectedMission(updatedMission);
      }
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  };

  const handleOpenPlayback = async (missionId: string) => {
    const success = await fetchPlaybackData(missionId);
    if (success) {
      setShowPlaybackModal(true);
      setPlaybackTime(0);
      setIsPlaying(false);
    }
  };

  const handleExportPlayback = async (missionId: string) => {
    await exportPlaybackData(missionId);
  };

  const handleOpenReassign = async (missionId: string) => {
    await fetchAvailableDrones(missionId);
    await fetchReassignments(missionId);
    setShowReassignModal(true);
  };

  const handleSelectMission = async (mission: FlightMission) => {
    setSelectedMission(mission);
    await fetchReassignments(mission.id);
  };

  const getMissionDrone = (droneId: string) => drones.find((d) => d.id === droneId);

  const getTelemetryAtTime = (time: number) => {
    if (!playbackData?.telemetry || playbackData.telemetry.length === 0) return null;
    const index = Math.min(Math.floor(time), playbackData.telemetry.length - 1);
    return playbackData.telemetry[index];
  };

  const getCurrentPlaybackEvent = () => {
    if (!playbackData?.events) return null;
    return playbackData.events.find((e: any) => Math.floor(e.timestamp) === playbackTime);
  };

  const activeMissions = missions.filter(
    (m) => m.status !== MissionStatus.COMPLETED && m.status !== MissionStatus.ABORTED
  );

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-right-5 ${
          toast.type === 'success' ? 'bg-success text-white' : 'bg-danger text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
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

      <div className="flex gap-2 border-b border-dark-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'text-primary-400 border-primary-500'
              : 'text-dark-400 border-transparent hover:text-dark-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            总览
          </span>
        </button>
        <button
          onClick={() => setActiveTab('missions')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'missions'
              ? 'text-primary-400 border-primary-500'
              : 'text-dark-400 border-transparent hover:text-dark-200'
          }`}
        >
          <List className="w-4 h-4" />
          任务管理
          {affectedMissions.length > 0 && (
            <span className="bg-danger text-white text-xs px-1.5 py-0.5 rounded-full">
              {affectedMissions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('playback')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'playback'
              ? 'text-primary-400 border-primary-500'
              : 'text-dark-400 border-transparent hover:text-dark-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <History className="w-4 h-4" />
            任务回放
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab('affected');
            fetchAffectedMissions();
          }}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'affected'
              ? 'text-primary-400 border-primary-500'
              : 'text-dark-400 border-transparent hover:text-dark-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4" />
            受影响任务
            {affectedMissions.length > 0 && (
              <span className="bg-warning text-dark-950 text-xs px-1.5 py-0.5 rounded-full">
                {affectedMissions.length}
              </span>
            )}
          </span>
        </button>
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

      {activeTab === 'missions' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <div className="card h-[calc(100vh-320px)] flex flex-col">
              <div className="p-4 border-b border-dark-700">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <List className="w-5 h-5 text-primary-400" />
                  任务管理 - 可改派任务
                </h2>
                <p className="text-xs text-dark-400 mt-1">等待起飞或飞行中的任务支持改派</p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-dark-700/50">
                {missions
                  .filter((m) => m.status === MissionStatus.PENDING || m.status === MissionStatus.CRUISE || m.status === MissionStatus.DELIVERING)
                  .map((mission) => {
                    const drone = getMissionDrone(mission.droneId);
                    return (
                      <div
                        key={mission.id}
                        onClick={() => handleSelectMission(mission)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedMission?.id === mission.id
                            ? 'bg-primary-900/30 border-l-4 border-primary-500'
                            : 'hover:bg-dark-800/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-medium text-white text-sm">{mission.missionNo}</p>
                              <StatusBadge status={mission.status} type="mission" />
                            </div>
                            {drone && (
                              <div className="flex items-center gap-4 text-xs">
                                <span className="text-dark-400">无人机: {drone.name}</span>
                                <span className={getBatteryColor(drone.batteryLevel)}>
                                  {drone.batteryLevel}%
                                </span>
                              </div>
                            )}
                            <div className="text-xs text-dark-500 mt-1">
                              {formatDate(mission.createdAt)}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-dark-500 mt-1" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {selectedMission ? (
              <>
                <div className="card">
                  <div className="p-4 border-b border-dark-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">
                          任务详情
                        </h3>
                        <p className="text-dark-400 text-sm mt-1">
                          {selectedMission.missionNo}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenReassign(selectedMission.id)}
                          className="btn-primary text-xs flex items-center gap-1"
                        >
                          <Repeat className="w-3 h-3" />
                          改派
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    {(() => {
                      const drone = getMissionDrone(selectedMission.droneId);
                      const order = orders.find((o) => o.id === selectedMission.orderId);
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <p className="text-dark-400 text-xs uppercase tracking-wider">
                              无人机信息
                            </p>
                            <div className="bg-dark-800 rounded-lg p-4 space-y-2">
                              <div className="flex justify-between">
                                <span className="text-dark-400">名称</span>
                                <span className="text-white">{drone?.name || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-dark-400">型号</span>
                                <span className="text-white">{drone?.model || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-dark-400">电量</span>
                                <span className={getBatteryColor(drone?.batteryLevel || 0)}>
                                  {drone?.batteryLevel || '-'}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-dark-400">载荷</span>
                                <span className="text-white">{drone?.payloadCapacity || '-'}kg</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <p className="text-dark-400 text-xs uppercase tracking-wider">
                              任务信息
                            </p>
                            <div className="bg-dark-800 rounded-lg p-4 space-y-2">
                              <div className="flex justify-between">
                                <span className="text-dark-400">状态</span>
                                <StatusBadge status={selectedMission.status} type="mission" />
                              </div>
                              <div className="flex justify-between">
                                <span className="text-dark-400">创建时间</span>
                                <span className="text-white text-sm">
                                  {formatDate(selectedMission.createdAt)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-dark-400">航线</span>
                                <span className="text-white text-sm max-w-[50%] text-right">
                                  {selectedMission.routeSummary || '已规划'}
                                </span>
                              </div>
                              {selectedMission.riskReason && (
                                <div className="flex justify-between">
                                  <span className="text-dark-400">风险原因</span>
                                  <span className="text-warning text-sm">{selectedMission.riskReason}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="card">
                  <div className="p-4 border-b border-dark-700">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Repeat className="w-5 h-5 text-primary-400" />
                      改派历史
                    </h3>
                    <p className="text-xs text-dark-400 mt-1">
                      共 {reassignments.length} 条改派记录
                    </p>
                  </div>
                  <div className="p-4">
                    {reassignmentsLoading ? (
                      <div className="py-8 text-center">
                        <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-dark-400 mt-2 text-sm">加载中...</p>
                      </div>
                    ) : reassignments.length === 0 ? (
                      <div className="py-8 text-center text-dark-400">
                        <Repeat className="w-10 h-10 mx-auto mb-3 text-dark-600" />
                        <p className="text-sm">暂无改派记录</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary-500 via-primary-500/50 to-dark-700" />
                        <div className="space-y-4">
                          {reassignments.map((record: any, index: number) => (
                            <div key={record.id} className="relative pl-10">
                              <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center ${
                                index === 0 ? 'bg-primary-500' : 'bg-dark-700'
                              }`}>
                                <Repeat className={`w-4 h-4 ${index === 0 ? 'text-white' : 'text-primary-400'}`} />
                              </div>
                              <div className={`bg-dark-800 rounded-lg p-4 ${
                                index === 0 ? 'border border-primary-500/30' : ''
                              }`}>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="bg-dark-700 text-dark-300 text-xs px-2 py-1 rounded">
                                      第 {reassignments.length - index} 次改派
                                    </span>
                                    {index === 0 && (
                                      <span className="bg-primary-500/20 text-primary-400 text-xs px-2 py-1 rounded">
                                        最新
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-dark-500 text-xs">
                                    {formatDate(record.createdAt)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="flex-1 bg-dark-700/50 rounded-lg px-3 py-2 text-center">
                                    <p className="text-dark-400 text-xs mb-1">原无人机</p>
                                    <p className="text-white text-sm font-medium">
                                      {record.oldDroneName || record.oldDroneId.slice(0, 8)}
                                    </p>
                                  </div>
                                  <ArrowRight className="w-5 h-5 text-primary-400 flex-shrink-0" />
                                  <div className="flex-1 bg-primary-500/10 rounded-lg px-3 py-2 text-center">
                                    <p className="text-dark-400 text-xs mb-1">新无人机</p>
                                    <p className="text-primary-400 text-sm font-medium">
                                      {record.newDroneName || record.newDroneId.slice(0, 8)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                  <div className="flex items-center gap-1.5 text-dark-400">
                                    <User className="w-3.5 h-3.5" />
                                    <span>{record.reassignedByName || record.reassignedBy.slice(0, 8)}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-dark-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{formatDate(record.createdAt)}</span>
                                  </div>
                                </div>
                                {record.reason && (
                                  <div className="mt-3 pt-3 border-t border-dark-700/50">
                                    <p className="text-dark-400 text-xs mb-1">改派原因</p>
                                    <p className="text-white text-sm">{record.reason}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="card h-[calc(100vh-320px)] flex items-center justify-center">
                <div className="text-center text-dark-400">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-dark-600" />
                  <p>选择一个任务查看详情</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'playback' && (
        <div className="card">
          <div className="p-4 border-b border-dark-700">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-primary-400" />
              任务回放
            </h2>
            <p className="text-xs text-dark-400 mt-1">选择已完成任务进行回放</p>
          </div>
          <div className="divide-y divide-dark-700/50">
            {missions
              .filter((m) => m.status === MissionStatus.COMPLETED)
              .map((mission) => {
                const drone = getMissionDrone(mission.droneId);
                return (
                  <div key={mission.id} className="p-4 hover:bg-dark-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-medium text-white">{mission.missionNo}</p>
                          <StatusBadge status={mission.status} type="mission" />
                        </div>
                        <p className="text-xs text-dark-400">
                          无人机: {drone?.name || '未知'} | 完成时间: {formatDate(mission.completedAt || mission.updatedAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenPlayback(mission.id)}
                          className="btn-secondary text-xs flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          回放
                        </button>
                        <button
                          onClick={() => handleExportPlayback(mission.id)}
                          className="btn-primary text-xs flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          导出
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {activeTab === 'affected' && (
        <div className="card">
          <div className="p-4 border-b border-dark-700">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-warning" />
              受禁飞区变更影响的任务
            </h2>
            <p className="text-xs text-dark-400 mt-1">这些任务需要重新规划航线</p>
          </div>
          <div className="divide-y divide-dark-700/50">
            {affectedMissions.length === 0 ? (
              <div className="p-8 text-center text-dark-400">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 text-success/30" />
                <p>暂无受影响的任务</p>
              </div>
            ) : (
              affectedMissions.map((mission: any) => (
                <div key={mission.id} className="p-4 hover:bg-dark-800/50 transition-colors bg-warning/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-medium text-white">{mission.missionNo}</p>
                        <span className="bg-warning/20 text-warning text-xs px-2 py-0.5 rounded">
                          需要重新规划
                        </span>
                      </div>
                      <p className="text-xs text-dark-400">
                        原因: 禁飞区规则变更 | 任务状态: {mission.status}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(ROUTES.DISPATCHER_REALTIME)}
                      className="btn-primary text-xs flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" />
                      处理
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
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
      )}

      {showReassignModal && selectedMission && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <h3 className="font-semibold text-white">任务改派 - {selectedMission.missionNo}</h3>
              <button
                onClick={() => {
                  setShowReassignModal(false);
                  setSelectedMission(null);
                }}
                className="text-dark-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-dark-400 mb-2">当前无人机</label>
                <p className="text-white">
                  {getMissionDrone(selectedMission.droneId)?.name || '未知'}
                </p>
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">改派原因</label>
                <textarea
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500 resize-none"
                  rows={3}
                  placeholder="请输入改派原因..."
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">选择目标无人机</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableDrones.map((drone: any) => (
                    <label
                      key={drone.id}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedReassignDrone === drone.id
                          ? 'bg-primary-900/30 border border-primary-500'
                          : 'bg-dark-800 hover:bg-dark-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="drone"
                        value={drone.id}
                        checked={selectedReassignDrone === drone.id}
                        onChange={(e) => setSelectedReassignDrone(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{drone.name}</p>
                        <div className="flex gap-4 text-xs mt-1">
                          <span className={getBatteryColor(drone.batteryLevel)}>
                            电量 {drone.batteryLevel}%
                          </span>
                          <span className="text-dark-400">
                            载荷 {drone.payloadCapacity}kg
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          selectedReassignDrone === drone.id
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-dark-500'
                        }`}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-dark-700">
              <button
                onClick={() => {
                  setShowReassignModal(false);
                  setSelectedMission(null);
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={() => handleReassign(selectedMission.id)}
                disabled={!selectedReassignDrone}
                className="btn-primary"
              >
                确认改派
              </button>
            </div>
          </div>
        </div>
      )}

      {showPlaybackModal && playbackData && (
        <div className="fixed inset-0 bg-dark-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <h3 className="font-semibold text-white">任务回放 - {playbackData.missionNo}</h3>
              <button
                onClick={() => {
                  setShowPlaybackModal(false);
                  clearPlaybackData();
                }}
                className="text-dark-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="card p-3">
                  <p className="text-xs text-dark-400 mb-1">当前位置</p>
                  <p className="text-white text-sm font-mono">
                    {getTelemetryAtTime(playbackTime)?.location?.lat?.toFixed(4) || '-'}, 
                    {getTelemetryAtTime(playbackTime)?.location?.lng?.toFixed(4) || '-'}
                  </p>
                </div>
                <div className="card p-3">
                  <p className="text-xs text-dark-400 mb-1">电量</p>
                  <p className={`text-lg font-bold ${getBatteryColor(getTelemetryAtTime(playbackTime)?.batteryLevel || 0)}`}>
                    {getTelemetryAtTime(playbackTime)?.batteryLevel || 0}%
                  </p>
                </div>
                <div className="card p-3">
                  <p className="text-xs text-dark-400 mb-1">速度</p>
                  <p className="text-white text-lg font-bold">
                    {getTelemetryAtTime(playbackTime)?.speed?.toFixed(1) || 0} m/s
                  </p>
                </div>
                <div className="card p-3">
                  <p className="text-xs text-dark-400 mb-1">高度</p>
                  <p className="text-white text-lg font-bold">
                    {getTelemetryAtTime(playbackTime)?.altitude?.toFixed(0) || 0} m
                  </p>
                </div>
              </div>

              <div className="card p-4 mb-6">
                <div className="relative w-full h-64 bg-dark-900 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 grid-pattern opacity-50" />
                  {playbackData.telemetry?.map((t: any, i: number) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-primary-500/30 transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${20 + (i / playbackData.telemetry.length) * 60}%`,
                        top: `${30 + ((t.altitude || 50) / 200) * 40}%`,
                      }}
                    />
                  ))}
                  {playbackData.photoPoints?.map((p: any, i: number) => (
                    <div
                      key={`photo-${i}`}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${25 + (i * 20) % 50}%`,
                        top: '40%',
                      }}
                    >
                      <Camera className="w-4 h-4 text-cyan-400" />
                    </div>
                  ))}
                  {playbackData.abnormalPoints?.map((a: any, i: number) => (
                    <div
                      key={`abnormal-${i}`}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${30 + (i * 25) % 40}%`,
                        top: '50%',
                      }}
                    >
                      <AlertTriangle className="w-4 h-4 text-danger" />
                    </div>
                  ))}
                  {getTelemetryAtTime(playbackTime) && (
                    <div
                      className="absolute w-4 h-4 bg-primary-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse shadow-lg shadow-primary-500/50"
                      style={{
                        left: `${20 + (playbackTime / playbackData.duration) * 60}%`,
                        top: `${30 + ((getTelemetryAtTime(playbackTime)?.altitude || 50) / 200) * 40}%`,
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">时间轴事件</h4>
                <div className="space-y-2">
                  {playbackData.events?.map((event: any, i: number) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg ${
                        Math.floor(event.timestamp) === playbackTime
                          ? 'bg-primary-900/30 border border-primary-500/50'
                          : 'bg-dark-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {event.type === 'photo' && <Camera className="w-4 h-4 text-cyan-400" />}
                          {event.type === 'abnormal' && <AlertTriangle className="w-4 h-4 text-danger" />}
                          {event.type === 'status' && <Activity className="w-4 h-4 text-primary-400" />}
                          <span className="text-white text-sm">{event.description}</span>
                        </div>
                        <span className="text-xs text-dark-400">
                          T+{Math.floor(event.timestamp)}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-dark-700">
              <div className="flex items-center gap-4 mb-3">
                <button
                  onClick={() => setPlaybackTime(0)}
                  className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-white transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 bg-primary-500 hover:bg-primary-600 rounded-full text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setPlaybackTime(playbackData.duration)}
                  className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-white transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={playbackData.duration}
                    value={playbackTime}
                    onChange={(e) => setPlaybackTime(Number(e.target.value))}
                    className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                <span className="text-sm text-dark-400 font-mono min-w-[80px] text-right">
                  {playbackTime}s / {playbackData.duration}s
                </span>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => handleExportPlayback(playbackData.missionId)}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  导出回放数据
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
