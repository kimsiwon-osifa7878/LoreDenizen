import { db } from "../db/database";
import type { DownloadedModel } from "../types";

export async function addDownloadedModel(
  data: Omit<DownloadedModel, "id" | "downloadedAt" | "lastUsedAt">
): Promise<DownloadedModel> {
  const now = new Date();
  const model: DownloadedModel = {
    id: `${data.hfRepo}::${data.fileName}`,
    ...data,
    downloadedAt: now,
    lastUsedAt: now,
  };
  await db.downloadedModels.put(model);
  return model;
}

export async function getAllDownloadedModels(): Promise<DownloadedModel[]> {
  return db.downloadedModels.orderBy("downloadedAt").reverse().toArray();
}

export async function getDownloadedModel(
  id: string
): Promise<DownloadedModel | undefined> {
  return db.downloadedModels.get(id);
}

export async function updateModelLastUsed(id: string): Promise<void> {
  await db.downloadedModels.update(id, { lastUsedAt: new Date() });
}

export async function deleteDownloadedModel(id: string): Promise<void> {
  await db.downloadedModels.delete(id);
}
