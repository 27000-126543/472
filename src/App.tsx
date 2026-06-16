import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useNotificationStore } from './stores/notificationStore';

export default function App() {
  const { isAuthenticated, user } = useAuthStore();
  const { fetchUnreadCount, subscribeToNotifications } = useNotificationStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUnreadCount();
      const unsubscribe = subscribeToNotifications(() => {
        fetchUnreadCount();
      });
      return () => unsubscribe();
    }
  }, [isAuthenticated, user]);

  return <RouterProvider router={router} />;
}
