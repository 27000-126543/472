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
  X,
  Repeat,
  User,
  ArrowRight,
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
  OrderStatus,
} from '../../../shared/types';
import { getBatteryColor, getSignalColor, downloadFile } from '../../lib/helpers';

export default function OperatorMissions() {
  const { user } = useAuthStore();
  const {
    missions,
    fetchMissions,
    telemetryData,
    abnormalEvents,
    reassignments,
    reassignmentsLoading,
    startMission,
    returnToBase,
    takePhoto,
    confirmReceipt,
    fetchTelemetry,
    fetchAbnormalEvents,
    fetchReassignments,
    subscribeToTelemetry,
    subscribeToAbnormalEvents,
    isLoading,
    error,
    selectedMission,
    selectMission,
    latestTelemetry,
  } = useMissionStore();
  const { orders, fetchOrders } = useOrderStore();
  const [statusFilter, setStatusFilter] = useState<MissionStatus | 'all'>('all');
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (error) {
      setToast({ type: 'error', message: error });
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
      fetchReassignments(selectedMission.id);

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
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText('配送签收照片', 320, 200);
      ctx.font = '16px Inter';
      ctx.fillText(new Date().toLocaleString('zh-CN'), 320, 240);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(100, 300, 440, 120);
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px Inter';
      ctx.fillText('无人机配送确认 - 已送达', 320, 350);
      ctx.fillText(`任务ID: ${missionId.slice(0, 20)}...`, 320, 380);
    }
    const photoData = canvas.toDataURL('image/png');
    setPreviewPhoto(photoData);
    setShowPhotoPreview(true);
  };

  const handleConfirmReceipt = async (missionId: string) => {
    if (!previewPhoto) return;
    
    const success = await confirmReceipt(missionId, previewPhoto);
    if (success) {
      setShowPhotoPreview(false);
      setPreviewPhoto(null);
      setToast({ type: 'success', message: '签收确认成功！订单状态已更新' });
      await fetchMissions();
      await fetchOrders();
      if (selectedMission?.id === missionId) {
        const updatedMission = missions.find(m => m.id === missionId);
        selectMission(updatedMission || null);
      }
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  };

  const handleDownloadProof = async (mission: FlightMission, order: Order | undefined) => {
    if (order?.receiptImage) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/orders/${order.id}/receipt/download`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const blob = await response.blob();
        downloadFile(blob, `签收凭证-${mission.missionNo}.png`);
      } catch (e) {
        console.error('下载失败', e);
      }
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
                      selectedMission.status === MissionStatus.TAKEOFF ||
                      selectedMission.status === MissionStatus.FLYING) && (
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

                    {selectedMission.status === MissionStatus.DELIVERED && (
                      <>
                        <button
                          onClick={() => handleTakePhoto(selectedMission.id)}
                          className="btn-secondary flex items-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          签收拍照
                        </button>
                      </>
                    )}

                    {(selectedMission.status === MissionStatus.COMPLETED ||
                      getOrderById(selectedMission.orderId)?.status === OrderStatus.RECEIVED) && (
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

                  {(() => {
                    const order = getOrderById(selectedMission.orderId);
                    if (order?.receiptImage && (order.status === OrderStatus.RECEIVED || order.status === OrderStatus.COMPLETED)) {
                      return (
                        <div className="mt-6">
                          <p className="text-dark-400 text-xs uppercase tracking-wider mb-3">
                            签收照片
                          </p>
                          <div className="bg-dark-800 rounded-lg p-4">
                            <img
                              src={order.receiptImage}
                              alt="签收照片"
                              className="w-full rounded-lg"
                              onClick={() => {
                                setPreviewPhoto(order.receiptImage!);
                                setShowPhotoPreview(true);
                              }}
                            />
                            <div className="mt-3 space-y-1">
                              <p className="text-sm text-white">
                                <CheckCircle className="w-4 h-4 inline mr-2 text-success" />
                                已签收确认
                              </p>
                              {order.receivedAt && (
                                <p className="text-xs text-dark-400">
                                  签收时间: {formatDate(order.receivedAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
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
                    <div className="py-6 text-center">
                      <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-dark-400 mt-2 text-sm">加载中...</p>
                    </div>
                  ) : reassignments.length === 0 ? (
                    <div className="py-6 text-center text-dark-400">
                      <Repeat className="w-10 h-10 mx-auto mb-3 text-dark-600" />
                      <p className="text-sm">暂无改派记录</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary-500 via-primary-500/50 to-dark-700" />
                      <div className="space-y-3">
                        {reassignments.map((record: any, index: number) => (
                          <div key={record.id} className="relative pl-10">
                            <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center ${
                              index === 0 ? 'bg-primary-500' : 'bg-dark-700'
                            }`}>
                              <Repeat className={`w-4 h-4 ${index === 0 ? 'text-white' : 'text-primary-400'}`} />
                            </div>
                            <div className={`bg-dark-800 rounded-lg p-3 ${
                              index === 0 ? 'border border-primary-500/30' : ''
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="bg-dark-700 text-dark-300 text-xs px-2 py-0.5 rounded">
                                    第 {reassignments.length - index} 次改派
                                  </span>
                                  {index === 0 && (
                                    <span className="bg-primary-500/20 text-primary-400 text-xs px-2 py-0.5 rounded">
                                      最新
                                    </span>
                                  )}
                                </div>
                                <span className="text-dark-500 text-xs">
                                  {formatDate(record.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex-1 bg-dark-700/50 rounded px-2 py-1.5 text-center">
                                  <p className="text-dark-400 text-xs">原无人机</p>
                                  <p className="text-white text-sm">
                                    {record.oldDroneName || record.oldDroneId.slice(0, 8)}
                                  </p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-primary-400 flex-shrink-0" />
                                <div className="flex-1 bg-primary-500/10 rounded px-2 py-1.5 text-center">
                                  <p className="text-dark-400 text-xs">新无人机</p>
                                  <p className="text-primary-400 text-sm">
                                    {record.newDroneName || record.newDroneId.slice(0, 8)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1 text-dark-400">
                                  <User className="w-3 h-3" />
                                  <span>{record.reassignedByName || record.reassignedBy.slice(0, 8)}</span>
                                </div>
                              </div>
                              {record.reason && (
                                <div className="mt-2 pt-2 border-t border-dark-700/50">
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
            <div className="card h-[calc(100vh-280px)] flex items-center justify-center">
              <div className="text-center text-dark-400">
                <Eye className="w-16 h-16 mx-auto mb-4 text-dark-600" />
                <p>选择一个任务查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPhotoPreview && previewPhoto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-dark-900 rounded-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">签收照片预览</h3>
              <button
                onClick={() => {
                  setShowPhotoPreview(false);
                  setPreviewPhoto(null);
                }}
                className="text-dark-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <img
              src={previewPhoto}
              alt="签收照片"
              className="w-full rounded-lg mb-4"
            />
            {selectedMission?.status === MissionStatus.DELIVERED && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleConfirmReceipt(selectedMission.id)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  确认签收
                </button>
                <button
                  onClick={() => handleTakePhoto(selectedMission.id)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  重新拍照
                </button>
                <button
                  onClick={() => {
                    setShowPhotoPreview(false);
                    setPreviewPhoto(null);
                  }}
                  className="btn-outline flex items-center gap-2"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
