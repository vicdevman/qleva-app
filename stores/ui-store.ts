import { create } from "zustand";

interface UIState {
  commandBarOpen: boolean;
  notificationsOpen: boolean;
  profileMenuOpen: boolean;
  sidebarCollapsed: boolean;
  fundDialogOpen: boolean;
  withdrawDialogOpen: boolean;
  toggleCommandBar: () => void;
  setCommandBarOpen: (open: boolean) => void;
  toggleNotifications: () => void;
  setNotificationsOpen: (open: boolean) => void;
  toggleProfileMenu: () => void;
  setProfileMenuOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setFundDialogOpen: (open: boolean) => void;
  setWithdrawDialogOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  commandBarOpen: false,
  notificationsOpen: false,
  profileMenuOpen: false,
  sidebarCollapsed: false,
  fundDialogOpen: false,
  withdrawDialogOpen: false,
  toggleCommandBar: () => set((s) => ({ commandBarOpen: !s.commandBarOpen })),
  setCommandBarOpen: (open) => set({ commandBarOpen: open }),
  toggleNotifications: () => set((s) => ({ notificationsOpen: !s.notificationsOpen })),
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
  toggleProfileMenu: () => set((s) => ({ profileMenuOpen: !s.profileMenuOpen })),
  setProfileMenuOpen: (open) => set({ profileMenuOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setFundDialogOpen: (open) => set({ fundDialogOpen: open }),
  setWithdrawDialogOpen: (open) => set({ withdrawDialogOpen: open }),
}));
