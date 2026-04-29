import { NextResponse } from "next/server";

interface NvidiaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface NvidiaPayload {
  model?: string;
  apiKey?: string;
  messages?: NvidiaMessage[];
  params?: { temperature?: number; topP?: number; maxTokens?: number };
}

export async function POST(request: Request) {
  const body = (await request.json()) as NvidiaPayload;
  const model = body.model?.trim();
  const messages = body.messages;

  if (!model) return NextResponse.json({ error: "model is required." }, { status: 400 });
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages are required." }, { status: 400 });
  }

  const apiKey = body.apiKey?.trim() || process.env.NVIDIA_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "NVIDIA API key is missing." }, { status: 401 });

  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: body.params?.temperature,
      top_p: body.params?.topP,
      max_tokens: body.params?.maxTokens,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    return NextResponse.json({ error: errorText || "NVIDIA request failed." }, { status: response.status || 502 });
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
