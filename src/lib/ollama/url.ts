export const DEFAULT_OLLAMA_URL = "http://localhost:11434";

export function normalizeOllamaUrl(url: string | null | undefined): string {
  const input = url?.trim();
  if (!input) {
    return DEFAULT_OLLAMA_URL;
  }

  const parsed = new URL(input);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("OLLAMA_URL_INVALID_PROTOCOL");
  }

  const normalizedPath = parsed.pathname.replace(/\/+$/, "");
  const path = normalizedPath === "" ? "" : normalizedPath;
  return `${parsed.origin}${path}`;
}
