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
  images: string[];
  systemPrompt: string;
  promptSections?: CharacterPromptSections;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CharacterPromptSections {
  description: string;
  personality: string;
  scenario: string;
  firstMessage: string;
  exampleMessages: string;
  authorNote: string;
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
export type ModelProvider = "local" | "openrouter" | "ollama";
export type OpenRouterSort =
  | "created_desc"
  | "context_desc"
  | "pricing_prompt_asc"
  | "pricing_completion_asc"
  | "name_asc";

export interface OpenRouterModelItem {
  id: string;
  name: string;
  contextLength: number | null;
  promptPrice: number | null;
  completionPrice: number | null;
  created: number | null;
}

export interface AppSettings {
  id: "global";
  activeModelId: string | null;
  activeProvider: ModelProvider | null;
  openRouterModel: string | null;
  ollamaUrl: string;
  ollamaModel: string | null;
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
