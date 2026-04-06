"use client";

import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { useModelStore } from "@/lib/store/model-store";
import { useUIStore } from "@/lib/store/ui-store";

export function ChatContainer() {
  const activeModelId = useModelStore((s) => s.activeModelId);
  const setModelDialogOpen = useUIStore((s) => s.setModelDialogOpen);

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* 헤더 */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4">
        <SidebarToggle />
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              activeModelId ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          <span className="text-xs text-muted truncate max-w-[200px]">
            {activeModelId
              ? activeModelId.split("::")[1] || activeModelId
              : "모델 미선택"}
          </span>
          <button
            onClick={() => setModelDialogOpen(true)}
            className="text-xs text-accent hover:underline ml-2"
          >
            모델 관리
          </button>
        </div>
      </header>

      {/* 채팅 영역 */}
      <MessageList />
      <ChatInput />
    </div>
  );
}

function SidebarToggle() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <button
      onClick={toggleSidebar}
      className="p-2 hover:bg-bubble-assistant rounded-lg transition-colors"
      aria-label="사이드바 토글"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}
