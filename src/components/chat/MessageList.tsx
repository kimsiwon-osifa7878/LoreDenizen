"use client";

import { useEffect, useRef } from "react";
import { t } from "@/lib/i18n";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { MessageBubble } from "./MessageBubble";
import { StreamingText } from "./StreamingText";
import { ThinkingIndicator } from "./ThinkingIndicator";

export function MessageList() {
  const messages = useChatStore((s) => s.messages);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const activeCharacter = useChatStore((s) => s.activeCharacter);
  const language = useSettingsStore((s) => s.language);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
      {messages.length === 0 && !isGenerating && (
        <div className="flex h-full flex-col items-center justify-center text-muted">
          <p className="mb-4 text-4xl">{activeCharacter?.avatar || "AI"}</p>
          <p className="text-lg font-medium">
            {activeCharacter?.name || t(language, "startConversation")}
          </p>
          {activeCharacter?.description && (
            <p className="mt-1 text-sm">{activeCharacter.description}</p>
          )}
        </div>
      )}
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          characterAvatar={activeCharacter?.avatar}
        />
      ))}
      {isGenerating && !streamingContent && (
        <ThinkingIndicator characterAvatar={activeCharacter?.avatar} />
      )}
      {isGenerating && streamingContent && (
        <StreamingText
          content={streamingContent}
          characterAvatar={activeCharacter?.avatar}
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
