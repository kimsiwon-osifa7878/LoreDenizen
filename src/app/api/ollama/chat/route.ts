import { NextResponse } from "next/server";
import { normalizeOllamaUrl } from "@/lib/ollama/url";

const OLLAMA_REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_OLLAMA_NUM_CTX = 4096;
const MIN_OLLAMA_NUM_CTX = 2048;
const MAX_OLLAMA_NUM_CTX = 8192;

interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaChatPayload {
  url?: string;
  model?: string;
  messages?: OllamaMessage[];
  params?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    repeatPenalty?: number;
    maxTokens?: number;
  };
}

interface OllamaShowResponse {
  model_info?: Record<string, unknown>;
  parameters?: string;
  modelfile?: string;
}

function clampNumCtx(value: number): number {
  return Math.min(
    MAX_OLLAMA_NUM_CTX,
    Math.max(MIN_OLLAMA_NUM_CTX, Math.floor(value))
  );
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function parseNumCtxFromText(text: string | undefined): number | null {
  if (!text) {
    return null;
  }

  const match = text.match(/num_ctx\s+(\d+)/i);
  if (!match) {
    return null;
  }

  return readNumber(match[1]);
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

async function resolveNumCtx(url: string, model: string): Promise<number> {
  try {
    const response = await fetchWithTimeout(`${url}/api/show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model }),
      cache: "no-store",
    });

    if (!response.ok) {
      return DEFAULT_OLLAMA_NUM_CTX;
    }

    const payload = (await response.json()) as OllamaShowResponse;
    const info = payload.model_info ?? {};

    const fromModelInfo = Object.entries(info)
      .filter(([key]) => key.toLowerCase().includes("context_length"))
      .map(([, value]) => readNumber(value))
      .find((value): value is number => value !== null);

    const fromParameters = parseNumCtxFromText(payload.parameters);
    const fromModelfile = parseNumCtxFromText(payload.modelfile);

    const resolved =
      fromModelInfo ?? fromParameters ?? fromModelfile ?? DEFAULT_OLLAMA_NUM_CTX;
    return clampNumCtx(resolved);
  } catch {
    return DEFAULT_OLLAMA_NUM_CTX;
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as OllamaChatPayload;
  const model = body.model?.trim();

  if (!model) {
    return NextResponse.json({ error: "model is required." }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "messages are required." },
      { status: 400 }
    );
  }

  let normalizedUrl: string;
  try {
    normalizedUrl = normalizeOllamaUrl(body.url);
  } catch {
    return NextResponse.json(
      { error: "OLLAMA_URL_INVALID" },
      { status: 400 }
    );
  }

  const numCtx = await resolveNumCtx(normalizedUrl, model);

  let response: Response;
  try {
    response = await fetchWithTimeout(`${normalizedUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: body.messages,
        stream: false,
        options: {
          temperature: body.params?.temperature,
          top_p: body.params?.topP,
          top_k: body.params?.topK,
          repeat_penalty: body.params?.repeatPenalty,
          num_predict: body.params?.maxTokens,
          num_ctx: numCtx,
        },
      }),
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

  const payload = (await response.json().catch(() => ({}))) as {
    message?: { content?: string };
    error?: string;
  };

  if (!response.ok || !payload.message?.content) {
    return NextResponse.json(
      { error: payload.error || "Ollama 요청 실패" },
      { status: response.ok ? 502 : response.status }
    );
  }

  return NextResponse.json({
    content: payload.message.content,
  });
}
