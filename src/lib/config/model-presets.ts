import "server-only";

import type { HfRepoPreset } from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function normalizeRepoPreset(value: unknown): HfRepoPreset | null {
  if (typeof value === "string") {
    const hfRepo = value.trim();
    return hfRepo ? { hfRepo } : null;
  }

  if (isRecord(value) && typeof value.hfRepo === "string") {
    const hfRepo = value.hfRepo.trim();
    return hfRepo ? { hfRepo } : null;
  }

  return null;
}

export function isValidHfRepo(repo: string): boolean {
  return /^[^/\s]+\/[^/\s]+$/.test(repo.trim());
}

export function getModelPresetsFromEnv(): HfRepoPreset[] {
  const raw = process.env.HF_MODELS;

  if (!raw?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      throw new Error("HF_MODELS must be a JSON array.");
    }

    return parsed
      .map(normalizeRepoPreset)
      .filter((preset): preset is HfRepoPreset => {
        if (!preset) {
          return false;
        }

        return isValidHfRepo(preset.hfRepo);
      });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to parse HF_MODELS:", error);
    }

    return [];
  }
}

export function isHfModelSearchEnabled(): boolean {
  return process.env.ENABLE_HF_MODEL_SEARCH === "true";
}
