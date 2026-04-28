import { create } from "zustand";
import type {
  DownloadedModel,
  ModelProvider,
  OpenRouterModelItem,
  OpenRouterSort,
} from "../types";
import {
  getAllDownloadedModels,
  addDownloadedModel,
  deleteDownloadedModel,
  updateModelLastUsed,
} from "../llm/model-manager";
import { llmEngine } from "../llm/engine";
import { getSettings, updateSettings } from "../db/settings";
import { DEFAULT_OLLAMA_URL, normalizeOllamaUrl } from "../ollama/url";

interface OpenRouterListResponse {
  items?: OpenRouterModelItem[];
  hasMore?: boolean;
}

interface OpenRouterValidateResponse {
  valid?: boolean;
  error?: string;
}

interface ModelState {
  models: DownloadedModel[];
  activeModelId: string | null;
  activeProvider: ModelProvider | null;
  isDownloading: boolean;
  downloadProgress: { loaded: number; total: number } | null;
  isLoadingModel: boolean;
  openRouterHasEnvApiKey: boolean;
  openRouterModels: OpenRouterModelItem[];
  openRouterQuery: string;
  openRouterSort: OpenRouterSort;
  openRouterOffset: number;
  openRouterHasMore: boolean;
  isLoadingOpenRouterModels: boolean;
  ollamaUrl: string;
  ollamaModels: string[];
  loadModels: () => Promise<void>;
  loadRemoteConfigs: () => Promise<void>;
  setOpenRouterQuery: (query: string) => void;
  setOpenRouterSort: (sort: OpenRouterSort) => Promise<void>;
  searchOpenRouterModels: (query?: string) => Promise<void>;
  loadMoreOpenRouterModels: () => Promise<void>;
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

const OPENROUTER_PAGE_SIZE = 10;

async function fetchOpenRouterModels(
  query: string,
  sort: OpenRouterSort,
  offset: number
): Promise<OpenRouterListResponse> {
  const params = new URLSearchParams({
    q: query,
    sort,
    offset: String(offset),
    limit: String(OPENROUTER_PAGE_SIZE),
  });

  const response = await fetch(`/api/openrouter/models?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("OPENROUTER_MODELS_LOAD_FAILED");
  }

  return (await response.json()) as OpenRouterListResponse;
}

export const useModelStore = create<ModelState>((set, get) => ({
  models: [],
  activeModelId: null,
  activeProvider: null,
  isDownloading: false,
  downloadProgress: null,
  isLoadingModel: false,
  openRouterHasEnvApiKey: false,
  openRouterModels: [],
  openRouterQuery: "",
  openRouterSort: "created_desc",
  openRouterOffset: 0,
  openRouterHasMore: false,
  isLoadingOpenRouterModels: false,
  ollamaUrl: DEFAULT_OLLAMA_URL,
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
      if (llmEngine.hasOpenRouterSessionApiKey()) {
        llmEngine.configureOpenRouter(settings.openRouterModel);
      }
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
      };

      set({
        openRouterHasEnvApiKey: Boolean(data.hasApiKey),
      });

      const settings = await getSettings();
      if (
        settings.activeProvider === "openrouter" &&
        settings.openRouterModel &&
        !data.hasApiKey &&
        !llmEngine.hasOpenRouterSessionApiKey()
      ) {
        await updateSettings({
          activeProvider: null,
          activeModelId: null,
          openRouterModel: null,
        });
        set({ activeModelId: null, activeProvider: null });
      } else if (settings.activeProvider === "openrouter" && settings.openRouterModel) {
        llmEngine.configureOpenRouter(settings.openRouterModel);
      }

      await get().searchOpenRouterModels();
    } catch {
      set({
        openRouterHasEnvApiKey: false,
        openRouterModels: [],
        openRouterHasMore: false,
      });
    }
  },

  setOpenRouterQuery: (query) => {
    set({ openRouterQuery: query });
  },

  setOpenRouterSort: async (sort) => {
    set({ openRouterSort: sort });
    await get().searchOpenRouterModels();
  },

  searchOpenRouterModels: async (query) => {
    const nextQuery = query ?? get().openRouterQuery;

    set({
      isLoadingOpenRouterModels: true,
      openRouterOffset: 0,
      openRouterQuery: nextQuery,
    });

    try {
      const payload = await fetchOpenRouterModels(nextQuery, get().openRouterSort, 0);
      const items = Array.isArray(payload.items) ? payload.items : [];
      set({
        openRouterModels: items,
        openRouterHasMore: Boolean(payload.hasMore),
        openRouterOffset: items.length,
      });
    } finally {
      set({ isLoadingOpenRouterModels: false });
    }
  },

  loadMoreOpenRouterModels: async () => {
    if (get().isLoadingOpenRouterModels || !get().openRouterHasMore) {
      return;
    }

    set({ isLoadingOpenRouterModels: true });

    try {
      const payload = await fetchOpenRouterModels(
        get().openRouterQuery,
        get().openRouterSort,
        get().openRouterOffset
      );
      const items = Array.isArray(payload.items) ? payload.items : [];

      set((state) => ({
        openRouterModels: [...state.openRouterModels, ...items],
        openRouterHasMore: Boolean(payload.hasMore),
        openRouterOffset: state.openRouterModels.length + items.length,
      }));
    } finally {
      set({ isLoadingOpenRouterModels: false });
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
    const validationResponse = await fetch("/api/openrouter/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        apiKey: sessionApiKey,
      }),
    });
    const validationPayload =
      (await validationResponse.json()) as OpenRouterValidateResponse;
    if (!validationResponse.ok || !validationPayload.valid) {
      throw new Error(validationPayload.error || "OPENROUTER_API_KEY_INVALID");
    }

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
    const normalizedUrl = normalizeOllamaUrl(url);
    const response = await fetch("/api/ollama/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: normalizedUrl }),
    });

    if (!response.ok) {
      throw new Error("OLLAMA_UNREACHABLE");
    }

    const payload = (await response.json()) as {
      normalizedUrl?: string;
      models?: string[];
    };

    const resolvedUrl = payload.normalizedUrl ?? normalizedUrl;
    const models = (payload.models ?? []).map((name) => name.trim()).filter(Boolean);

    set({ ollamaUrl: resolvedUrl, ollamaModels: models });
    await updateSettings({ ollamaUrl: resolvedUrl });

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
