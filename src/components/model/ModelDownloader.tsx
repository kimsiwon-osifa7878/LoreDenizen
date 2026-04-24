"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  getCompatibilityLabel,
  getCompatibilityReason,
  t,
} from "@/lib/i18n";
import { useModelStore } from "@/lib/store/model-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import type { AppLanguage } from "@/lib/types";
import type { HfRepoFile, HfRepoPreset } from "@/lib/types";

interface RepoListResponse {
  repos: HfRepoPreset[];
  searchEnabled: boolean;
}

interface RepoFilesResponse {
  hfRepo: string;
  files: HfRepoFile[];
}

interface RepoFilesErrorResponse {
  error?: string;
}

function isValidHfRepo(repo: string): boolean {
  return /^[^/\s]+\/[^/\s]+$/.test(repo.trim());
}

function formatFileSize(language: AppLanguage, fileSize: number): string {
  if (!fileSize) {
    return t(language, "sizeUnknown");
  }

  return `${(fileSize / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function getCompatibilityClassName(file: HfRepoFile): string {
  if (file.compatibility === "supported") {
    return "border-green-500/40 bg-green-500/10 text-green-700";
  }

  if (file.compatibility === "unsupported") {
    return "border-red-500/40 bg-red-500/10 text-red-700";
  }

  return "border-yellow-500/40 bg-yellow-500/10 text-yellow-700";
}

export function ModelDownloader() {
  const language = useSettingsStore((s) => s.language);
  const {
    isDownloading,
    downloadProgress,
    downloadModel,
    selectModel,
    isLoadingModel,
  } = useModelStore();
  const [repos, setRepos] = useState<HfRepoPreset[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(true);
  const [reposError, setReposError] = useState<string | null>(null);
  const [manualRepoInput, setManualRepoInput] = useState("");
  const [manualRepoError, setManualRepoError] = useState<string | null>(null);
  const [activeRepo, setActiveRepo] = useState<string | null>(null);
  const [loadingRepo, setLoadingRepo] = useState<string | null>(null);
  const [repoFiles, setRepoFiles] = useState<Record<string, HfRepoFile[]>>({});
  const [repoErrors, setRepoErrors] = useState<Record<string, string>>({});
  const [isFilesCollapsed, setIsFilesCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRepos() {
      try {
        setIsLoadingRepos(true);
        setReposError(null);

        const response = await fetch("/api/models", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(t(language, "repoPresetsError"));
        }

        const data = (await response.json()) as RepoListResponse;
        if (cancelled) return;

        setRepos(Array.isArray(data.repos) ? data.repos : []);
      } catch {
        if (cancelled) return;
        setReposError(t(language, "repoPresetsError"));
      } finally {
        if (!cancelled) {
          setIsLoadingRepos(false);
        }
      }
    }

    loadRepos();

    return () => {
      cancelled = true;
    };
  }, [language]);

  async function loadRepoFiles(repo: string) {
    const normalizedRepo = repo.trim();

    setActiveRepo(normalizedRepo);
    setIsFilesCollapsed(false);
    setManualRepoError(null);
    setRepoErrors((current) => {
      const next = { ...current };
      delete next[normalizedRepo];
      return next;
    });

    if (repoFiles[normalizedRepo]) {
      return;
    }

    try {
      setLoadingRepo(normalizedRepo);
      const response = await fetch(
        `/api/models/files?repo=${encodeURIComponent(normalizedRepo)}`,
        { cache: "no-store" }
      );
      const payload = (await response.json()) as
        | RepoFilesResponse
        | RepoFilesErrorResponse;

      if (!response.ok) {
        throw new Error(t(language, "ggufFilesError"));
      }

      const successPayload = payload as RepoFilesResponse;

      setRepoFiles((current) => ({
        ...current,
        [normalizedRepo]: Array.isArray(successPayload.files)
          ? successPayload.files
          : [],
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t(language, "ggufFilesError");

      setRepoErrors((current) => ({
        ...current,
        [normalizedRepo]: message,
      }));
    } finally {
      setLoadingRepo((current) =>
        current === normalizedRepo ? null : current
      );
    }
  }

  async function handleManualRepoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedRepo = manualRepoInput.trim();
    if (!isValidHfRepo(normalizedRepo)) {
      setManualRepoError(t(language, "invalidRepo"));
      return;
    }

    await loadRepoFiles(normalizedRepo);
  }

  async function handleDownload(file: HfRepoFile) {
    await downloadModel(
      file.hfRepo,
      file.fileName,
      file.fileSize,
      file.quantization
    );
    await selectModel(`${file.hfRepo}::${file.fileName}`);
  }

  const progressPercent =
    downloadProgress && downloadProgress.total > 0
      ? Math.round((downloadProgress.loaded / downloadProgress.total) * 100)
      : 0;

  const activeFiles = activeRepo ? repoFiles[activeRepo] ?? [] : [];
  const activeError = activeRepo ? repoErrors[activeRepo] : null;
  const hasBlockedFiles = activeFiles.some(
    (file) => file.compatibility !== "supported"
  );

  const ggufFilesPanel = (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">{t(language, "ggufFiles")}</h3>
        <button
          type="button"
          onClick={() => setIsFilesCollapsed((current) => !current)}
          className="rounded-lg border border-border px-2 py-1 text-xs text-muted transition-colors hover:bg-bubble-assistant/40"
          aria-expanded={!isFilesCollapsed}
        >
          {isFilesCollapsed ? t(language, "expand") : t(language, "collapse")}
        </button>
      </div>

      {!isFilesCollapsed && (
        <>
          {!activeRepo && (
            <p className="mt-2 text-sm text-muted">
              {t(language, "ggufFilesEmpty")}
            </p>
          )}
          {activeRepo && loadingRepo === activeRepo && (
            <p className="mt-2 text-sm text-muted">
              {t(language, "checkingCompatibility", { repo: activeRepo })}
            </p>
          )}
          {activeRepo && !loadingRepo && activeError && (
            <p className="mt-2 text-sm text-red-500">{activeError}</p>
          )}
          {activeRepo &&
            !loadingRepo &&
            !activeError &&
            activeFiles.length === 0 && (
              <p className="mt-2 text-sm text-muted">
                {t(language, "noGgufFiles", { repo: activeRepo })}
              </p>
            )}
          {activeRepo &&
            !loadingRepo &&
            !activeError &&
            activeFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {hasBlockedFiles && (
                  <p className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-700">
                    {t(language, "blockedFiles")}
                  </p>
                )}
                {activeFiles.map((file) => (
                  <div
                    key={`${file.hfRepo}::${file.fileName}`}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium break-all">
                          {file.fileName}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {formatFileSize(language, file.fileSize)} -{" "}
                          {file.quantization}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs ${getCompatibilityClassName(
                              file
                            )}`}
                          >
                            {getCompatibilityLabel(language, file)}
                          </span>
                          <span className="text-xs text-muted">
                            {t(language, "architecture")}:{" "}
                            {file.architecture ?? t(language, "unknown")}
                          </span>
                        </div>
                        {file.compatibility !== "supported" && (
                            <p className="mt-2 text-xs text-muted">
                              {getCompatibilityReason(language, file)}
                            </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        disabled={
                          isDownloading ||
                          isLoadingModel ||
                          file.compatibility !== "supported"
                        }
                        className="flex-shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                      >
                        {t(language, "download")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {isDownloading && (
        <div className="rounded-lg border border-accent bg-accent/5 p-3">
          <p className="mb-2 text-sm font-medium">
            {t(language, "downloading")}
          </p>
          <div className="h-2 w-full rounded-full bg-border">
            <div
              className="h-2 rounded-full bg-accent transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted">{progressPercent}%</p>
        </div>
      )}

      <div className="rounded-lg border border-border bg-bubble-assistant/40 p-3">
        <p className="text-sm font-medium">{t(language, "ggufDownloads")}</p>
        <p className="mt-1 text-xs text-muted">
          {t(language, "ggufDownloadsDescription")}
        </p>
      </div>

      <form
        onSubmit={handleManualRepoSubmit}
        className="rounded-lg border border-border p-3"
      >
        <label htmlFor="hf-repo-input" className="text-sm font-medium">
          {t(language, "openRepoDirectly")}
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="hf-repo-input"
            type="text"
            value={manualRepoInput}
            onChange={(event) => setManualRepoInput(event.target.value)}
            placeholder="owner/name"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={loadingRepo !== null}
            className="rounded-lg bg-accent px-4 py-2 text-sm text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loadingRepo !== null
              ? t(language, "checking")
              : t(language, "loadGguf")}
          </button>
        </div>
        {manualRepoError && (
          <p className="mt-2 text-xs text-red-500">{manualRepoError}</p>
        )}
      </form>

      {ggufFilesPanel}

      <div className="rounded-lg border border-border p-3">
        <h3 className="text-sm font-medium">
          {t(language, "configuredRepos")}
        </h3>
        {isLoadingRepos && (
          <p className="mt-2 text-sm text-muted">
            {t(language, "loadingRepoPresets")}
          </p>
        )}
        {!isLoadingRepos && reposError && (
          <p className="mt-2 text-sm text-red-500">{reposError}</p>
        )}
        {!isLoadingRepos && !reposError && repos.length === 0 && (
          <p className="mt-2 text-sm text-muted">
            {t(language, "noConfiguredRepos")}
          </p>
        )}
        {!isLoadingRepos && !reposError && repos.length > 0 && (
          <div className="mt-3 space-y-2">
            {repos.map((repo) => {
              const isActive = activeRepo === repo.hfRepo;
              return (
                <button
                  key={repo.hfRepo}
                  type="button"
                  onClick={() => loadRepoFiles(repo.hfRepo)}
                  className={`block w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                    isActive
                      ? "border-accent bg-accent/5"
                      : "border-border hover:bg-bubble-assistant/40"
                  }`}
                >
                  <p className="text-sm font-medium">{repo.hfRepo}</p>
                  <p className="mt-1 text-xs text-muted">
                    {t(language, "repoClickHint")}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
