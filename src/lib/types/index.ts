export interface Conversation {
  id: string;
  title: string;
  characterId: string | null;
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "system" | "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface Character {
  id: string;
  name: string;
  avatar: string;
  systemPrompt: string;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DownloadedModel {
  id: string;
  hfRepo: string;
  fileName: string;
  fileSize: number;
  quantization: string;
  downloadedAt: Date;
  lastUsedAt: Date;
}

export interface HfRepoPreset {
  hfRepo: string;
}

export interface HfRepoFile {
  hfRepo: string;
  fileName: string;
  fileSize: number;
  quantization: string;
  architecture: string | null;
  compatibility: ModelCompatibility;
  compatibilityReason: string | null;
}

export type ModelCompatibility = "supported" | "unsupported" | "unknown";
export type AppLanguage = "en" | "ko";

export interface AppSettings {
  id: "global";
  activeModelId: string | null;
  defaultCharacterId: string | null;
  theme: "light" | "dark" | "system";
  language: AppLanguage;
  inferenceParams: InferenceParams;
}

export interface InferenceParams {
  temperature: number;
  topP: number;
  topK: number;
  repeatPenalty: number;
  maxTokens: number;
}

export const DEFAULT_INFERENCE_PARAMS: InferenceParams = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  repeatPenalty: 1.1,
  maxTokens: 512,
};
