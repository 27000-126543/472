import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  notificationPanelOpen: boolean;
  theme: 'dark' | 'light';
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleNotificationPanel: () => void;
  setNotificationPanelOpen: (open: boolean) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  notificationPanelOpen: false,
  theme: 'dark',

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleNotificationPanel: () =>
    set((state) => ({ notificationPanelOpen: !state.notificationPanelOpen })),

  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),
}));
