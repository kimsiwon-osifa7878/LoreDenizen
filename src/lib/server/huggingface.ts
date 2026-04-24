import "server-only";

import { gguf } from "@huggingface/gguf";
import { checkWllamaCompatibility } from "@/lib/llm/compatibility";
import type { HfRepoFile } from "@/lib/types";

interface HuggingFaceRepoTreeItem {
  type?: string;
  path?: string;
  size?: number;
  lfs?: {
    size?: number;
  };
}

interface HuggingFaceRepoSummarySibling {
  rfilename?: string;
  size?: number;
  lfs?: {
    size?: number;
  };
}

interface HuggingFaceRepoSummaryResponse {
  siblings?: HuggingFaceRepoSummarySibling[];
}

function extractQuantization(fileName: string): string {
  const match = fileName.match(/(?:^|[.-])(Q\d(?:_[A-Z0-9]+)+)(?:[.-]|$)/i);
  return match?.[1]?.toUpperCase() ?? "unknown";
}

function buildHfResolveUrl(hfRepo: string, fileName: string): string {
  const encodedRepo = hfRepo
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const encodedFileName = fileName
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `https://huggingface.co/${encodedRepo}/resolve/main/${encodedFileName}`;
}

function createRepoFile(
  hfRepo: string,
  fileName: string,
  fileSize: number
): HfRepoFile {
  const compatibility = checkWllamaCompatibility(null);

  return {
    hfRepo,
    fileName,
    fileSize,
    quantization: extractQuantization(fileName),
    architecture: null,
    compatibility: compatibility.compatibility,
    compatibilityReason: compatibility.compatibilityReason,
  };
}

async function withCompatibility(file: HfRepoFile): Promise<HfRepoFile> {
  try {
    const { metadata } = await gguf(buildHfResolveUrl(file.hfRepo, file.fileName));
    const rawArchitecture = (metadata as Record<string, unknown>)[
      "general.architecture"
    ];
    const architecture =
      typeof rawArchitecture === "string" ? rawArchitecture : null;
    const compatibility = checkWllamaCompatibility(architecture);

    return {
      ...file,
      architecture,
      compatibility: compatibility.compatibility,
      compatibilityReason: compatibility.compatibilityReason,
    };
  } catch {
    const compatibility = checkWllamaCompatibility(null);

    return {
      ...file,
      architecture: null,
      compatibility: compatibility.compatibility,
      compatibilityReason: compatibility.compatibilityReason,
    };
  }
}

function toRepoFilesFromTree(
  hfRepo: string,
  items: HuggingFaceRepoTreeItem[]
): HfRepoFile[] {
  return items
    .filter((item) => item.type === "file")
    .filter((item) => typeof item.path === "string")
    .filter((item) => item.path!.toLowerCase().endsWith(".gguf"))
    .map((item) => {
      const fileName = item.path as string;

      return createRepoFile(hfRepo, fileName, item.size ?? item.lfs?.size ?? 0);
    })
    .sort((a, b) => a.fileName.localeCompare(b.fileName));
}

function toRepoFilesFromSummary(
  hfRepo: string,
  siblings: HuggingFaceRepoSummarySibling[]
): HfRepoFile[] {
  return siblings
    .filter((sibling) => typeof sibling.rfilename === "string")
    .filter((sibling) => sibling.rfilename!.toLowerCase().endsWith(".gguf"))
    .map((sibling) => {
      const fileName = sibling.rfilename as string;

      return createRepoFile(
        hfRepo,
        fileName,
        sibling.size ?? sibling.lfs?.size ?? 0
      );
    })
    .sort((a, b) => a.fileName.localeCompare(b.fileName));
}

async function addCompatibility(files: HfRepoFile[]): Promise<HfRepoFile[]> {
  return Promise.all(files.map(withCompatibility));
}

export async function fetchGgufFilesForRepo(
  hfRepo: string
): Promise<HfRepoFile[]> {
  const encodedRepo = hfRepo
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  // Prefer the repo tree endpoint because it includes per-file size reliably.
  const treeResponse = await fetch(
    `https://huggingface.co/api/models/${encodedRepo}/tree/main?recursive=1`,
    {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 300,
      },
    }
  );

  if (treeResponse.ok) {
    const treeItems = (await treeResponse.json()) as unknown;
    if (Array.isArray(treeItems)) {
      return addCompatibility(
        toRepoFilesFromTree(hfRepo, treeItems as HuggingFaceRepoTreeItem[])
      );
    }
  }

  // Fallback to model summary when tree endpoint is unavailable.
  const summaryResponse = await fetch(
    `https://huggingface.co/api/models/${encodedRepo}`,
    {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 300,
      },
    }
  );

  if (!summaryResponse.ok) {
    throw new Error(`Failed to fetch repo metadata: ${summaryResponse.status}`);
  }

  const summaryData = (await summaryResponse.json()) as HuggingFaceRepoSummaryResponse;
  const siblings = Array.isArray(summaryData.siblings) ? summaryData.siblings : [];

  return addCompatibility(toRepoFilesFromSummary(hfRepo, siblings));
}
