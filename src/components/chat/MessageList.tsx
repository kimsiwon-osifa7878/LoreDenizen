"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/lib/store/chat-store";
import { MessageBubble } from "./MessageBubble";
import { StreamingText } from "./StreamingText";

export function MessageList() {
  const messages = useChatStore((s) => s.messages);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const activeCharacter = useChatStore((s) => s.activeCharacter);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
      {messages.length === 0 && !isGenerating && (
        <div className="flex flex-col items-center justify-center h-full text-muted">
          <p className="text-4xl mb-4">{activeCharacter?.avatar || "💬"}</p>
          <p className="text-lg font-medium">
            {activeCharacter?.name || "새 대화를 시작하세요"}
          </p>
          {activeCharacter?.description && (
            <p className="text-sm mt-1">{activeCharacter.description}</p>
          )}
        </div>
      )}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          characterAvatar={activeCharacter?.avatar}
        />
      ))}
      {isGenerating && (
        <StreamingText
          content={streamingContent}
          characterAvatar={activeCharacter?.avatar}
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
