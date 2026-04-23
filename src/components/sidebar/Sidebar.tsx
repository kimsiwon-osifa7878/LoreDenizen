"use client";

import { useUIStore } from "@/lib/store/ui-store";
import { useChatStore } from "@/lib/store/chat-store";
import { ConversationList } from "./ConversationList";
import { CharacterList } from "./CharacterList";

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const createNewConversation = useChatStore((s) => s.createNewConversation);

  if (!sidebarOpen) return null;

  return (
    <>
      {/* 모바일 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={() => useUIStore.getState().setSidebarOpen(false)}
      />

      <aside className="fixed md:relative z-50 md:z-auto w-[280px] h-full bg-sidebar-bg border-r border-border flex flex-col">
        {/* 새 대화 버튼 */}
        <div className="p-3">
          <button
            onClick={() => createNewConversation()}
            className="w-full py-2.5 px-4 rounded-lg border border-border text-sm hover:bg-border/50 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            <span>새 대화</span>
          </button>
        </div>

        {/* 대화 목록 */}
        <ConversationList />

        {/* 캐릭터 목록 */}
        <CharacterList />
      </aside>
    </>
  );
}
