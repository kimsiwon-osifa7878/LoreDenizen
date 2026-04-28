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

  let keyResponse: Response;
  try {
    keyResponse = await fetch("https://openrouter.ai/api/v1/key", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { valid: false, error: "OpenRouter API key validation failed." },
      { status: 502 }
    );
  }

  if (!keyResponse.ok) {
    const errorText = await keyResponse.text();
    return NextResponse.json(
      {
        valid: false,
        error: errorText || "OpenRouter API key validation failed.",
      },
      { status: keyResponse.status }
    );
  }

  let modelsResponse: Response;
  try {
    modelsResponse = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { valid: false, error: "OpenRouter 모델 목록을 불러오지 못했습니다." },
      { status: 502 }
    );
  }

  if (!modelsResponse.ok) {
    const errorText = await modelsResponse.text();
    return NextResponse.json(
      {
        valid: false,
        error: errorText || "OpenRouter API key validation failed.",
      },
      { status: modelsResponse.status }
    );
  }

  const payload = (await modelsResponse.json()) as {
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
