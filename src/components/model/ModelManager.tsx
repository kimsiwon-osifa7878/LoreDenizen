"use client";

import { useUIStore } from "@/lib/store/ui-store";
import { useModelStore } from "@/lib/store/model-store";
import { useState } from "react";
import { ModelDownloader } from "./ModelDownloader";

export function ModelManager() {
  const open = useUIStore((s) => s.modelDialogOpen);
  const setOpen = useUIStore((s) => s.setModelDialogOpen);
  const [tab, setTab] = useState<"models" | "download">("models");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">모델 관리</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("models")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "models"
                ? "text-accent border-b-2 border-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            내 모델
          </button>
          <button
            onClick={() => setTab("download")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "download"
                ? "text-accent border-b-2 border-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            모델 다운로드
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "models" ? <MyModels /> : <ModelDownloader />}
        </div>
      </div>
    </div>
  );
}

function MyModels() {
  const models = useModelStore((s) => s.models);
  const activeModelId = useModelStore((s) => s.activeModelId);
  const selectModel = useModelStore((s) => s.selectModel);
  const removeModel = useModelStore((s) => s.removeModel);
  const isLoadingModel = useModelStore((s) => s.isLoadingModel);

  if (models.length === 0) {
    return (
      <p className="text-sm text-muted text-center py-8">
        다운로드된 모델이 없습니다.
        <br />
        &quot;모델 다운로드&quot; 탭에서 모델을 다운로드하세요.
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
            className={`p-3 rounded-lg border transition-colors ${
              isActive ? "border-accent bg-accent/5" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {model.fileName}
                </p>
                <p className="text-xs text-muted truncate">{model.hfRepo}</p>
                <p className="text-xs text-muted mt-1">
                  {(model.fileSize / 1024 / 1024 / 1024).toFixed(2)} GB ·{" "}
                  {model.quantization}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isActive ? (
                  <span className="text-xs text-green-500 font-medium">
                    로드됨
                  </span>
                ) : (
                  <button
                    onClick={() => selectModel(model.id)}
                    disabled={isLoadingModel}
                    className="text-xs text-accent hover:underline disabled:opacity-50"
                  >
                    {isLoadingModel ? "로딩..." : "선택"}
                  </button>
                )}
                <button
                  onClick={() => removeModel(model.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
