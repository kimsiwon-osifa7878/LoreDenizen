"use client";

import { Wllama } from "@wllama/wllama";
import type { ModelProvider } from "../types";
import { DEFAULT_OLLAMA_URL, normalizeOllamaUrl } from "../ollama/url";

const CONFIG_PATHS = {
  "single-thread/wllama.wasm": "/wasm/single-thread/wllama.wasm",
  "multi-thread/wllama.wasm": "/wasm/multi-thread/wllama.wasm",
};

const NO_THINK_SYSTEM_INSTRUCTION =
  "Answer directly. Do not include chain-of-thought, hidden reasoning, or <think> blocks in the response.";

function stripThinkBlocks(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*$/i, "")
    .trimStart();
}

class LLMEngine {
  private wllama: Wllama | null = null;
  private currentModelId: string | null = null;
  private currentProvider: ModelProvider | null = null;
  private openRouterApiKey: string | null = null;
  private ollamaUrl = DEFAULT_OLLAMA_URL;
  private isLoading = false;
  private abortController: AbortController | null = null;

  async initialize(): Promise<void> {
    if (this.wllama) return;
    this.wllama = new Wllama(CONFIG_PATHS);
  }

  setOpenRouterSessionApiKey(apiKey: string | null): void {
    this.openRouterApiKey = apiKey?.trim() || null;
  }

  hasOpenRouterSessionApiKey(): boolean {
    return Boolean(this.openRouterApiKey);
  }

  setOllamaUrl(url: string): void {
    this.ollamaUrl = normalizeOllamaUrl(url);
  }

  async downloadModel(
    hfRepo: string,
    fileName: string,
    onProgress: (progress: { loaded: number; total: number }) => void
  ): Promise<void> {
    const downloadWllama = new Wllama(CONFIG_PATHS);
    await downloadWllama.loadModelFromHF(hfRepo, fileName, {
      progressCallback: onProgress,
    });
    await downloadWllama.exit();
  }

  async loadModel(hfRepo: string, fileName: string): Promise<void> {
    if (this.isLoading) throw new Error("모델 로딩 중");
    this.isLoading = true;
    try {
      if (this.wllama) {
        await this.wllama.exit();
        this.wllama = null;
      }
      await this.initialize();
      await this.wllama!.loadModelFromHF(hfRepo, fileName, {
        n_ctx: 2048,
      });
      this.currentProvider = "local";
      this.currentModelId = `${hfRepo}::${fileName}`;
    } finally {
      this.isLoading = false;
    }
  }

  configureOpenRouter(model: string): void {
    this.currentProvider = "openrouter";
    this.currentModelId = `openrouter::${model}`;
  }

  configureOllama(model: string, url: string): void {
    this.currentProvider = "ollama";
    this.ollamaUrl = normalizeOllamaUrl(url);
    this.currentModelId = `ollama::${model}`;
  }

  async generateCompletion(
    messages: Array<{ role: string; content: string }>,
    params: {
      temperature: number;
      topP: number;
      topK: number;
      repeatPenalty: number;
      maxTokens: number;
    },
    onToken: (token: string, currentText: string) => void
  ): Promise<string> {
    if (this.currentProvider === "openrouter") {
      return this.generateWithOpenRouter(messages, params, onToken);
    }

    if (this.currentProvider === "ollama") {
      return this.generateWithOllama(messages, params, onToken);
    }

    if (!this.wllama) throw new Error("모델이 로드되지 않음");

    this.abortController = new AbortController();
    const prompt = this.formatMessages(this.withNoThinkInstruction(messages));

    const result = await this.wllama.createCompletion(prompt, {
      nPredict: params.maxTokens,
      sampling: {
        temp: params.temperature,
        top_p: params.topP,
        top_k: params.topK,
        penalty_repeat: params.repeatPenalty,
      },
      onNewToken: (_token, _piece, currentText, { abortSignal }) => {
        if (this.abortController?.signal.aborted) {
          abortSignal();
          return;
        }
        const visibleText = stripThinkBlocks(currentText);
        onToken(visibleText, visibleText);
      },
    });

    this.abortController = null;
    return stripThinkBlocks(result);
  }

