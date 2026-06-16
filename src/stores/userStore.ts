import { create } from 'zustand';
import { User, UserRole } from '../../shared/types';
import { userApi } from '../lib/api';

interface UserState {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  error: string | null;
  fetchUsers: (role?: string, search?: string) => Promise<void>;
  fetchUserById: (id: string) => Promise<void>;
  createUser: (data: any) => Promise<boolean>;
  updateUser: (id: string, data: any) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  getStats: () => {
    total: number;
    byRole: Record<UserRole, number>;
  };
  clearSelectedUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,

  fetchUsers: async (role?: string, search?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userApi.getAll(role, search);
      if (response.success) {
        set({ users: response.data || [], isLoading: false });
      } else {
        set({ error: response.error || '获取用户列表失败', isLoading: false });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchUserById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userApi.getById(id);
      if (response.success) {
        set({ selectedUser: response.data || null, isLoading: false });
      } else {
        set({ error: response.error || '获取用户信息失败', isLoading: false });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  createUser: async (data: any) => {
    try {
      const response = await userApi.create(data);
      if (response.success) {
        set((state) => ({
          users: response.data ? [response.data, ...state.users] : state.users,
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  updateUser: async (id: string, data: any) => {
    try {
      const response = await userApi.update(id, data);
      if (response.success && response.data) {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? response.data : u
          ),
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  deleteUser: async (id: string) => {
    try {
      const response = await userApi.delete(id);
      if (response.success) {
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  getStats: () => {
    const { users } = get();
    return {
      total: users.length,
      byRole: {
        [UserRole.USER]: users.filter((u) => u.role === UserRole.USER).length,
        [UserRole.OPERATOR]: users.filter((u) => u.role === UserRole.OPERATOR).length,
        [UserRole.DISPATCHER]: users.filter((u) => u.role === UserRole.DISPATCHER).length,
        [UserRole.ADMIN]: users.filter((u) => u.role === UserRole.ADMIN).length,
      },
    };
  },

  clearSelectedUser: () => set({ selectedUser: null }),
}));
