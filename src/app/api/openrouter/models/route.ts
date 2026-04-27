import { NextResponse } from "next/server";
import type { OpenRouterSort } from "@/lib/types";

interface OpenRouterModelResponse {
  id?: string;
  name?: string;
  created?: number;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parseSort(value: string | null): OpenRouterSort {
  const allowed: OpenRouterSort[] = [
    "created_desc",
    "context_desc",
    "pricing_prompt_asc",
    "pricing_completion_asc",
    "name_asc",
  ];

  if (value && allowed.includes(value as OpenRouterSort)) {
    return value as OpenRouterSort;
  }

  return "created_desc";
}

function toNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isChatCapableTextModel(model: OpenRouterModelResponse): boolean {
  const modality = model.architecture?.modality?.toLowerCase() ?? "";
  const inputs = (model.architecture?.input_modalities ?? []).map((v) => v.toLowerCase());
  const outputs = (model.architecture?.output_modalities ?? []).map((v) => v.toLowerCase());

  const hasTextInput =
    inputs.includes("text") || modality.includes("text->");
  const hasTextOutput =
    outputs.includes("text") || modality.includes("->text");

  if (!hasTextInput || !hasTextOutput) {
    return false;
  }

  return true;
}

function sortModels(models: OpenRouterModelResponse[], sort: OpenRouterSort): OpenRouterModelResponse[] {
  return models.sort((a, b) => {
    if (sort === "context_desc") {
      return (b.context_length ?? 0) - (a.context_length ?? 0);
    }

    if (sort === "pricing_prompt_asc") {
      const aPrice = toNumber(a.pricing?.prompt) ?? Number.POSITIVE_INFINITY;
      const bPrice = toNumber(b.pricing?.prompt) ?? Number.POSITIVE_INFINITY;
      return aPrice - bPrice;
    }

    if (sort === "pricing_completion_asc") {
      const aPrice = toNumber(a.pricing?.completion) ?? Number.POSITIVE_INFINITY;
      const bPrice = toNumber(b.pricing?.completion) ?? Number.POSITIVE_INFINITY;
      return aPrice - bPrice;
    }

    if (sort === "name_asc") {
      return (a.name ?? a.id ?? "").localeCompare(b.name ?? b.id ?? "");
    }

    return (b.created ?? 0) - (a.created ?? 0);
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0) || 0);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get("limit") ?? DEFAULT_LIMIT) || DEFAULT_LIMIT));
  const sort = parseSort(searchParams.get("sort"));

  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ error: "OpenRouter 모델 목록을 불러오지 못했습니다." }, { status: response.status });
  }

  const payload = (await response.json()) as { data?: OpenRouterModelResponse[] };
  const source = Array.isArray(payload.data) ? payload.data : [];

  const filtered = source.filter((model) => {
    if (!isChatCapableTextModel(model)) {
      return false;
    }

    if (!q) {
      return true;
    }

    const target = `${model.id ?? ""} ${model.name ?? ""}`.toLowerCase();
    return target.includes(q);
  });

  const sorted = sortModels(filtered, sort);
  const capped = sorted.slice(0, MAX_LIMIT);
  const page = capped.slice(offset, offset + limit);

  return NextResponse.json({
    items: page.map((model) => ({
      id: model.id ?? "",
      name: model.name ?? model.id ?? "",
      contextLength: model.context_length ?? null,
      promptPrice: toNumber(model.pricing?.prompt),
      completionPrice: toNumber(model.pricing?.completion),
      created: model.created ?? null,
    })),
    total: capped.length,
    hasMore: offset + limit < capped.length,
  });
}
