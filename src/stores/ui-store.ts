import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  activeMetaAdsAccountId: string | null;
  setActiveMetaAdsAccountId: (id: string | null) => void;
  activeShopifyStoreId: string | null;
  setActiveShopifyStoreId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  activeWorkspaceId: null,
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
  activeMetaAdsAccountId: null,
  setActiveMetaAdsAccountId: (id) => set({ activeMetaAdsAccountId: id }),
  activeShopifyStoreId: null,
  setActiveShopifyStoreId: (id) => set({ activeShopifyStoreId: id }),
}));
