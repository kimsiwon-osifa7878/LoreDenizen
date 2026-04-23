import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoreDenizen — 내 브라우저에서 돌리는 나만의 AI",
  description:
    "설치 없이 웹 브라우저에서 오픈소스 LLM을 다운로드하여 로컬 추론하는 캐릭터 챗 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
