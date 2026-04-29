import { NextResponse } from "next/server";
import { normalizeOllamaUrl } from "@/lib/ollama/url";

const OLLAMA_REQUEST_TIMEOUT_MS = 15_000;

interface OllamaTagsPayload {
  url?: string;
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as OllamaTagsPayload;

  let normalizedUrl: string;
  try {
    normalizedUrl = normalizeOllamaUrl(body.url);
  } catch {
    return NextResponse.json(
      { error: "OLLAMA_URL_INVALID" },
      { status: 400 }
    );
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(`${normalizedUrl}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "OLLAMA_TIMEOUT" }, { status: 504 });
    }

    return NextResponse.json(
      { error: "OLLAMA_UNREACHABLE_FROM_SERVER" },
      { status: 502 }
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: "OLLAMA_UNREACHABLE" },
      { status: response.status }
    );
  }

  const payload = (await response.json()) as {
    models?: Array<{ name?: string }>;
  };

  const models = (payload.models ?? [])
    .map((item) => item.name?.trim() ?? "")
    .filter(Boolean);

  return NextResponse.json({
    normalizedUrl,
    models,
  });
}
