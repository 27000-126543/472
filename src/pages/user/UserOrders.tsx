import { useEffect, useState } from 'react';
import { Search, Filter, Download, Eye, MapPin, Package, Clock, CheckCircle, FileText } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useOrderStore } from '../../stores/orderStore';
import { formatDate, formatCurrency, formatDistance } from '../../lib/constants';
import StatusBadge from '../../components/ui/StatusBadge';
import { OrderStatus, Order } from '../../../shared/types';
import { downloadFile } from '../../lib/helpers';

export default function UserOrders() {
  const { user } = useAuthStore();
  const { orders, fetchOrders, isLoading, downloadReceipt } = useOrderStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.receiverAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDownloadReceipt = async (orderId: string, orderNo: string) => {
    try {
      const receipt = await downloadReceipt(orderId);
      if (receipt) {
        const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
        downloadFile(blob, `签收凭证-${orderNo}.json`);
      }
    } catch (e) {
      console.error('下载失败', e);
    }
  };

  const statusFilters = [
    { value: 'all', label: '全部' },
    { value: OrderStatus.PENDING_PLANNING, label: '规划中' },
    { value: OrderStatus.PENDING_ASSIGNMENT, label: '分配中' },
    { value: OrderStatus.ASSIGNED, label: '已分配' },
    { value: OrderStatus.IN_TRANSIT, label: '配送中' },
    { value: OrderStatus.DELIVERED, label: '已送达' },
    { value: OrderStatus.RECEIVED, label: '已签收' },
    { value: OrderStatus.CANCELLED, label: '已取消' },
    { value: OrderStatus.FAILED, label: '失败' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            我的订单
          </h1>
          <p className="text-dark-400 mt-1">查看和管理所有历史订单</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="搜索订单号、收件人、地址..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-dark-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="input w-40"
            >
              {statusFilters.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-dark-400 mt-2">加载中...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                <p className="text-dark-400">暂无订单记录</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-700/50">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`p-6 cursor-pointer transition-colors ${
                      selectedOrder?.id === order.id
                        ? 'bg-primary-900/20 border-l-4 border-primary-500'
                        : 'hover:bg-dark-800/50'
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-white">
                            #{order.orderNo}
                          </p>
                          <StatusBadge status={order.status} type="order" />
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-dark-300">
                            <MapPin className="w-4 h-4 text-primary-400" />
                            <span>{order.receiverAddress}</span>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-dark-400">
                            <div className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              <span>{order.packageWeight}kg</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(order.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xl font-bold text-primary-400">
                          {formatCurrency(order.totalCost)}
                        </p>
                        <p className="text-xs text-dark-500 mt-1">
                          距离 {formatDistance(order.distance)}
                        </p>
                        {order.status === OrderStatus.RECEIVED && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadReceipt(order.id, order.orderNo);
                            }}
                            className="mt-2 btn-secondary text-xs py-1 px-3"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            签收凭证
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedOrder ? (
            <div className="card sticky top-24 animate-fade-in">
              <div className="p-6 border-b border-dark-700">
                <h3 className="font-semibold text-white text-lg">
                  订单详情
                </h3>
                <p className="text-dark-400 text-sm mt-1">
                  #{selectedOrder.orderNo}
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-dark-400 text-xs uppercase tracking-wider mb-2">
                    状态
                  </p>
                  <StatusBadge status={selectedOrder.status} type="order" />
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-dark-400 text-xs uppercase tracking-wider mb-2">
                      收件人信息
                    </p>
                    <p className="text-white font-medium">
                      {selectedOrder.receiverName}
                    </p>
                    <p className="text-dark-300 text-sm">
                      {selectedOrder.receiverPhone}
                    </p>
                    <p className="text-dark-400 text-sm mt-1">
                      {selectedOrder.receiverAddress}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">
                        包裹重量
                      </p>
                      <p className="text-white font-medium">
                        {selectedOrder.packageWeight} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">
                        配送距离
                      </p>
                      <p className="text-white font-medium">
                        {formatDistance(selectedOrder.distance)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">
                        费用
                      </p>
                      <p className="text-primary-400 font-bold text-lg">
                        {formatCurrency(selectedOrder.totalCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">
                        下单时间
                      </p>
                      <p className="text-white text-sm">
                        {formatDate(selectedOrder.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <p className="text-dark-400 text-xs uppercase tracking-wider mb-2">
                      备注
                    </p>
                    <p className="text-dark-300 text-sm">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {selectedOrder.receiptProof && (
                  <div>
                    <p className="text-dark-400 text-xs uppercase tracking-wider mb-2">
                      签收凭证
                    </p>
                    <div className="bg-dark-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-success" />
                        <div>
                          <p className="text-white text-sm font-medium">
                            已签收
                          </p>
                          <p className="text-dark-400 text-xs">
                            配送人员已拍照确认
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedOrder.status === OrderStatus.RECEIVED && (
                  <button
                    onClick={() =>
                      handleDownloadReceipt(selectedOrder.id, selectedOrder.orderNo)
                    }
                    className="btn-primary w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载签收凭证
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <Eye className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400">点击订单查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
