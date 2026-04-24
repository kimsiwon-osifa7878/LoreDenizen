import { create } from "zustand";
import { getSettings, updateSettings } from "../db/settings";
import type { AppLanguage } from "../types";

interface SettingsState {
  language: AppLanguage;
  loadSettings: () => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: "en",

  loadSettings: async () => {
    const settings = await getSettings();
    set({ language: settings.language });
  },

  setLanguage: async (language) => {
    set({ language });
    await updateSettings({ language });
  },
}));
