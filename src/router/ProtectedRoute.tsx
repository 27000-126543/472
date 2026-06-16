import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { UserRole } from '../../shared/types';
import { ROUTES } from '../lib/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-dark-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const homeRoute = {
      user: ROUTES.USER_DASHBOARD,
      operator: ROUTES.OPERATOR_DASHBOARD,
      dispatcher: ROUTES.DISPATCHER_DASHBOARD,
      admin: ROUTES.ADMIN_DASHBOARD,
    }[user.role];
    return <Navigate to={homeRoute} replace />;
  }

  return <>{children}</>;
}
