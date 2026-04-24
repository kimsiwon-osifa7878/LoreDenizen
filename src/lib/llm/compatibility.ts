import type { ModelCompatibility } from "@/lib/types";

export const WLLAMA_LLAMA_CPP_BUILD = "b7179-4abef75";

const SUPPORTED_ARCHITECTURES = new Set([
  "llama",
  "mistral",
  "mixtral",
  "gemma",
  "gemma2",
  "gemma3",
  "gemma3n",
  "qwen",
  "qwen2",
  "qwen2moe",
  "qwen2vl",
  "qwen3",
  "qwen3moe",
  "qwen3vl",
  "qwen3vlmoe",
  "phi2",
  "phi3",
  "phimoe",
  "deepseek",
  "deepseek2",
  "deepseek3",
  "deepseek-r1-qwen",
  "falcon",
  "gpt2",
  "gptj",
  "gptneox",
  "stablelm",
  "baichuan",
  "bloom",
  "chatglm",
  "cohere",
  "dbrx",
  "exaone",
  "granite",
  "hunyuan",
  "jamba",
  "mamba",
  "minicpm",
  "nemotron",
  "olmo",
  "olmo2",
  "olmoe",
  "orion",
  "persimmon",
  "plamo",
  "refact",
  "rwkv6",
  "smollm",
  "starcoder",
  "starcoder2",
  "xverse",
]);

const UNSUPPORTED_ARCHITECTURES = new Set([
  "gemma4",
  "qwen35",
  "qwen35moe",
]);

export interface CompatibilityCheck {
  compatibility: ModelCompatibility;
  compatibilityReason: string;
}

export function checkWllamaCompatibility(
  architecture: string | null
): CompatibilityCheck {
  if (!architecture) {
    return {
      compatibility: "unknown",
      compatibilityReason: "Could not read GGUF architecture metadata.",
    };
  }

  const normalized = architecture.trim().toLowerCase();

  if (UNSUPPORTED_ARCHITECTURES.has(normalized)) {
    return {
      compatibility: "unsupported",
      compatibilityReason: `Architecture '${architecture}' is not supported by the current wllama runtime (${WLLAMA_LLAMA_CPP_BUILD}).`,
    };
  }

  if (SUPPORTED_ARCHITECTURES.has(normalized)) {
    return {
      compatibility: "supported",
      compatibilityReason: `Architecture '${architecture}' is supported by the current wllama runtime.`,
    };
  }

  return {
    compatibility: "unknown",
    compatibilityReason: `Architecture '${architecture}' is not in the current wllama compatibility registry.`,
  };
}
