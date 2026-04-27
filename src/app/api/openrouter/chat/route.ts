import { NextResponse } from "next/server";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterPayload {
  model?: string;
  apiKey?: string;
  messages?: OpenRouterMessage[];
  params?: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as OpenRouterPayload;
  const model = body.model?.trim();
  const messages = body.messages;

  if (!model) {
    return NextResponse.json({ error: "model is required." }, { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "messages are required." },
      { status: 400 }
    );
  }

  const apiKey = body.apiKey?.trim() || process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API key is missing." },
      { status: 401 }
    );
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: errorText || "OpenRouter request failed." },
      { status: response.status }
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return NextResponse.json(
      { error: "OpenRouter returned an empty response." },
      { status: 502 }
    );
  }

  return NextResponse.json({ content });
}
