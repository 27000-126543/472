import { create } from 'zustand';
import { Order, OrderStatus, PlanRouteResponse, CreateOrderRequest } from '../../shared/types';
import { orderApi } from '../lib/api';

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  routePlan: PlanRouteResponse | null;
  isLoading: boolean;
  error: string | null;
  isPlanning: boolean;
  isCreating: boolean;
  planningResult: PlanRouteResponse | null;
  createError: string | null;
  fetchOrders: (status?: string) => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  planRoute: (data: {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    packageWeight: number;
    receiverAddress?: string;
    receiverLat?: number;
    receiverLng?: number;
  }) => Promise<boolean>;
  createOrder: (data: CreateOrderRequest) => Promise<Order | null>;
  cancelOrder: (id: string) => Promise<boolean>;
  downloadReceipt: (id: string) => Promise<any>;
  getStats: () => {
    total: number;
    inTransit: number;
    completed: number;
    failed: number;
    totalRevenue: number;
    totalRevenueToday: number;
    totalDistance: number;
    totalDistanceToday: number;
    pendingOrders: number;
    cancelledOrders: number;
  };
  clearRoutePlan: () => void;
  clearSelectedOrder: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  selectedOrder: null,
  routePlan: null,
  isLoading: false,
  error: null,
  isPlanning: false,
  isCreating: false,
  planningResult: null,
  createError: null,

  fetchOrders: async (status?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await orderApi.getAll(status);
      if (response.success) {
        set({ orders: response.data || [], isLoading: false });
      } else {
        set({ error: response.error || '获取订单列表失败', isLoading: false });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchOrderById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await orderApi.getById(id);
      if (response.success) {
        set({ selectedOrder: response.data || null, isLoading: false });
      } else {
        set({ error: response.error || '获取订单信息失败', isLoading: false });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  planRoute: async (data) => {
    set({ isPlanning: true, error: null });
    try {
      const response = await orderApi.planRoute(data);
      if (response.success) {
        set({ routePlan: response.data, planningResult: response.data, isPlanning: false });
        return true;
      } else {
        set({ error: response.error || '航线规划失败', isPlanning: false });
        return false;
      }
    } catch (e: any) {
      set({ error: e.message, isPlanning: false });
      return false;
    }
  },

  downloadReceipt: async (id: string) => {
    try {
      const response = await orderApi.getReceipt(id);
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  getStats: () => {
    const { orders } = get();
    const today = new Date().toDateString();
    const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
    return {
      total: orders.length,
      inTransit: orders.filter((o) => o.status === OrderStatus.IN_TRANSIT || o.status === OrderStatus.FLYING).length,
      completed: orders.filter((o) => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.DELIVERED || o.status === OrderStatus.RECEIVED).length,
      failed: orders.filter((o) => o.status === OrderStatus.FAILED || o.status === OrderStatus.CANCELLED || o.status === OrderStatus.ERROR).length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.estimatedCost || 0), 0),
      totalRevenueToday: todayOrders.reduce((sum, o) => sum + (o.estimatedCost || 0), 0),
      totalDistance: 0,
      totalDistanceToday: 0,
      pendingOrders: orders.filter((o) => o.status === OrderStatus.PENDING || o.status === OrderStatus.PENDING_PLANNING || o.status === OrderStatus.PENDING_ASSIGNMENT || o.status === OrderStatus.ASSIGNED).length,
      cancelledOrders: orders.filter((o) => o.status === OrderStatus.CANCELLED).length,
    };
  },

  createOrder: async (data) => {
    set({ isCreating: true, createError: null });
    try {
      const response = await orderApi.create(data);
      if (response.success && response.data) {
        const order = response.data as Order;
        set((state) => ({
          orders: [order, ...state.orders],
          isCreating: false,
          routePlan: null,
          planningResult: null,
        }));
        return order;
      } else {
        set({ createError: response.error || '创建订单失败', isCreating: false });
        return null;
      }
    } catch (e: any) {
      set({ createError: e.message, isCreating: false });
      return null;
    }
  },

  cancelOrder: async (id: string) => {
    try {
      const response = await orderApi.cancel(id);
      if (response.success) {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, status: OrderStatus.CANCELLED } : o
          ),
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  clearRoutePlan: () => set({ routePlan: null }),
  clearSelectedOrder: () => set({ selectedOrder: null }),
}));
