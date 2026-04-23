"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
  characterAvatar?: string;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  characterAvatar,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (message.role === "system") return null;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bubble-assistant flex items-center justify-center text-lg">
          {characterAvatar || "🤖"}
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-bubble-user text-white"
            : "bg-bubble-assistant text-foreground"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>pre]:my-2">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
});
