import { create } from 'zustand';
import {
  FlightMission,
  MissionStatus,
  TelemetryData,
  AbnormalEvent,
} from '../../shared/types';
import { missionApi } from '../lib/api';
import { wsClient } from '../lib/websocket';

interface MissionState {
  missions: FlightMission[];
  selectedMission: FlightMission | null;
  telemetryData: TelemetryData[];
  latestTelemetry: TelemetryData | null;
  abnormalEvents: AbnormalEvent[];
  unhandledAbnormalEvents: AbnormalEvent[];
  playbackData: any;
  availableDrones: any[];
  isLoading: boolean;
  error: string | null;
  fetchMissions: (status?: string) => Promise<void>;
  fetchActiveMissions: () => Promise<void>;
  fetchMissionById: (id: string) => Promise<void>;
  fetchTelemetry: (missionId: string, limit?: number) => Promise<void>;
  fetchAbnormalEvents: (missionId: string) => Promise<void>;
  fetchUnhandledAbnormalEvents: () => Promise<void>;
  fetchPlaybackData: (missionId: string) => Promise<any>;
  fetchAvailableDrones: (missionId: string) => Promise<any[]>;
  startMission: (id: string) => Promise<boolean>;
  takeoff: (id: string) => Promise<boolean>;
  startReturn: (id: string) => Promise<boolean>;
  abortMission: (id: string) => Promise<boolean>;
  handleAbnormalEvent: (id: string) => Promise<boolean>;
  returnToBase: (id: string) => Promise<boolean>;
  takePhoto: (id: string) => Promise<boolean>;
  confirmReceipt: (id: string, receiptImage: string) => Promise<boolean>;
  reassignMission: (id: string, newDroneId: string) => Promise<boolean>;
  exportPlaybackData: (id: string) => Promise<void>;
  selectMission: (mission: FlightMission | null) => void;
  subscribeToTelemetry: (callback: (data: TelemetryData) => void) => () => void;
  subscribeToAbnormalEvents: (callback: (event: AbnormalEvent) => void) => () => void;
  getStats: () => {
    pending: number;
    inProgress: number;
    completed: number;
    completedToday: number;
    abnormalToday: number;
    totalFlightTime: number;
    totalFlightTimeToday: number;
    total: number;
  };
  clearSelectedMission: () => void;
  clearTelemetry: () => void;
  clearPlaybackData: () => void;
}

