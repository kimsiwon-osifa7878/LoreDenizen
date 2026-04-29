import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { model?: string; apiKey?: string | null };
  const model = body.model?.trim();
  const apiKey = body.apiKey?.trim() || process.env.NVIDIA_API_KEY?.trim();

  if (!model) return NextResponse.json({ valid: false, error: "model is required." }, { status: 400 });
  if (!apiKey) return NextResponse.json({ valid: false, error: "NVIDIA API key is missing." }, { status: 401 });

  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 1,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ valid: false, error: error || "NVIDIA API key is invalid." }, { status: response.status });
  }

  return NextResponse.json({ valid: true });
}
