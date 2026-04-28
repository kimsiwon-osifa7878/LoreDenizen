"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { useModelStore } from "@/lib/store/model-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUIStore } from "@/lib/store/ui-store";
import type { AppLanguage, OpenRouterSort } from "@/lib/types";
import { ModelDownloader } from "./ModelDownloader";

export function ModelManager() {
  const open = useUIStore((s) => s.modelDialogOpen);
  const setOpen = useUIStore((s) => s.setModelDialogOpen);
  const language = useSettingsStore((s) => s.language);
  const [tab, setTab] = useState<"models" | "download" | "openrouter" | "ollama" | "language">("models");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">{t(language, "settings")}</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-muted hover:text-foreground"
            aria-label={t(language, "close")}
          >
            x
          </button>
        </div>

        <div className="grid grid-cols-5 border-b border-border">
          <TabButton active={tab === "models"} onClick={() => setTab("models")} label={t(language, "myModels")} />
          <TabButton active={tab === "download"} onClick={() => setTab("download")} label={t(language, "modelDownload")} />
          <TabButton active={tab === "openrouter"} onClick={() => setTab("openrouter")} label="OpenRouter" />
          <TabButton active={tab === "ollama"} onClick={() => setTab("ollama")} label="Ollama" />
          <TabButton active={tab === "language"} onClick={() => setTab("language")} label={t(language, "language")} />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "models" && <MyModels />}
          {tab === "download" && <ModelDownloader />}
          {tab === "openrouter" && <OpenRouterSettings />}
          {tab === "ollama" && <OllamaSettings />}
          {tab === "language" && <LanguageSettings />}
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

