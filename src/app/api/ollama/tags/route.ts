import { NextResponse } from "next/server";
import { normalizeOllamaUrl } from "@/lib/ollama/url";

interface OllamaTagsPayload {
  url?: string;
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
    response = await fetch(`${normalizedUrl}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "OLLAMA_UNREACHABLE" },
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
