const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

async function request<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return {
      success: false,
      error: data.message || data.error || '请求失败',
    };
  }

  return data;
}

export const api = {
  get: <T = any>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, data?: any) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(data) }),
  put: <T = any>(url: string, data?: any) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T = any>(url: string) => request<T>(url, { method: 'DELETE' }),
};

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const userApi = {
  getAll: (role?: string, search?: string) => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    return api.get(`/users?${params.toString()}`);
  },
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const droneApi = {
  getAll: (status?: string) =>
    api.get(`/drones${status ? `?status=${status}` : ''}`),
  getById: (id: string) => api.get(`/drones/${id}`),
  getRealTimeStatus: (id: string) => api.get(`/drones/${id}/realtime`),
  getAvailableForPayload: (weight: number) =>
    api.get(`/drones/available?weight=${weight}`),
  getStatusCount: () => api.get('/drones/status-count'),
  create: (data: any) => api.post('/drones', data),
  update: (id: string, data: any) => api.put(`/drones/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.put(`/drones/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/drones/${id}`),
};

export const orderApi = {
  getAll: (filters?: {
    status?: string;
    orderNo?: string;
    receiverName?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.orderNo) params.append('orderNo', filters.orderNo);
    if (filters?.receiverName) params.append('receiverName', filters.receiverName);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const queryString = params.toString();
    return api.get(`/orders${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => api.get(`/orders/${id}`),
  getByOrderNo: (orderNo: string) => api.get(`/orders/no/${orderNo}`),
  getReceipt: (id: string) => api.get(`/orders/${id}/receipt`),
  getTimeline: (id: string) => api.get(`/orders/${id}/timeline`),
  downloadReceipt: (id: string) =>
    fetch(`${API_BASE_URL}/orders/${id}/receipt/download`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),
  planRoute: (data: any) => api.post('/orders/plan-route', data),
  create: (data: any) => api.post('/orders', data),
  cancel: (id: string) => api.put(`/orders/${id}/cancel`),
};

export const missionApi = {
  getAll: (status?: string) =>
    api.get(`/missions${status ? `?status=${status}` : ''}`),
  getActive: () => api.get('/missions/active'),
  getById: (id: string) => api.get(`/missions/${id}`),
  getTelemetry: (id: string, limit?: number) =>
    api.get(`/missions/${id}/telemetry${limit ? `?limit=${limit}` : ''}`),
  getLatestTelemetry: (id: string) =>
    api.get(`/missions/${id}/telemetry/latest`),
  getAbnormalEvents: (id: string) => api.get(`/missions/${id}/abnormal`),
  getUnhandledAbnormalEvents: () => api.get('/missions/abnormal/unhandled'),
  getMissionSummary: (id: string) => api.get(`/missions/${id}/summary`),
  getSimulationState: (id: string) => api.get(`/missions/${id}/simulation`),
  getPlaybackData: (id: string) => api.get(`/missions/${id}/playback`),
  exportPlaybackData: (id: string) =>
    fetch(`${API_BASE_URL}/missions/${id}/playback/export`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),
  getAvailableDronesForReassignment: (id: string) =>
    api.get(`/missions/${id}/available-drones`),
  getReassignments: (id: string) =>
    api.get(`/missions/${id}/reassignments`),
  startMission: (id: string) => api.put(`/missions/${id}/start`),
  takeoff: (id: string) => api.put(`/missions/${id}/takeoff`),
  startReturn: (id: string) => api.put(`/missions/${id}/return`),
  abortMission: (id: string) => api.put(`/missions/${id}/abort`),
  recordPhoto: (id: string, photoData: string) =>
    api.put(`/missions/${id}/photo`, { photoData }),
  confirmReceipt: (id: string, receiptImage: string) =>
    api.put(`/missions/${id}/confirm-receipt`, { receiptImage }),
  reassignMission: (id: string, newDroneId: string, reason?: string) =>
    api.put(`/missions/${id}/reassign`, { newDroneId, reason }),
  handleAbnormalEvent: (id: string) =>
    api.put(`/missions/abnormal/${id}/handle`),
};

export const noFlyZoneApi = {
  getAll: (type?: string, active?: boolean) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (active !== undefined) params.append('active', String(active));
    return api.get(`/no-fly-zones?${params.toString()}`);
  },
  getById: (id: string) => api.get(`/no-fly-zones/${id}`),
  getAffectedMissions: () => api.get('/no-fly-zones/affected-missions'),
  checkPoint: (lat: number, lng: number, altitude: number) =>
    api.get(
      `/no-fly-zones/check-point?lat=${lat}&lng=${lng}&altitude=${altitude}`
    ),
  validateRoute: (waypoints: any[]) =>
    api.post('/no-fly-zones/validate-route', { waypoints }),
  previewImpact: (data: any) =>
    api.post('/no-fly-zones/preview-impact', data),
  create: (data: any) => api.post('/no-fly-zones', data),
  update: (id: string, data: any) => api.put(`/no-fly-zones/${id}`),
  toggleActive: (id: string, isActive: boolean) =>
    api.put(`/no-fly-zones/${id}/toggle-active`, { isActive }),
  delete: (id: string) => api.delete(`/no-fly-zones/${id}`),
};

export const notificationApi = {
  getAll: (limit?: number) =>
    api.get(`/notifications${limit ? `?limit=${limit}` : ''}`),
  getUnread: () => api.get('/notifications/unread'),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const reportApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getTrend: (days?: number) =>
    api.get(`/reports/trend${days ? `?days=${days}` : ''}`),
  getLatest: () => api.get('/reports/latest'),
  getById: (id: string) => api.get(`/reports/${id}`),
  getByDateRange: (startDate: string, endDate: string) =>
    api.get(`/reports?startDate=${startDate}&endDate=${endDate}`),
  downloadReport: (id: string) =>
    fetch(`${API_BASE_URL}/reports/${id}/download`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),
  generateDaily: (date?: string) =>
    api.post('/reports/generate-daily', { date }),
};
