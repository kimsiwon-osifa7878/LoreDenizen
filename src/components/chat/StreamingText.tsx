"use client";

import ReactMarkdown from "react-markdown";

interface StreamingTextProps {
  content: string;
  characterAvatar?: string;
}

export function StreamingText({ content, characterAvatar }: StreamingTextProps) {
  if (!content) return null;

  return (
    <div className="flex gap-3 flex-row">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bubble-assistant flex items-center justify-center text-lg">
        {characterAvatar || "🤖"}
      </div>
      <div className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-bubble-assistant text-foreground">
        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>pre]:my-2">
          <ReactMarkdown>{content}</ReactMarkdown>
          <span className="streaming-cursor" />
        </div>
      </div>
    </div>
  );
}
