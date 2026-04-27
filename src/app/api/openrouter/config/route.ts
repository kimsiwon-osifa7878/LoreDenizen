import { NextResponse } from "next/server";
import {
  getOpenRouterModelsFromEnv,
  hasOpenRouterApiKeyInEnv,
} from "@/lib/config/openrouter";

export async function GET() {
  return NextResponse.json({
    hasApiKey: hasOpenRouterApiKeyInEnv(),
    models: getOpenRouterModelsFromEnv(),
  });
}
