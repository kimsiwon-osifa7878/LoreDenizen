import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ hasApiKey: Boolean(process.env.NVIDIA_API_KEY?.trim()) });
}
