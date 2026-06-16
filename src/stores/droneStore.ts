import { create } from 'zustand';
import { Drone, DroneStatus } from '../../shared/types';
import { droneApi } from '../lib/api';

interface DroneState {
  drones: Drone[];
  selectedDrone: Drone | null;
  statusCount: Record<DroneStatus, number> | null;
  isLoading: boolean;
  error: string | null;
  fetchDrones: (status?: string) => Promise<void>;
  fetchDroneById: (id: string) => Promise<void>;
  fetchStatusCount: () => Promise<void>;
  updateDroneStatus: (id: string, status: string) => Promise<boolean>;
  getStats: () => {
    idle: number;
    inFlight: number;
    charging: number;
    maintenance: number;
    error: number;
    returning: number;
    delivering: number;
    ready: number;
  };
  clearSelectedDrone: () => void;
}

export const useDroneStore = create<DroneState>((set, get) => ({
  drones: [],
  selectedDrone: null,
  statusCount: null,
  isLoading: false,
  error: null,

  fetchDrones: async (status?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await droneApi.getAll(status);
      if (response.success) {
        set({ drones: response.data || [], isLoading: false });
      } else {
        set({ error: response.error || '获取无人机列表失败', isLoading: false });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchDroneById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await droneApi.getById(id);
      if (response.success) {
        set({ selectedDrone: response.data || null, isLoading: false });
      } else {
        set({ error: response.error || '获取无人机信息失败', isLoading: false });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchStatusCount: async () => {
    try {
      const response = await droneApi.getStatusCount();
      if (response.success) {
        set({ statusCount: response.data });
      }
    } catch (e) {
      console.error('获取状态统计失败:', e);
    }
  },

  updateDroneStatus: async (id: string, status: string) => {
    try {
      const response = await droneApi.updateStatus(id, status);
      if (response.success) {
        set((state) => ({
          drones: state.drones.map((d) =>
            d.id === id ? { ...d, status: status as DroneStatus } : d
          ),
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  getStats: () => {
    const { drones } = get();
    return {
      idle: drones.filter((d) => d.status === DroneStatus.IDLE).length,
      inFlight: drones.filter((d) => d.status === DroneStatus.IN_FLIGHT || d.status === DroneStatus.FLYING).length,
      charging: drones.filter((d) => d.status === DroneStatus.CHARGING).length,
      maintenance: drones.filter((d) => d.status === DroneStatus.MAINTENANCE).length,
      error: drones.filter((d) => d.status === DroneStatus.ERROR).length,
      returning: drones.filter((d) => d.status === DroneStatus.RETURNING).length,
      delivering: drones.filter((d) => d.status === DroneStatus.DELIVERING).length,
      ready: drones.filter((d) => d.status === DroneStatus.READY).length,
    };
  },

  clearSelectedDrone: () => set({ selectedDrone: null }),
}));
