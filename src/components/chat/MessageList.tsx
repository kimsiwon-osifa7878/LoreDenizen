"use client";

import { useEffect, useRef } from "react";
import { t } from "@/lib/i18n";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUIStore } from "@/lib/store/ui-store";
import { MessageBubble } from "./MessageBubble";
import { StreamingText } from "./StreamingText";
import { ThinkingIndicator } from "./ThinkingIndicator";

export function MessageList() {
  const messages = useChatStore((s) => s.messages);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const activeCharacter = useChatStore((s) => s.activeCharacter);
  const language = useSettingsStore((s) => s.language);
  const setModelDialogOpen = useUIStore((s) => s.setModelDialogOpen);
  const setCharacterPickerOpen = useUIStore((s) => s.setCharacterPickerOpen);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
      {messages.length === 0 && !isGenerating && (
        <div className="flex h-full flex-col items-center justify-center text-muted">
          {!activeCharacter ? (
            <div className="flex max-w-md flex-col items-center text-center">
              <p className="mb-3 text-lg font-medium text-foreground">
                {t(language, "setupRequiredTitle")}
              </p>
              <p className="text-sm leading-6">
                {t(language, "setupRequiredDescription")}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setModelDialogOpen(true)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-border/50"
                >
                  {t(language, "openModelSettings")}
                </button>
                <button
                  onClick={() => setCharacterPickerOpen(true)}
                  className="rounded-lg bg-accent px-4 py-2 text-sm text-white transition-colors hover:bg-accent-hover"
                >
                  {t(language, "chooseCharacter")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-4 text-4xl">{activeCharacter.avatar || "AI"}</p>
              <p className="text-lg font-medium">{activeCharacter.name}</p>
              {activeCharacter.description && (
                <p className="mt-1 text-sm">{activeCharacter.description}</p>
              )}
            </>
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
