import { useEffect, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  FileText,
  TrendingUp,
  Package,
  PlaneTakeoff,
  MapPin,
  DollarSign,
  Activity,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useReportStore } from '../../stores/reportStore';
import { useOrderStore } from '../../stores/orderStore';
import { useMissionStore } from '../../stores/missionStore';
import { formatDate, formatCurrency, formatDistance, formatDuration } from '../../lib/constants';
import StatCard from '../../components/ui/StatCard';
import { downloadFile } from '../../lib/helpers';
import { DailyReport } from '../../../shared/types';

export default function DispatcherReports() {
  const { user } = useAuthStore();
  const { reports, fetchReports, generateReport, isLoading } = useReportStore();
  const { orders, getStats: getOrderStats } = useOrderStore();
  const { missions, getStats: getMissionStats } = useMissionStore();
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const orderStats = getOrderStats();
  const missionStats = getMissionStats();

  const handleGenerateReport = async () => {
    await generateReport();
    await fetchReports();
  };

  const handleDownloadReport = (report: DailyReport) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    downloadFile(blob, `运力统计报告-${report.reportDate}.json`);
  };

  const chartData = [
    { name: '周一', orders: 24, revenue: 1200, distance: 45 },
    { name: '周二', orders: 32, revenue: 1600, distance: 58 },
    { name: '周三', orders: 28, revenue: 1400, distance: 52 },
    { name: '周四', orders: 36, revenue: 1800, distance: 65 },
    { name: '周五', orders: 42, revenue: 2100, distance: 72 },
    { name: '周六', orders: 38, revenue: 1900, distance: 68 },
    { name: '周日', orders: 30, revenue: 1500, distance: 55 },
  ];

  const maxOrders = Math.max(...chartData.map((d) => d.orders));
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            统计报表
          </h1>
          <p className="text-dark-400 mt-1">
            查看和分析运力运营数据
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchReports()}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="btn-primary flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                生成今日报表
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="总订单数"
          value={orders.length}
          icon={Package}
          color="primary"
          delay={0}
        />
        <StatCard
          title="总营收"
          value={formatCurrency(orderStats.totalRevenue !== undefined ? orderStats.totalRevenue : 0)}
          icon={DollarSign}
          color="success"
          delay={100}
        />
        <StatCard
          title="总配送距离"
          value={formatDistance(orderStats.totalDistance || 0)}
          icon={MapPin}
          color="primary"
          delay={200}
        />
        <StatCard
          title="完成任务"
          value={missionStats.completed}
          icon={PlaneTakeoff}
          color="primary"
          delay={300}
        />
        <StatCard
          title="总飞行时长"
          value={formatDuration(missionStats.totalFlightTime || 0)}
          icon={Activity}
          color="warning"
          delay={400}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-400" />
              本周订单趋势
            </h2>
            <div className="h-64 flex items-end gap-4">
              {chartData.map((item) => (
                <div key={item.name} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col gap-1 items-center justify-end h-48">
                    <div
                      className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg transition-all hover:from-primary-500 hover:to-primary-300 relative group"
                      style={{
                        height: `${(item.orders / maxOrders) * 100}%`,
                        minHeight: '8px',
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-dark-800 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.orders} 单
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-dark-400 mt-2">{item.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-success" />
              本周营收趋势
            </h2>
            <div className="h-64 flex items-end gap-4">
              {chartData.map((item) => (
                <div key={item.name} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col gap-1 items-center justify-end h-48">
                    <div
                      className="w-full bg-gradient-to-t from-success to-emerald-400 rounded-t-lg transition-all hover:from-emerald-500 hover:to-emerald-300 relative group"
                      style={{
                        height: `${(item.revenue / maxRevenue) * 100}%`,
                        minHeight: '8px',
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-dark-800 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ¥{item.revenue}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-dark-400 mt-2">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              运营概览
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-dark-400 text-xs">订单增长率</p>
                    <p className="text-white font-semibold">+12.5%</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
                    <PlaneTakeoff className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-dark-400 text-xs">准时送达率</p>
                    <p className="text-white font-semibold">96.8%</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-dark-400 text-xs">异常率</p>
                    <p className="text-white font-semibold">2.3%</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-dark-400 text-xs">平均配送距离</p>
                    <p className="text-white font-semibold">3.8 km</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-dark-700">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-400" />
                历史报表
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {reports.length === 0 ? (
                <div className="p-8 text-center text-dark-400 text-sm">
                  <FileText className="w-10 h-10 mx-auto mb-3 text-dark-600" />
                  <p>暂无历史报表</p>
                  <p className="text-xs mt-1">系统每日凌晨自动生成</p>
                </div>
              ) : (
                <div className="divide-y divide-dark-700/50">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedReport?.id === report.id
                          ? 'bg-primary-900/30'
                          : 'hover:bg-dark-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium text-sm">
                            {report.reportDate}
                          </p>
                          <p className="text-xs text-dark-400 mt-1">
                            {report.totalOrders} 单 ·{' '}
                            {formatCurrency(report.revenue)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadReport(report);
                          }}
                          className="p-2 text-dark-400 hover:text-primary-400 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedReport && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">
              {selectedReport.reportDate} 详细报告
            </h2>
            <button
              onClick={() => handleDownloadReport(selectedReport)}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              下载报告
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-dark-800 rounded-lg p-4 text-center">
              <p className="text-dark-400 text-xs mb-1">总订单</p>
              <p className="text-xl font-bold text-white">
                {selectedReport.totalOrders}
              </p>
            </div>
            <div className="bg-dark-800 rounded-lg p-4 text-center">
              <p className="text-dark-400 text-xs mb-1">已完成</p>
              <p className="text-xl font-bold text-success">
                {selectedReport.completedOrders}
              </p>
            </div>
            <div className="bg-dark-800 rounded-lg p-4 text-center">
              <p className="text-dark-400 text-xs mb-1">异常事件</p>
              <p className="text-xl font-bold text-warning">
                {selectedReport.abnormalCount}
              </p>
            </div>
            <div className="bg-dark-800 rounded-lg p-4 text-center">
              <p className="text-dark-400 text-xs mb-1">总营收</p>
              <p className="text-xl font-bold text-primary-400">
                {formatCurrency(selectedReport.revenue)}
              </p>
            </div>
            <div className="bg-dark-800 rounded-lg p-4 text-center">
              <p className="text-dark-400 text-xs mb-1">总距离</p>
              <p className="text-xl font-bold text-white">
                {formatDistance(selectedReport.totalDistance)}
              </p>
            </div>
            <div className="bg-dark-800 rounded-lg p-4 text-center">
              <p className="text-dark-400 text-xs mb-1">飞行时长</p>
              <p className="text-xl font-bold text-white">
                {formatDuration(selectedReport.totalFlightTime)}
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-dark-800 rounded-lg p-4">
              <p className="text-dark-400 text-xs mb-2">无人机使用统计</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-300">活跃无人机</span>
                  <span className="text-white">{selectedReport.dronesActive} 架</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-300">维护中无人机</span>
                  <span className="text-white">{selectedReport.dronesInMaintenance} 架</span>
                </div>
              </div>
            </div>
            <div className="bg-dark-800 rounded-lg p-4">
              <p className="text-dark-400 text-xs mb-2">异常事件统计</p>
              <div className="space-y-2">
                {Object.entries(selectedReport.abnormalStats || {}).map(
                  ([type, count]: [string, any]) => (
                    <div
                      key={type}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-dark-300">{type}</span>
                      <span className="text-warning">{count} 次</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
