import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  PlaneTakeoff,
  MapPin,
  ClipboardList,
  Map,
  BarChart3,
  Users,
  Shield,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { ROUTES } from '../../lib/constants';
import { cn } from '../../lib/utils';

const menuItems = {
  user: [
    { path: ROUTES.USER_DASHBOARD, icon: LayoutDashboard, label: '控制台' },
    { path: ROUTES.USER_NEW_ORDER, icon: PlusCircle, label: '新建订单' },
    { path: ROUTES.USER_ORDERS, icon: Package, label: '我的订单' },
  ],
  operator: [
    { path: ROUTES.OPERATOR_DASHBOARD, icon: LayoutDashboard, label: '控制台' },
    { path: ROUTES.OPERATOR_MISSIONS, icon: PlaneTakeoff, label: '飞行任务' },
  ],
  dispatcher: [
    { path: ROUTES.DISPATCHER_DASHBOARD, icon: LayoutDashboard, label: '控制台' },
    { path: ROUTES.DISPATCHER_REALTIME, icon: Map, label: '实时监控' },
    { path: ROUTES.DISPATCHER_REPORTS, icon: BarChart3, label: '统计报表' },
  ],
  admin: [
    { path: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard, label: '控制台' },
    { path: ROUTES.ADMIN_USERS, icon: Users, label: '用户管理' },
    { path: ROUTES.ADMIN_NO_FLY_ZONES, icon: MapPin, label: '禁飞区管理' },
  ],
};

export default function Sidebar() {
  const { user } = useAuthStore();
  const { sidebarOpen } = useUIStore();
  const location = useLocation();

  if (!user) return null;

  const items = menuItems[user.role] || [];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-dark-900/95 backdrop-blur-sm border-r border-dark-700 z-40 transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-0 -translate-x-full'
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <PlaneTakeoff className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-gradient">
                无人机配送
              </h1>
              <p className="text-xs text-dark-400">智能调度平台</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  isActive ? 'sidebar-link-active' : 'sidebar-link'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-dark-700">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">
                  {user.username}
                </p>
                <p className="text-xs text-dark-400">
                  {user.role === 'user' && '普通用户'}
                  {user.role === 'operator' && '无人机操作员'}
                  {user.role === 'dispatcher' && '调度员'}
                  {user.role === 'admin' && '系统管理员'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
