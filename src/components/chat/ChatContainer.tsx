"use client";

import { t } from "@/lib/i18n";
import { useModelStore } from "@/lib/store/model-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUIStore } from "@/lib/store/ui-store";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";

export function ChatContainer() {
  const activeModelId = useModelStore((s) => s.activeModelId);
  const language = useSettingsStore((s) => s.language);
  const setModelDialogOpen = useUIStore((s) => s.setModelDialogOpen);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <SidebarToggle />
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              activeModelId ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          <span className="max-w-[200px] truncate text-xs text-muted">
            {activeModelId
              ? activeModelId.split("::")[1] || activeModelId
              : t(language, "noModelSelected")}
          </span>
          <button
            onClick={() => setModelDialogOpen(true)}
            className="ml-2 text-xs text-accent hover:underline"
          >
            {t(language, "settings")}
          </button>
        </div>
      </header>

      <MessageList />
      <ChatInput />
    </div>
  );
}

function SidebarToggle() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const language = useSettingsStore((s) => s.language);

  return (
    <button
      onClick={toggleSidebar}
      className="rounded-lg p-2 transition-colors hover:bg-bubble-assistant"
      aria-label={t(language, "sidebarToggle")}
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
