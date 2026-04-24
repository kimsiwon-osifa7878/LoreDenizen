"use client";

import { t } from "@/lib/i18n";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUIStore } from "@/lib/store/ui-store";
import { CharacterList } from "./CharacterList";
import { ConversationList } from "./ConversationList";

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const createNewConversation = useChatStore((s) => s.createNewConversation);
  const language = useSettingsStore((s) => s.language);

  if (!sidebarOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={() => useUIStore.getState().setSidebarOpen(false)}
      />

      <aside className="fixed z-50 flex h-full w-[280px] flex-col border-r border-border bg-sidebar-bg md:relative md:z-auto">
        <div className="p-3">
          <button
            onClick={() => createNewConversation()}
            className="flex w-full items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm transition-colors hover:bg-border/50"
          >
            <span>+</span>
            <span>{t(language, "newChat")}</span>
          </button>
        </div>

        <ConversationList />
        <CharacterList />
      </aside>
    </>
  );
}
