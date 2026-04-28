import { create } from "zustand";

interface UIState {
  /** Desktop sidebar expanded (width); never drives the mobile Sheet overlay */
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  /** Mobile navigation drawer only — avoids full-screen blur on desktop when sidebar is expanded */
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  activeMetaAdsAccountId: string | null;
  setActiveMetaAdsAccountId: (id: string | null) => void;
  activeShopifyStoreId: string | null;
  setActiveShopifyStoreId: (id: string | null) => void;
  activeShellView: "chat" | "integrations" | "skills" | "profile";
  setActiveShellView: (
    view: "chat" | "integrations" | "skills" | "profile"
  ) => void;
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  activeMetaAdsAccountId: null,
  setActiveMetaAdsAccountId: (id) => set({ activeMetaAdsAccountId: id }),
  activeShopifyStoreId: null,
  setActiveShopifyStoreId: (id) => set({ activeShopifyStoreId: id }),
  activeShellView: "chat",
  setActiveShellView: (view) => set({ activeShellView: view }),
  selectedConversationId: null,
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),
}));
