import { NextResponse } from "next/server";
import {
  getModelPresetsFromEnv,
  isHfModelSearchEnabled,
} from "@/lib/config/model-presets";

export async function GET() {
  return NextResponse.json({
    repos: getModelPresetsFromEnv(),
    searchEnabled: isHfModelSearchEnabled(),
  });
}
