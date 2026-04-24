import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoreDenizen - Local AI in your browser",
  description:
    "A character chat app that downloads open-source LLMs and runs them locally in your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