export const useMissionStore = create<MissionState>((set, get) => ({
  missions: [],
  selectedMission: null,
  telemetryData: [],
  latestTelemetry: null,
  abnormalEvents: [],
  unhandledAbnormalEvents: [],
  playbackData: null,
  availableDrones: [],
  isLoading: false,
  error: null,

  fetchMissions: async (status?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await missionApi.getAll(status);
      if (response.success) {
        set({ missions: response.data || [], isLoading: false });
      } else {
        set({ error: response.error || '获取任务列表失败', isLoading: false });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchActiveMissions: async () => {
    try {
      const response = await missionApi.getActive();
      if (response.success) {
        set({ missions: response.data || [] });
      }
    } catch (e) {
      console.error('获取活跃任务失败:', e);
    }
  },

  fetchMissionById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await missionApi.getById(id);
      if (response.success) {
        set({ selectedMission: response.data || null, isLoading: false });
      } else {
        set({ error: response.error || '获取任务信息失败', isLoading: false });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchTelemetry: async (missionId: string, limit?: number) => {
    try {
      const response = await missionApi.getTelemetry(missionId, limit);
      if (response.success) {
        set({ telemetryData: response.data || [] });
      }
    } catch (e) {
      console.error('获取遥测数据失败:', e);
    }
  },

  fetchAbnormalEvents: async (missionId: string) => {
    try {
      const response = await missionApi.getAbnormalEvents(missionId);
      if (response.success) {
        set({ abnormalEvents: response.data || [] });
      }
    } catch (e) {
      console.error('获取异常事件失败:', e);
    }
  },

  fetchUnhandledAbnormalEvents: async () => {
    try {
      const response = await missionApi.getUnhandledAbnormalEvents();
      if (response.success) {
        set({ unhandledAbnormalEvents: response.data || [] });
      }
    } catch (e) {
      console.error('获取未处理异常事件失败:', e);
    }
  },

  startMission: async (id: string) => {
    try {
      const response = await missionApi.startMission(id);
      if (response.success) {
        set((state) => ({
          missions: state.missions.map((m) =>
            m.id === id
              ? { ...m, status: MissionStatus.READY, startedAt: new Date().toISOString() }
              : m
          ),
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  takeoff: async (id: string) => {
    try {
      const response = await missionApi.takeoff(id);
      if (response.success) {
        set((state) => ({
          missions: state.missions.map((m) =>
            m.id === id
              ? { ...m, status: MissionStatus.CRUISE, takeoffAt: new Date().toISOString() }
              : m
          ),
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  startReturn: async (id: string) => {
    try {
      const response = await missionApi.startReturn(id);
      if (response.success) {
        set((state) => ({
          missions: state.missions.map((m) =>
            m.id === id
              ? { ...m, status: MissionStatus.RETURNING }
              : m
          ),
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  abortMission: async (id: string) => {
    try {
      const response = await missionApi.abortMission(id);
      if (response.success) {
        set((state) => ({
          missions: state.missions.map((m) =>
            m.id === id
              ? { ...m, status: MissionStatus.ABORTED }
              : m
          ),
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  handleAbnormalEvent: async (id: string) => {
    try {
      const response = await missionApi.handleAbnormalEvent(id);
      if (response.success) {
        set((state) => ({
          unhandledAbnormalEvents: state.unhandledAbnormalEvents.filter(
            (e) => e.id !== id
          ),
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  returnToBase: async (id: string) => {
    try {
      const response = await missionApi.startReturn(id);
      return response.success;
    } catch (e) {
      return false;
    }
  },

  takePhoto: async (id: string) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('配送签收照片', 320, 200);
        ctx.font = '16px Inter';
        ctx.fillText(new Date().toLocaleString('zh-CN'), 320, 240);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(100, 300, 440, 120);
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Inter';
        ctx.fillText('无人机配送确认 - 已送达', 320, 350);
        ctx.fillText(`任务ID: ${id.slice(0, 20)}...`, 320, 380);
      }
      const photoData = canvas.toDataURL('image/png');
      const response = await missionApi.recordPhoto(id, photoData);
      return response.success;
    } catch (e) {
      return false;
    }
  },

  confirmReceipt: async (id: string, receiptImage: string) => {
    try {
      const response = await missionApi.confirmReceipt(id, receiptImage);
      if (response.success) {
        set((state) => ({
          missions: state.missions.map((m) =>
            m.id === id ? { ...m, status: MissionStatus.COMPLETED } : m
          ),
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  reassignMission: async (id: string, newDroneId: string) => {
    try {
      const response = await missionApi.reassignMission(id, newDroneId);
      if (response.success) {
        await get().fetchMissions();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  fetchPlaybackData: async (missionId: string) => {
    try {
      const response = await missionApi.getPlaybackData(missionId);
      if (response.success) {
        set({ playbackData: response.data });
        return response.data;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  fetchAvailableDrones: async (missionId: string) => {
    try {
      const response = await missionApi.getAvailableDronesForReassignment(missionId);
      if (response.success) {
        set({ availableDrones: response.data || [] });
        return response.data || [];
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  exportPlaybackData: async (id: string) => {
    try {
      const response = await missionApi.exportPlaybackData(id);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mission-playback-${id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('导出回放数据失败:', e);
    }
  },

  selectMission: (mission: FlightMission | null) => {
    set({ selectedMission: mission });
  },

  getStats: () => {
    const { missions } = get();
    const today = new Date().toDateString();
    const todayMissions = missions.filter((m) => new Date(m.createdAt).toDateString() === today);
    return {
      pending: missions.filter((m) => m.status === MissionStatus.PENDING || m.status === MissionStatus.READY).length,
      inProgress: missions.filter((m) => m.status === MissionStatus.TAKEOFF || m.status === MissionStatus.CRUISE || m.status === MissionStatus.FLYING || m.status === MissionStatus.DELIVERING || m.status === MissionStatus.RETURNING).length,
      completed: missions.filter((m) => m.status === MissionStatus.COMPLETED || m.status === MissionStatus.DELIVERED).length,
      completedToday: todayMissions.filter((m) => m.status === MissionStatus.COMPLETED || m.status === MissionStatus.DELIVERED).length,
      abnormalToday: todayMissions.filter((m) => m.status === MissionStatus.ABORTED).length,
      totalFlightTime: missions.reduce((sum, m) => sum + (m.actualFlightTime || 0), 0),
      totalFlightTimeToday: todayMissions.reduce((sum, m) => sum + (m.actualFlightTime || 0), 0),
      total: missions.length,
    };
  },

  subscribeToTelemetry: (callback) => {
    return wsClient.onTelemetry((data) => {
      set((state) => ({
        telemetryData: [...state.telemetryData.slice(-99), data],
        latestTelemetry: data,
      }));
      callback(data);
    });
  },

  subscribeToAbnormalEvents: (callback) => {
    return wsClient.onAbnormalEvent((event) => {
      set((state) => ({
        abnormalEvents: [...state.abnormalEvents, event],
        unhandledAbnormalEvents: [...state.unhandledAbnormalEvents, event],
      }));
      callback(event);
    });
  },

  clearSelectedMission: () => set({ selectedMission: null }),
  clearTelemetry: () => set({ telemetryData: [], latestTelemetry: null }),
  clearPlaybackData: () => set({ playbackData: null, availableDrones: [] }),
}));