function TabButton({ active, label, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`py-2.5 text-sm font-medium transition-colors ${
        active
          ? "border-b-2 border-accent text-accent"
          : "text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function MyModels() {
  const language = useSettingsStore((s) => s.language);
  const models = useModelStore((s) => s.models);
  const activeModelId = useModelStore((s) => s.activeModelId);
  const selectModel = useModelStore((s) => s.selectModel);
  const removeModel = useModelStore((s) => s.removeModel);
  const isLoadingModel = useModelStore((s) => s.isLoadingModel);

  if (models.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        {t(language, "noDownloadedModels")}
        <br />
        {t(language, "downloadModelsHint")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {models.map((model) => {
        const isActive = activeModelId === model.id;

        return (
          <div
            key={model.id}
            className={`rounded-lg border p-3 transition-colors ${
              isActive ? "border-accent bg-accent/5" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{model.fileName}</p>
                <p className="truncate text-xs text-muted">{model.hfRepo}</p>
                <p className="mt-1 text-xs text-muted">
                  {(model.fileSize / 1024 / 1024 / 1024).toFixed(2)} GB · {model.quantization}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {isActive ? (
                  <span className="text-xs font-medium text-green-500">{t(language, "loaded")}</span>
                ) : (
                  <button
                    onClick={() => selectModel(model.id)}
                    disabled={isLoadingModel}
                    className="text-xs text-accent hover:underline disabled:opacity-50"
                  >
                    {isLoadingModel ? t(language, "loading") : t(language, "select")}
                  </button>
                )}
                <button
                  onClick={() => removeModel(model.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  {t(language, "delete")}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OpenRouterSettings() {
  const language = useSettingsStore((s) => s.language);
  const activeModelId = useModelStore((s) => s.activeModelId);
  const models = useModelStore((s) => s.openRouterModels);
  const openRouterHasEnvApiKey = useModelStore((s) => s.openRouterHasEnvApiKey);
  const isLoading = useModelStore((s) => s.isLoadingOpenRouterModels);
  const hasMore = useModelStore((s) => s.openRouterHasMore);
  const storeQuery = useModelStore((s) => s.openRouterQuery);
  const storeSort = useModelStore((s) => s.openRouterSort);
  const setOpenRouterQuery = useModelStore((s) => s.setOpenRouterQuery);
  const setOpenRouterSort = useModelStore((s) => s.setOpenRouterSort);
  const searchOpenRouterModels = useModelStore((s) => s.searchOpenRouterModels);
  const loadMoreOpenRouterModels = useModelStore((s) => s.loadMoreOpenRouterModels);
  const connectOpenRouter = useModelStore((s) => s.connectOpenRouter);

  const [queryInput, setQueryInput] = useState(storeQuery);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const selectedFromActiveModel = useMemo(() => {
    if (!activeModelId?.startsWith("openrouter::")) {
      return "";
    }

    return activeModelId.replace("openrouter::", "");
  }, [activeModelId]);

  useEffect(() => {
    setQueryInput(storeQuery);
  }, [storeQuery]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target?.isIntersecting && hasMore && !isLoading) {
        void loadMoreOpenRouterModels();
      }
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMoreOpenRouterModels]);

  async function handleSearch() {
    setOpenRouterQuery(queryInput);
    await searchOpenRouterModels(queryInput);
  }

  async function handleSelectModel(model: string) {
    if (!model) {
      window.alert(t(language, "openRouterSelectModelFirst"));
      return;
    }

    let sessionApiKey: string | null = null;
    if (!openRouterHasEnvApiKey) {
      const input = window.prompt(
        t(language, "openRouterMissingApiKey")
      );

      if (!input?.trim()) {
        return;
      }

      sessionApiKey = input.trim();
    }

    await connectOpenRouter(model, sessionApiKey);
    window.alert(t(language, "openRouterConnected", { model }));
  }

  const openRouterSortOptions: Array<{ label: string; value: OpenRouterSort }> = [
    { label: t(language, "openRouterSortCreatedDesc"), value: "created_desc" },
    { label: t(language, "openRouterSortContextDesc"), value: "context_desc" },
    { label: t(language, "openRouterSortPromptAsc"), value: "pricing_prompt_asc" },
    { label: t(language, "openRouterSortCompletionAsc"), value: "pricing_completion_asc" },
    { label: t(language, "openRouterSortNameAsc"), value: "name_asc" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-bubble-assistant/40 p-3 text-sm text-muted">
        {t(language, "openRouterCostNotice")}
      </div>

      <div className="rounded-lg border border-border p-3">
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-xs text-muted">{t(language, "search")}</label>
            <input
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder={t(language, "openRouterModelSearchPlaceholder")}
            />
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1 block text-xs text-muted">{t(language, "sort")}</label>
            <select
              value={storeSort}
              onChange={(event) => {
                void setOpenRouterSort(event.target.value as OpenRouterSort);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {openRouterSortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              void handleSearch();
            }}
            className="rounded-lg bg-accent px-3 py-2 text-sm text-white transition-colors hover:bg-accent-hover"
          >
            {t(language, "search")}
          </button>
        </div>

        <div className="h-[360px] overflow-y-auto rounded-lg border border-border">
          {models.length === 0 && !isLoading ? (
            <p className="p-4 text-sm text-muted">{t(language, "openRouterNoResults")}</p>
          ) : (
            <div className="divide-y divide-border">
              {models.map((model) => {
                const isSelected = selectedFromActiveModel === model.id;

                return (
                  <div
                    key={model.id}
                    className={`w-full p-3 text-left transition-colors ${
                      isSelected
                        ? "bg-accent/10"
                        : "hover:bg-bubble-assistant/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{model.id}</p>
                        <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted sm:grid-cols-4">
                          <span>{t(language, "openRouterInputPrice")}: {formatPricePerMillion(model.promptPrice)}</span>
                          <span>{t(language, "openRouterOutputPrice")}: {formatPricePerMillion(model.completionPrice)}</span>
                          <span>{t(language, "openRouterContext")}: {formatContext(model.contextLength)}</span>
                          <span>{t(language, "openRouterRelease")}: {formatDate(model.created)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          void handleSelectModel(model.id);
                        }}
                        className="rounded-md border border-accent px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
                      >
                        {isSelected ? t(language, "selected") : t(language, "openRouterSelect")}
                      </button>
                    </div>
                  </div>
                );
              })}
              <div ref={sentinelRef} className="h-4" />
            </div>
          )}

          {isLoading && (
            <p className="p-3 text-center text-xs text-muted">{t(language, "openRouterLoading")}</p>
          )}
          {!hasMore && models.length > 0 && (
            <p className="p-3 text-center text-xs text-muted">{t(language, "openRouterMaxShown")}</p>
          )}
        </div>
      </div>

      {!openRouterHasEnvApiKey && (
        <p className="text-xs text-amber-600">
          {t(language, "openRouterEnvMissingHint")}
        </p>
      )}
    </div>
  );
}

function formatPricePerMillion(value: number | null): string {
  if (value === null) {
    return "-";
  }

  const perMillion = value * 1_000_000;
  return `$${perMillion.toFixed(2)}/1M tokens`;
}

function formatContext(value: number | null): string {
  if (!value) {
    return "-";
  }

  return value.toLocaleString();
}

function formatDate(value: number | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value * 1000).toISOString().slice(0, 10);
}

function OllamaSettings() {
  const language = useSettingsStore((s) => s.language);
  const [urlInput, setUrlInput] = useState(useModelStore.getState().ollamaUrl);
  const ollamaUrl = useModelStore((s) => s.ollamaUrl);
  const ollamaModels = useModelStore((s) => s.ollamaModels);
  const activeModelId = useModelStore((s) => s.activeModelId);
  const connectOllama = useModelStore((s) => s.connectOllama);
  const selectOllamaModel = useModelStore((s) => s.selectOllamaModel);

  const selectedModel = activeModelId?.startsWith("ollama::")
    ? activeModelId.replace("ollama::", "")
    : "";

  async function handleConnect() {
    try {
      await connectOllama(urlInput || ollamaUrl);
    } catch {
      window.alert(t(language, "ollamaNoServer"));
    }
  }

  async function handleSelectModel(model: string) {
    if (!model) {
      return;
    }

    await selectOllamaModel(model);
    window.alert(t(language, "ollamaConnected", { model }));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-bubble-assistant/40 p-3 text-sm text-muted">
        {t(language, "ollamaConnectHint")}
      </div>

      <div className="rounded-lg border border-border p-3">
        <label className="mb-2 block text-sm font-medium">{t(language, "ollamaUrl")}</label>
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="http://localhost:11434"
          />
          <button
            type="button"
            onClick={() => {
              void handleConnect();
            }}
            className="rounded-lg bg-accent px-3 py-2 text-sm text-white transition-colors hover:bg-accent-hover"
          >
            {t(language, "connect")}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border p-3">
        <p className="mb-2 text-sm font-medium">{t(language, "ollamaSelectModel")}</p>
        {ollamaModels.length === 0 ? (
          <p className="text-xs text-muted">{t(language, "ollamaLoadModelsHint")}</p>
        ) : (
          <select
            value={selectedModel}
            onChange={(event) => {
              void handleSelectModel(event.target.value);
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">{t(language, "selectModelPlaceholder")}</option>
            {ollamaModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

function LanguageSettings() {
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const options: Array<{ value: AppLanguage; label: string }> = [
    { value: "en", label: t(language, "english") },
    { value: "ko", label: t(language, "korean") },
  ];

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">{t(language, "language")}</h3>
        <p className="mt-1 text-xs text-muted">{t(language, "languageDescription")}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setLanguage(option.value)}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              language === option.value
                ? "border-accent bg-accent/10 text-accent"
                : "border-border hover:bg-bubble-assistant/40"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
