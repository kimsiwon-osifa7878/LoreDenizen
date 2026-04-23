import { create } from "zustand";
import type { DownloadedModel } from "../types";
import {
  getAllDownloadedModels,
  addDownloadedModel,
  deleteDownloadedModel,
  updateModelLastUsed,
} from "../llm/model-manager";
import { llmEngine } from "../llm/engine";
import { updateSettings } from "../db/settings";

interface ModelState {
  models: DownloadedModel[];
  activeModelId: string | null;
  isDownloading: boolean;
  downloadProgress: { loaded: number; total: number } | null;
  isLoadingModel: boolean;
  loadModels: () => Promise<void>;
  downloadModel: (
    hfRepo: string,
    fileName: string,
    fileSize: number,
    quantization: string
  ) => Promise<void>;
  selectModel: (id: string) => Promise<void>;
  removeModel: (id: string) => Promise<void>;
  unloadModel: () => Promise<void>;
}

export const useModelStore = create<ModelState>((set, get) => ({
  models: [],
  activeModelId: null,
  isDownloading: false,
  downloadProgress: null,
  isLoadingModel: false,

  loadModels: async () => {
    const models = await getAllDownloadedModels();
    set({ models });
  },

  downloadModel: async (hfRepo, fileName, fileSize, quantization) => {
    set({ isDownloading: true, downloadProgress: { loaded: 0, total: 0 } });
    try {
      await llmEngine.downloadModel(hfRepo, fileName, (progress) => {
        set({ downloadProgress: progress });
      });
      await addDownloadedModel({ hfRepo, fileName, fileSize, quantization });
      const models = await getAllDownloadedModels();
      set({ models });
    } finally {
      set({ isDownloading: false, downloadProgress: null });
    }
  },

  selectModel: async (id) => {
    set({ isLoadingModel: true });
    try {
      const model = get().models.find((m) => m.id === id);
      if (!model) throw new Error("모델을 찾을 수 없음");
      await llmEngine.loadModel(model.hfRepo, model.fileName);
      await updateModelLastUsed(id);
      await updateSettings({ activeModelId: id });
      set({ activeModelId: id });
    } finally {
      set({ isLoadingModel: false });
    }
  },

  removeModel: async (id) => {
    if (get().activeModelId === id) {
      await llmEngine.unloadModel();
      set({ activeModelId: null });
      await updateSettings({ activeModelId: null });
    }
    await deleteDownloadedModel(id);
    const models = await getAllDownloadedModels();
    set({ models });
  },

  unloadModel: async () => {
    await llmEngine.unloadModel();
    await updateSettings({ activeModelId: null });
    set({ activeModelId: null });
  },
}));
