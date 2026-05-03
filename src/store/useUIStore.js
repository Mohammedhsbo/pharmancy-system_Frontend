import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  toasts: [],

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  openMobileSidebar: () => set({ sidebarMobileOpen: true }),
  closeMobileSidebar: () => set({ sidebarMobileOpen: false }),

  addToast: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { id: Date.now() + Math.random(), duration: 4000, ...toast },
      ],
    })),

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
