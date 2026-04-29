import { NextResponse } from "next/server";

interface NvidiaModel {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { apiKey?: string | null; q?: string };
  const apiKey = body.apiKey?.trim() || process.env.NVIDIA_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "NVIDIA API key is missing." }, { status: 401 });
  }

  const response = await fetch("https://integrate.api.nvidia.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error: error || "NVIDIA models request failed." }, { status: response.status });
  }

  const payload = (await response.json()) as { data?: NvidiaModel[] };
  const query = body.q?.trim().toLowerCase();
  const items = (payload.data ?? [])
    .map((item) => item.id)
    .filter(Boolean)
    .filter((id) => (!query ? true : id.toLowerCase().includes(query)))
    .slice(0, 100);

  return NextResponse.json({ items });
}
