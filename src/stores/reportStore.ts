import { create } from 'zustand';
import { DailyReport } from '../../shared/types';
import { reportApi } from '../lib/api';

interface ReportState {
  reports: DailyReport[];
  selectedReport: DailyReport | null;
  dashboardData: any;
  trendData: any;
  isLoading: boolean;
  error: string | null;
  fetchReports: (startDate?: string, endDate?: string) => Promise<void>;
  fetchReportById: (id: string) => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchTrend: (days?: number) => Promise<void>;
  fetchLatest: () => Promise<void>;
  generateReport: (date?: string) => Promise<boolean>;
  downloadReport: (id: string) => Promise<Blob | null>;
  clearSelectedReport: () => void;
}

export const useReportStore = create<ReportState>((set) => ({
  reports: [],
  selectedReport: null,
  dashboardData: null,
  trendData: null,
  isLoading: false,
  error: null,

  fetchReports: async (startDate?: string, endDate?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = startDate && endDate
        ? await reportApi.getByDateRange(startDate, endDate)
        : await reportApi.getLatest();
      if (response.success) {
        set({ reports: response.data || [], isLoading: false });
      } else {
        set({ error: response.error || '获取报表列表失败', isLoading: false });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchReportById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await reportApi.getById(id);
      if (response.success) {
        set({ selectedReport: response.data || null, isLoading: false });
      } else {
        set({ error: response.error || '获取报表信息失败', isLoading: false });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchDashboard: async () => {
    try {
      const response = await reportApi.getDashboard();
      if (response.success) {
        set({ dashboardData: response.data });
      }
    } catch (e) {
      console.error('获取仪表盘数据失败:', e);
    }
  },

  fetchTrend: async (days?: number) => {
    try {
      const response = await reportApi.getTrend(days);
      if (response.success) {
        set({ trendData: response.data });
      }
    } catch (e) {
      console.error('获取趋势数据失败:', e);
    }
  },

  fetchLatest: async () => {
    try {
      const response = await reportApi.getLatest();
      if (response.success) {
        set({ reports: response.data || [] });
      }
    } catch (e) {
      console.error('获取最新报表失败:', e);
    }
  },

  generateReport: async (date?: string) => {
    try {
      const response = await reportApi.generateDaily(date);
      return response.success;
    } catch (e) {
      return false;
    }
  },

  downloadReport: async (id: string) => {
    try {
      const response = await reportApi.downloadReport(id);
      if (response.ok) {
        return await response.blob();
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  clearSelectedReport: () => set({ selectedReport: null }),
}));
