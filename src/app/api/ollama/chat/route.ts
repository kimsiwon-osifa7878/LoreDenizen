import { NextResponse } from "next/server";
import { normalizeOllamaUrl } from "@/lib/ollama/url";

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

  let response: Response;
  try {
    response = await fetch(`${normalizedUrl}/api/chat`, {
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
        },
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "OLLAMA_UNREACHABLE" },
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
