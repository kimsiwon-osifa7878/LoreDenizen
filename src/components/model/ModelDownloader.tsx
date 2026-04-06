"use client";

import { useState } from "react";
import { useModelStore } from "@/lib/store/model-store";

interface RecommendedModel {
  name: string;
  hfRepo: string;
  fileName: string;
  fileSize: number;
  quantization: string;
  description: string;
}

const RECOMMENDED_MODELS: RecommendedModel[] = [
  {
    name: "TinyLlama 1.1B Chat",
    hfRepo: "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF",
    fileName: "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
    fileSize: 669_000_000,
    quantization: "Q4_K_M",
    description: "초경량 모델, 테스트용으로 적합",
  },
  {
    name: "Gemma 2 2B IT",
    hfRepo: "bartowski/gemma-2-2b-it-GGUF",
    fileName: "gemma-2-2b-it-Q4_K_M.gguf",
    fileSize: 1_630_000_000,
    quantization: "Q4_K_M",
    description: "소형 모델, 괜찮은 품질",
  },
  {
    name: "Phi-3.5 Mini Instruct",
    hfRepo: "bartowski/Phi-3.5-mini-instruct-GGUF",
    fileName: "Phi-3.5-mini-instruct-Q4_K_M.gguf",
    fileSize: 2_180_000_000,
    quantization: "Q4_K_M",
    description: "소형 고품질 모델",
  },
];

export function ModelDownloader() {
  const { isDownloading, downloadProgress, downloadModel } = useModelStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RecommendedModel[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/models?q=${encodeURIComponent(searchQuery)}&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.models || []);
      }
    } catch {
      // 검색 실패 무시
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownload = async (model: RecommendedModel) => {
    await downloadModel(
      model.hfRepo,
      model.fileName,
      model.fileSize,
      model.quantization
    );
  };

  const progressPercent =
    downloadProgress && downloadProgress.total > 0
      ? Math.round((downloadProgress.loaded / downloadProgress.total) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* 다운로드 진행률 */}
      {isDownloading && (
        <div className="p-3 rounded-lg border border-accent bg-accent/5">
          <p className="text-sm font-medium mb-2">다운로드 중...</p>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted mt-1">{progressPercent}%</p>
        </div>
      )}

      {/* 검색 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="HuggingFace에서 GGUF 모델 검색..."
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          {isSearching ? "..." : "검색"}
        </button>
      </div>

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">검색 결과</h3>
          <div className="space-y-2">
            {searchResults.map((model, i) => (
              <ModelCard
                key={i}
                model={model}
                onDownload={handleDownload}
                isDownloading={isDownloading}
              />
            ))}
          </div>
        </div>
      )}

      {/* 추천 모델 */}
      <div>
        <h3 className="text-sm font-medium mb-2">추천 모델</h3>
        <div className="space-y-2">
          {RECOMMENDED_MODELS.map((model, i) => (
            <ModelCard
              key={i}
              model={model}
              onDownload={handleDownload}
              isDownloading={isDownloading}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ModelCard({
  model,
  onDownload,
  isDownloading,
}: {
  model: RecommendedModel;
  onDownload: (model: RecommendedModel) => void;
  isDownloading: boolean;
}) {
  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">{model.name}</p>
          <p className="text-xs text-muted">{model.description}</p>
          <p className="text-xs text-muted mt-1">
            {(model.fileSize / 1024 / 1024 / 1024).toFixed(2)} GB ·{" "}
            {model.quantization}
          </p>
        </div>
        <button
          onClick={() => onDownload(model)}
          disabled={isDownloading}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-accent text-white text-xs hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          다운로드
        </button>
      </div>
    </div>
  );
}
