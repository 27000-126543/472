import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ROUTES } from '../lib/constants';
import { UserRole } from '../../shared/types';

import LoginPage from '../pages/LoginPage';
import UserDashboard from '../pages/user/UserDashboard';
import UserOrders from '../pages/user/UserOrders';
import UserNewOrder from '../pages/user/UserNewOrder';
import OperatorDashboard from '../pages/operator/OperatorDashboard';
import OperatorMissions from '../pages/operator/OperatorMissions';
import DispatcherDashboard from '../pages/dispatcher/DispatcherDashboard';
import DispatcherRealtime from '../pages/dispatcher/DispatcherRealtime';
import DispatcherReports from '../pages/dispatcher/DispatcherReports';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminNoFlyZones from '../pages/admin/AdminNoFlyZones';
import AppLayout from '../components/layout/AppLayout';

const withLayout = (
  element: React.ReactNode,
  allowedRoles?: UserRole[]
) => (
  <ProtectedRoute allowedRoles={allowedRoles}>
    <AppLayout>{element}</AppLayout>
  </ProtectedRoute>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={ROUTES.LOGIN} replace />,
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.USER_DASHBOARD,
    element: withLayout(<UserDashboard />, [UserRole.USER]),
  },
  {
    path: ROUTES.USER_ORDERS,
    element: withLayout(<UserOrders />, [UserRole.USER]),
  },
  {
    path: ROUTES.USER_NEW_ORDER,
    element: withLayout(<UserNewOrder />, [UserRole.USER]),
  },
  {
    path: ROUTES.OPERATOR_DASHBOARD,
    element: withLayout(<OperatorDashboard />, [UserRole.OPERATOR]),
  },
  {
    path: ROUTES.OPERATOR_MISSIONS,
    element: withLayout(<OperatorMissions />, [UserRole.OPERATOR]),
  },
  {
    path: ROUTES.DISPATCHER_DASHBOARD,
    element: withLayout(<DispatcherDashboard />, [UserRole.DISPATCHER, UserRole.ADMIN]),
  },
  {
    path: ROUTES.DISPATCHER_REALTIME,
    element: withLayout(<DispatcherRealtime />, [UserRole.DISPATCHER, UserRole.ADMIN]),
  },
  {
    path: ROUTES.DISPATCHER_REPORTS,
    element: withLayout(<DispatcherReports />, [UserRole.DISPATCHER, UserRole.ADMIN]),
  },
  {
    path: ROUTES.ADMIN_DASHBOARD,
    element: withLayout(<AdminDashboard />, [UserRole.ADMIN]),
  },
  {
    path: ROUTES.ADMIN_USERS,
    element: withLayout(<AdminUsers />, [UserRole.ADMIN]),
  },
  {
    path: ROUTES.ADMIN_NO_FLY_ZONES,
    element: withLayout(<AdminNoFlyZones />, [UserRole.ADMIN]),
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
          <p className="text-dark-400 mb-8">页面不存在</p>
        </div>
      </div>
    ),
  },
]);
