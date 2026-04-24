"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { useModelStore } from "@/lib/store/model-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUIStore } from "@/lib/store/ui-store";
import type { AppLanguage } from "@/lib/types";
import { ModelDownloader } from "./ModelDownloader";

export function ModelManager() {
  const open = useUIStore((s) => s.modelDialogOpen);
  const setOpen = useUIStore((s) => s.setModelDialogOpen);
  const language = useSettingsStore((s) => s.language);
  const [tab, setTab] = useState<"models" | "download" | "language">(
    "models"
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-background">
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

        <div className="flex border-b border-border">
          <TabButton
            active={tab === "models"}
            onClick={() => setTab("models")}
            label={t(language, "myModels")}
          />
          <TabButton
            active={tab === "download"}
            onClick={() => setTab("download")}
            label={t(language, "modelDownload")}
          />
          <TabButton
            active={tab === "language"}
            onClick={() => setTab("language")}
            label={t(language, "language")}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "models" && <MyModels />}
          {tab === "download" && <ModelDownloader />}
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
      className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
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
                <p className="truncate text-sm font-medium">
                  {model.fileName}
                </p>
                <p className="truncate text-xs text-muted">{model.hfRepo}</p>
                <p className="mt-1 text-xs text-muted">
                  {(model.fileSize / 1024 / 1024 / 1024).toFixed(2)} GB ·{" "}
                  {model.quantization}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {isActive ? (
                  <span className="text-xs font-medium text-green-500">
                    {t(language, "loaded")}
                  </span>
                ) : (
                  <button
                    onClick={() => selectModel(model.id)}
                    disabled={isLoadingModel}
                    className="text-xs text-accent hover:underline disabled:opacity-50"
                  >
                    {isLoadingModel
                      ? t(language, "loading")
                      : t(language, "select")}
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
        <p className="mt-1 text-xs text-muted">
          {t(language, "languageDescription")}
        </p>
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
