import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  modelDialogOpen: boolean;
  characterEditorOpen: boolean;
  editingCharacterId: string | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setModelDialogOpen: (open: boolean) => void;
  setCharacterEditorOpen: (open: boolean, characterId?: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  modelDialogOpen: false,
  characterEditorOpen: false,
  editingCharacterId: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setModelDialogOpen: (open) => set({ modelDialogOpen: open }),
  setCharacterEditorOpen: (open, characterId = null) =>
    set({ characterEditorOpen: open, editingCharacterId: characterId }),
}));
