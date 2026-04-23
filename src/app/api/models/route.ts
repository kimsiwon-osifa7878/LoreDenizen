import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  try {
    const hfUrl = `https://huggingface.co/api/models?search=${encodeURIComponent(
      query + " gguf"
    )}&filter=gguf&limit=${limit}&sort=downloads&direction=-1`;

    const res = await fetch(hfUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 }, // 5분 캐시
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "HuggingFace API 오류" },
        { status: res.status }
      );
    }

    const data = await res.json();

    // GGUF 파일 정보 추출
    const models = data
      .filter(
        (model: Record<string, unknown>) =>
          Array.isArray(model.siblings) &&
          (model.siblings as Array<{ rfilename: string }>).some(
            (s: { rfilename: string }) => s.rfilename.endsWith(".gguf")
          )
      )
      .slice(0, limit)
      .map((model: Record<string, unknown>) => {
        const siblings = model.siblings as Array<{ rfilename: string }>;
        const ggufFiles = siblings.filter((s: { rfilename: string }) =>
          s.rfilename.endsWith(".gguf")
        );

        return {
          name: model.modelId,
          hfRepo: model.modelId,
          files: ggufFiles.map((f: { rfilename: string }) => {
            const qMatch = f.rfilename.match(
              /[.-](Q\d[_A-Z\d]*)\./i
            );
            return {
              fileName: f.rfilename,
              quantization: qMatch ? qMatch[1] : "unknown",
              fileSize: 0, // HF API에서 파일 크기 미제공
            };
          }),
          downloads: model.downloads,
        };
      });

    return NextResponse.json({ models });
  } catch {
    return NextResponse.json(
      { error: "검색 실패" },
      { status: 500 }
    );
  }
}
