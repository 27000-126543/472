import { useEffect } from 'react';
import { Package, Clock, CheckCircle, AlertCircle, ChevronRight, MapPin } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useOrderStore } from '../../stores/orderStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES, formatDate, formatCurrency } from '../../lib/constants';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { OrderStatus } from '../../../shared/types';

export default function UserDashboard() {
  const { user } = useAuthStore();
  const { orders, fetchOrders, getStats, isLoading } = useOrderStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const stats = getStats();
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            欢迎回来，{user?.username}
          </h1>
          <p className="text-dark-400 mt-1">管理您的无人机配送订单</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.USER_NEW_ORDER)}
          className="btn-primary flex items-center gap-2"
        >
          <Package className="w-4 h-4" />
          新建订单
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总订单数"
          value={stats.total}
          icon={Package}
          color="primary"
          delay={0}
        />
        <StatCard
          title="配送中"
          value={stats.inTransit}
          icon={Clock}
          color="warning"
          delay={100}
        />
        <StatCard
          title="已完成"
          value={stats.completed}
          icon={CheckCircle}
          color="success"
          delay={200}
        />
        <StatCard
          title="异常订单"
          value={stats.failed}
          icon={AlertCircle}
          color="danger"
          delay={300}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="text-lg font-semibold text-white">最近订单</h2>
              <button
                onClick={() => navigate(ROUTES.USER_ORDERS)}
                className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-dark-400 mt-2">加载中...</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                <p className="text-dark-400">暂无订单记录</p>
                <button
                  onClick={() => navigate(ROUTES.USER_NEW_ORDER)}
                  className="mt-4 text-primary-400 hover:text-primary-300"
                >
                  立即下单
                </button>
              </div>
            ) : (
              <div className="divide-y divide-dark-700/50">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-6 hover:bg-dark-800/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`${ROUTES.USER_ORDERS}/${order.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-dark-800 rounded-xl flex items-center justify-center">
                          <Package className="w-6 h-6 text-primary-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            订单 #{order.orderNo}
                          </p>
                          <p className="text-sm text-dark-400 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {order.receiverAddress}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={order.status} type="order" />
                        <p className="text-sm text-dark-400 mt-2">
                          {formatDate(order.createdAt)}
                        </p>
                        <p className="text-primary-400 font-semibold mt-1">
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
            <h2 className="text-lg font-semibold text-white mb-4">快速操作</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate(ROUTES.USER_NEW_ORDER)}
                className="w-full p-4 bg-dark-800 hover:bg-dark-700 rounded-xl text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">新建配送订单</p>
                    <p className="text-xs text-dark-400">
                      填写收件信息，快速下单
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate(ROUTES.USER_ORDERS)}
                className="w-full p-4 bg-dark-800 hover:bg-dark-700 rounded-xl text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">查看全部订单</p>
                    <p className="text-xs text-dark-400">
                      管理所有历史订单记录
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">温馨提示</h2>
            <div className="space-y-3 text-sm text-dark-400">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2" />
                <p>下单后请保持手机畅通，以便接收配送状态通知</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-success rounded-full mt-2" />
                <p>请确保收件地址准确，无人机将根据GPS坐标精准投递</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-warning rounded-full mt-2" />
                <p>签收凭证可在订单详情中下载，方便后续查询</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
