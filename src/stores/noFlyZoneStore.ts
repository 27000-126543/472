import { create } from 'zustand';
import { NoFlyZone, NoFlyZoneType } from '../../shared/types';
import { noFlyZoneApi } from '../lib/api';

interface NoFlyZoneState {
  noFlyZones: NoFlyZone[];
  selectedNoFlyZone: NoFlyZone | null;
  affectedMissions: any[];
  impactPreview: any | null;
  previewLoading: boolean;
  isLoading: boolean;
  error: string | null;
  fetchNoFlyZones: (type?: string, active?: boolean) => Promise<void>;
  fetchNoFlyZoneById: (id: string) => Promise<void>;
  createNoFlyZone: (data: any) => Promise<boolean>;
  updateNoFlyZone: (id: string, data: any) => Promise<boolean>;
  deleteNoFlyZone: (id: string) => Promise<boolean>;
  toggleActive: (id: string) => Promise<boolean>;
  fetchAffectedMissions: () => Promise<void>;
  previewImpact: (data: any) => Promise<any | null>;
  clearImpactPreview: () => void;
  clearSelectedNoFlyZone: () => void;
}

export const useNoFlyZoneStore = create<NoFlyZoneState>((set, get) => ({
  noFlyZones: [],
  selectedNoFlyZone: null,
  affectedMissions: [],
  impactPreview: null,
  previewLoading: false,
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

  toggleActive: async (id: string) => {
    try {
      const zone = get().noFlyZones.find((z) => z.id === id);
      if (!zone) return false;
      const newIsActive = !zone.isActive;
      const response = await noFlyZoneApi.toggleActive(id, newIsActive);
      if (response.success && response.data) {
        set((state) => ({
          noFlyZones: state.noFlyZones.map((z) =>
            z.id === id ? response.data : z
          ),
          error: null,
        }));
        return true;
      }
      set({ error: response.error || response.message || '切换状态失败' });
      return false;
    } catch (e: any) {
      set({ error: e.message || '切换状态失败' });
      return false;
    }
  },

  fetchAffectedMissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await noFlyZoneApi.getAffectedMissions();
      if (response.success) {
        set({ affectedMissions: response.data || [], isLoading: false });
      } else {
        set({ error: response.error || '获取受影响任务失败', isLoading: false });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  previewImpact: async (data: any) => {
    set({ previewLoading: true, error: null });
    try {
      const response = await noFlyZoneApi.previewImpact(data);
      if (response.success) {
        set({ impactPreview: response.data || null, previewLoading: false });
        return response.data || null;
      } else {
        set({ error: response.error || '预览影响失败', previewLoading: false });
        return null;
      }
    } catch (e: any) {
      set({ error: e.message, previewLoading: false });
      return null;
    }
  },

  clearImpactPreview: () => set({ impactPreview: null }),

  clearSelectedNoFlyZone: () => set({ selectedNoFlyZone: null }),
}));
