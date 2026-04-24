"use client";

import { t } from "@/lib/i18n";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";

export function ConversationList() {
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const deleteConv = useChatStore((s) => s.deleteConv);
  const language = useSettingsStore((s) => s.language);

  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto">
      {conversations.length === 0 && (
        <p className="px-3 py-2 text-xs text-muted">
          {t(language, "noConversations")}
        </p>
      )}
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={`group flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-border/50 ${
            activeConversationId === conversation.id ? "bg-border/70" : ""
          }`}
          onClick={() => setActiveConversation(conversation.id)}
        >
          <span className="flex-1 truncate">{conversation.title}</span>
          <button
            onClick={(event) => {
              event.stopPropagation();
              deleteConv(conversation.id);
            }}
            className="text-xs text-muted opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
            aria-label={t(language, "deleteConversation")}
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
