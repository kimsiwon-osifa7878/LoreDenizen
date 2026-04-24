"use client";

import ReactMarkdown from "react-markdown";

interface StreamingTextProps {
  content: string;
  characterAvatar?: string;
}

export function StreamingText({ content, characterAvatar }: StreamingTextProps) {
  if (!content) return null;

  return (
    <div className="flex flex-row gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-bubble-assistant text-lg">
        {characterAvatar || "AI"}
      </div>
      <div className="max-w-[75%] rounded-2xl bg-bubble-assistant px-4 py-2.5 text-sm leading-relaxed text-foreground">
        <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:my-1 [&>pre]:my-2">
          <ReactMarkdown>{content}</ReactMarkdown>
          <span className="streaming-cursor" />
        </div>
      </div>
    </div>
  );
}
