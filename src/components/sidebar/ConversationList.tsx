"use client";

import { useChatStore } from "@/lib/store/chat-store";

export function ConversationList() {
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const deleteConv = useChatStore((s) => s.deleteConv);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {conversations.length === 0 && (
        <p className="text-xs text-muted px-3 py-2">대화가 없습니다</p>
      )}
      {conversations.map((conv) => (
        <div
          key={conv.id}
          className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer text-sm hover:bg-border/50 transition-colors ${
            activeConversationId === conv.id ? "bg-border/70" : ""
          }`}
          onClick={() => setActiveConversation(conv.id)}
        >
          <span className="flex-1 truncate">{conv.title}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteConv(conv.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-opacity text-xs"
            aria-label="대화 삭제"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
