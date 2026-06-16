import { create } from 'zustand';
import { NoFlyZone, NoFlyZoneType } from '../../shared/types';
import { noFlyZoneApi } from '../lib/api';

interface NoFlyZoneState {
  noFlyZones: NoFlyZone[];
  selectedNoFlyZone: NoFlyZone | null;
  isLoading: boolean;
  error: string | null;
  fetchNoFlyZones: (type?: string, active?: boolean) => Promise<void>;
  fetchNoFlyZoneById: (id: string) => Promise<void>;
  createNoFlyZone: (data: any) => Promise<boolean>;
  updateNoFlyZone: (id: string, data: any) => Promise<boolean>;
  deleteNoFlyZone: (id: string) => Promise<boolean>;
  clearSelectedNoFlyZone: () => void;
}

export const useNoFlyZoneStore = create<NoFlyZoneState>((set) => ({
  noFlyZones: [],
  selectedNoFlyZone: null,
  isLoading: false,
  error: null,

  fetchNoFlyZones: async (type?: string, active?: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const response = await noFlyZoneApi.getAll(type, active);
      if (response.success) {
        set({ noFlyZones: response.data || [], isLoading: false });
      } else {
        set({ error: response.error || '获取禁飞区列表失败', isLoading: false });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchNoFlyZoneById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await noFlyZoneApi.getById(id);
      if (response.success) {
        set({ selectedNoFlyZone: response.data || null, isLoading: false });
      } else {
        set({ error: response.error || '获取禁飞区信息失败', isLoading: false });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  createNoFlyZone: async (data: any) => {
    try {
      const response = await noFlyZoneApi.create(data);
      if (response.success && response.data) {
        set((state) => ({
          noFlyZones: [response.data, ...state.noFlyZones],
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  updateNoFlyZone: async (id: string, data: any) => {
    try {
      const response = await noFlyZoneApi.update(id, data);
      if (response.success && response.data) {
        set((state) => ({
          noFlyZones: state.noFlyZones.map((z) =>
            z.id === id ? response.data : z
          ),
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  deleteNoFlyZone: async (id: string) => {
    try {
      const response = await noFlyZoneApi.delete(id);
      if (response.success) {
        set((state) => ({
          noFlyZones: state.noFlyZones.filter((z) => z.id !== id),
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  clearSelectedNoFlyZone: () => set({ selectedNoFlyZone: null }),
}));
