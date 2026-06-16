import { create } from 'zustand';
import { User, LoginResponse } from '../../shared/types';
import { authApi } from '../lib/api';
import { wsClient } from '../lib/websocket';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(username, password);
      if (response.success && response.data) {
        const data = response.data as LoginResponse;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
        });
        wsClient.connect(data.user.id, data.user.role);
        return true;
      } else {
        set({
          error: response.error || '登录失败',
          isLoading: false,
        });
        return false;
      }
    } catch (e: any) {
      set({
        error: e.message || '登录失败',
        isLoading: false,
      });
      return false;
    }
  },

  logout: () => {
    authApi.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    wsClient.disconnect();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  getCurrentUser: async () => {
    const { token } = get();
    if (!token) return;

    set({ isLoading: true });
    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        const user = response.data as User;
        localStorage.setItem('user', JSON.stringify(user));
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        wsClient.connect(user.id, user.role);
      } else {
        get().logout();
      }
    } catch (e) {
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

const savedUser = localStorage.getItem('user');
if (savedUser) {
  try {
    const user = JSON.parse(savedUser);
    useAuthStore.setState({ user, isAuthenticated: true });
    wsClient.connect(user.id, user.role);
  } catch (e) {
    localStorage.removeItem('user');
  }
}
