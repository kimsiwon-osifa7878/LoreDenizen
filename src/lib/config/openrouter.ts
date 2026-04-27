function tryParseJsonArray(value: string): string[] | null {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  } catch {
    return null;
  }
}

export function getOpenRouterModelsFromEnv(): string[] {
  const raw = process.env.OPENROUTER_MODELS?.trim();
  if (!raw) {
    return [];
  }

  const jsonModels = tryParseJsonArray(raw);
  if (jsonModels) {
    return jsonModels;
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function hasOpenRouterApiKeyInEnv(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}
