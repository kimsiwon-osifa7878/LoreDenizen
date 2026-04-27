import { create } from "zustand";
import type { DownloadedModel, ModelProvider } from "../types";
import {
  getAllDownloadedModels,
  addDownloadedModel,
  deleteDownloadedModel,
  updateModelLastUsed,
} from "../llm/model-manager";
import { llmEngine } from "../llm/engine";
import { getSettings, updateSettings } from "../db/settings";

interface ModelState {
  models: DownloadedModel[];
  activeModelId: string | null;
  activeProvider: ModelProvider | null;
  isDownloading: boolean;
  downloadProgress: { loaded: number; total: number } | null;
  isLoadingModel: boolean;
  openRouterModels: string[];
  openRouterHasEnvApiKey: boolean;
  ollamaUrl: string;
  ollamaModels: string[];
  loadModels: () => Promise<void>;
  loadRemoteConfigs: () => Promise<void>;
  downloadModel: (
    hfRepo: string,
    fileName: string,
    fileSize: number,
    quantization: string
  ) => Promise<void>;
  selectModel: (id: string) => Promise<void>;
  connectOpenRouter: (model: string, sessionApiKey: string | null) => Promise<void>;
  connectOllama: (url: string) => Promise<string[]>;
  selectOllamaModel: (model: string) => Promise<void>;
  removeModel: (id: string) => Promise<void>;
  unloadModel: () => Promise<void>;
}

export const useModelStore = create<ModelState>((set, get) => ({
  models: [],
  activeModelId: null,
  activeProvider: null,
  isDownloading: false,
  downloadProgress: null,
  isLoadingModel: false,
  openRouterModels: [],
  openRouterHasEnvApiKey: false,
  ollamaUrl: "http://localhost:11434",
  ollamaModels: [],

  loadModels: async () => {
    const [models, settings] = await Promise.all([
      getAllDownloadedModels(),
      getSettings(),
    ]);

    set({
      models,
      activeModelId: settings.activeModelId,
      activeProvider: settings.activeProvider,
      ollamaUrl: settings.ollamaUrl,
    });

    if (settings.activeProvider === "openrouter" && settings.openRouterModel) {
      llmEngine.configureOpenRouter(settings.openRouterModel);
    }

    if (
      settings.activeProvider === "ollama" &&
      settings.ollamaModel &&
      settings.ollamaUrl
    ) {
      llmEngine.configureOllama(settings.ollamaModel, settings.ollamaUrl);
    }
  },

  loadRemoteConfigs: async () => {
    try {
      const response = await fetch("/api/openrouter/config", { cache: "no-store" });
      const data = (await response.json()) as {
        hasApiKey?: boolean;
        models?: string[];
      };

      set({
        openRouterHasEnvApiKey: Boolean(data.hasApiKey),
        openRouterModels: Array.isArray(data.models) ? data.models : [],
      });
    } catch {
      set({ openRouterHasEnvApiKey: false, openRouterModels: [] });
    }
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
      await updateSettings({ activeModelId: id, activeProvider: "local" });
      set({ activeModelId: id, activeProvider: "local" });
    } finally {
      set({ isLoadingModel: false });
    }
  },

  connectOpenRouter: async (model, sessionApiKey) => {
    llmEngine.setOpenRouterSessionApiKey(sessionApiKey);
    llmEngine.configureOpenRouter(model);
    const modelId = `openrouter::${model}`;
    await updateSettings({
      activeProvider: "openrouter",
      activeModelId: modelId,
      openRouterModel: model,
    });
    set({ activeProvider: "openrouter", activeModelId: modelId });
  },

  connectOllama: async (url) => {
    const normalizedUrl = url.trim().replace(/\/$/, "") || "http://localhost:11434";
    const response = await fetch(`${normalizedUrl}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("OLLAMA_UNREACHABLE");
    }

    const payload = (await response.json()) as {
      models?: Array<{ name?: string }>;
    };

    const models = (payload.models ?? [])
      .map((item) => item.name?.trim() ?? "")
      .filter(Boolean);

    set({ ollamaUrl: normalizedUrl, ollamaModels: models });
    await updateSettings({ ollamaUrl: normalizedUrl });

    return models;
  },

  selectOllamaModel: async (model) => {
    const url = get().ollamaUrl;
    llmEngine.configureOllama(model, url);
    const modelId = `ollama::${model}`;

    await updateSettings({
      activeProvider: "ollama",
      activeModelId: modelId,
      ollamaModel: model,
      ollamaUrl: url,
    });

    set({ activeProvider: "ollama", activeModelId: modelId });
  },

  removeModel: async (id) => {
    if (get().activeModelId === id) {
      await llmEngine.unloadModel();
      set({ activeModelId: null, activeProvider: null });
      await updateSettings({ activeModelId: null, activeProvider: null });
    }
    await deleteDownloadedModel(id);
    const models = await getAllDownloadedModels();
    set({ models });
  },

  unloadModel: async () => {
    await llmEngine.unloadModel();
    await updateSettings({ activeModelId: null, activeProvider: null });
    set({ activeModelId: null, activeProvider: null });
  },
}));