  private async generateWithOpenRouter(
    messages: Array<{ role: string; content: string }>,
    params: { temperature: number; topP: number; maxTokens: number },
    onToken: (token: string, currentText: string) => void
  ): Promise<string> {
    if (!this.currentModelId) {
      throw new Error("OpenRouter 모델이 선택되지 않음");
    }

    const model = this.currentModelId.replace("openrouter::", "");
    const response = await fetch("/api/openrouter/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        apiKey: this.openRouterApiKey,
        messages: this.withNoThinkInstruction(messages),
        params,
      }),
    });

    const payload = (await response.json()) as { content?: string; error?: string };
    if (!response.ok || !payload.content) {
      throw new Error(payload.error || "OpenRouter 요청 실패");
    }

    const visibleText = stripThinkBlocks(payload.content);
    onToken(visibleText, visibleText);
    return visibleText;
  }

  private async generateWithOllama(
    messages: Array<{ role: string; content: string }>,
    params: {
      temperature: number;
      topP: number;
      topK: number;
      repeatPenalty: number;
      maxTokens: number;
    },
    onToken: (token: string, currentText: string) => void
  ): Promise<string> {
    if (!this.currentModelId) {
      throw new Error("Ollama 모델이 선택되지 않음");
    }

    const model = this.currentModelId.replace("ollama::", "");
    const response = await fetch("/api/ollama/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: this.ollamaUrl,
        model,
        messages: this.withNoThinkInstruction(messages),
        params: {
          temperature: params.temperature,
          topP: params.topP,
          topK: params.topK,
          repeatPenalty: params.repeatPenalty,
          maxTokens: params.maxTokens,
        },
      }),
    });

    const payload = (await response.json()) as { content?: string; error?: string };

    if (!response.ok || !payload.content) {
      throw new Error(payload.error || "Ollama 요청 실패");
    }

    const visibleText = stripThinkBlocks(payload.content);
    onToken(visibleText, visibleText);
    return visibleText;
  }

  stopGeneration(): void {
    this.abortController?.abort();
  }

  private formatMessages(
    messages: Array<{ role: string; content: string }>
  ): string {
    return (
      messages
        .map((m) => {
          if (m.role === "system")
            return `<|im_start|>system\n${m.content}<|im_end|>`;
          if (m.role === "user")
            return `<|im_start|>user\n${m.content}<|im_end|>`;
          if (m.role === "assistant")
            return `<|im_start|>assistant\n${m.content}<|im_end|>`;
          return "";
        })
        .join("\n") + "\n<|im_start|>assistant\n"
    );
  }

  private withNoThinkInstruction(
    messages: Array<{ role: string; content: string }>
  ): Array<{ role: string; content: string }> {
    const [firstMessage, ...restMessages] = messages;

    if (firstMessage?.role === "system") {
      return [
        {
          ...firstMessage,
          content: `${firstMessage.content}\n\n${NO_THINK_SYSTEM_INSTRUCTION}`,
        },
        ...restMessages,
      ];
    }

    return [
      {
        role: "system",
        content: NO_THINK_SYSTEM_INSTRUCTION,
      },
      ...messages,
    ];
  }

  async unloadModel(): Promise<void> {
    if (this.wllama) {
      await this.wllama.exit();
      this.wllama = null;
    }
    this.currentModelId = null;
    this.currentProvider = null;
  }

  isModelLoaded(): boolean {
    return this.currentModelId !== null;
  }

  getCurrentModelId(): string | null {
    return this.currentModelId;
  }

  getCurrentProvider(): ModelProvider | null {
    return this.currentProvider;
  }

  getIsLoading(): boolean {
    return this.isLoading;
  }
}

export const llmEngine = new LLMEngine();
