import { db } from "./database";
import type { AppSettings } from "../types";
import { DEFAULT_INFERENCE_PARAMS } from "../types";

const DEFAULT_SETTINGS: AppSettings = {
  id: "global",
  activeModelId: null,
  defaultCharacterId: null,
  theme: "system",
  inferenceParams: DEFAULT_INFERENCE_PARAMS,
};

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get("global");
  if (!settings) {
    await db.settings.add(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return settings;
}

export async function updateSettings(
  data: Partial<Omit<AppSettings, "id">>
): Promise<void> {
  const existing = await db.settings.get("global");
  if (!existing) {
    await db.settings.add({ ...DEFAULT_SETTINGS, ...data });
  } else {
    await db.settings.update("global", data);
  }
}
