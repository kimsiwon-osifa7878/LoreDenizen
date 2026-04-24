import { NextRequest, NextResponse } from "next/server";
import { isValidHfRepo } from "@/lib/config/model-presets";
import { fetchGgufFilesForRepo } from "@/lib/server/huggingface";

export async function GET(request: NextRequest) {
  const repo = request.nextUrl.searchParams.get("repo")?.trim() ?? "";

  if (!repo) {
    return NextResponse.json(
      { error: "repo query parameter is required." },
      { status: 400 }
    );
  }

  if (!isValidHfRepo(repo)) {
    return NextResponse.json(
      { error: "repo must be in owner/name format." },
      { status: 400 }
    );
  }

  try {
    const files = await fetchGgufFilesForRepo(repo);

    return NextResponse.json({
      hfRepo: repo,
      files,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("404")
        ? "Repository not found."
        : "Failed to load GGUF files for this repository.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
