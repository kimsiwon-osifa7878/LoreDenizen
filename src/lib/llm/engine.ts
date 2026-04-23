"use client";

import { Wllama } from "@wllama/wllama";

const CONFIG_PATHS = {
  "single-thread/wllama.wasm": "/wasm/single-thread/wllama.wasm",
  "multi-thread/wllama.wasm": "/wasm/multi-thread/wllama.wasm",
};

class LLMEngine {
  private wllama: Wllama | null = null;
  private currentModelId: string | null = null;
  private isLoading = false;
  private abortController: AbortController | null = null;

  async initialize(): Promise<void> {
    if (this.wllama) return;
    this.wllama = new Wllama(CONFIG_PATHS);
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
      // 기존 모델 언로드
      if (this.wllama) {
        await this.wllama.exit();
        this.wllama = null;
      }
      await this.initialize();
      await this.wllama!.loadModelFromHF(hfRepo, fileName, {
        n_ctx: 2048,
      });
      this.currentModelId = `${hfRepo}::${fileName}`;
    } finally {
      this.isLoading = false;
    }
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
    if (!this.wllama) throw new Error("모델이 로드되지 않음");

    this.abortController = new AbortController();
    const prompt = this.formatMessages(messages);

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
        onToken(currentText, currentText);
      },
    });

    this.abortController = null;
    return result;
  }

  stopGeneration(): void {
    this.abortController?.abort();
  }

  private formatMessages(
    messages: Array<{ role: string; content: string }>
  ): string {
    // ChatML 포맷
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

  async unloadModel(): Promise<void> {
    if (this.wllama) {
      await this.wllama.exit();
      this.wllama = null;
      this.currentModelId = null;
    }
  }

  isModelLoaded(): boolean {
    return this.currentModelId !== null;
  }

  getCurrentModelId(): string | null {
    return this.currentModelId;
  }

  getIsLoading(): boolean {
    return this.isLoading;
  }
}

export const llmEngine = new LLMEngine();
