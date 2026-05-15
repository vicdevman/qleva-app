import { create } from "zustand";

interface UIState {
  commandBarOpen: boolean;
  notificationsOpen: boolean;
  profileMenuOpen: boolean;
  sidebarCollapsed: boolean;
  toggleCommandBar: () => void;
  setCommandBarOpen: (open: boolean) => void;
  toggleNotifications: () => void;
  setNotificationsOpen: (open: boolean) => void;
  toggleProfileMenu: () => void;
  setProfileMenuOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  commandBarOpen: false,
  notificationsOpen: false,
  profileMenuOpen: false,
  sidebarCollapsed: false,
  toggleCommandBar: () => set((s) => ({ commandBarOpen: !s.commandBarOpen })),
  setCommandBarOpen: (open) => set({ commandBarOpen: open }),
  toggleNotifications: () => set((s) => ({ notificationsOpen: !s.notificationsOpen })),
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
  toggleProfileMenu: () => set((s) => ({ profileMenuOpen: !s.profileMenuOpen })),
  setProfileMenuOpen: (open) => set({ profileMenuOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
