import { NextResponse } from "next/server";

interface OpenRouterValidatePayload {
  model?: string;
  apiKey?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as OpenRouterValidatePayload;
  const model = body.model?.trim();
  const apiKey = body.apiKey?.trim() || process.env.OPENROUTER_API_KEY?.trim();

  if (!model) {
    return NextResponse.json({ valid: false, error: "model is required." }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json(
      { valid: false, error: "OpenRouter API key is missing." },
      { status: 401 }
    );
  }

  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      {
        valid: false,
        error: errorText || "OpenRouter API key validation failed.",
      },
      { status: response.status }
    );
  }

  const payload = (await response.json()) as {
    data?: Array<{ id?: string }>;
  };

  const modelExists = (payload.data ?? []).some((item) => item.id === model);
  if (!modelExists) {
    return NextResponse.json(
      { valid: false, error: "Selected model is not available for this API key." },
      { status: 400 }
    );
  }

  return NextResponse.json({ valid: true });
}
