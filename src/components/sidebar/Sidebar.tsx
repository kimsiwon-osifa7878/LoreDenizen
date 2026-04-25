"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUIStore } from "@/lib/store/ui-store";
import { CharacterList } from "./CharacterList";
import { ConversationList } from "./ConversationList";

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const createNewConversation = useChatStore((s) => s.createNewConversation);
  const setActiveCharacter = useChatStore((s) => s.setActiveCharacter);
  const characters = useChatStore((s) => s.characters);
  const language = useSettingsStore((s) => s.language);
  const [selectCharacterOpen, setSelectCharacterOpen] = useState(false);

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
            onClick={() => setSelectCharacterOpen(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm transition-colors hover:bg-border/50"
          >
            <span>+</span>
            <span>{t(language, "newChat")}</span>
          </button>
        </div>

        <ConversationList />
        <CharacterList />
      </aside>

      {selectCharacterOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-4">
            <h3 className="mb-1 text-base font-semibold">
              {t(language, "chooseCharacter")}
            </h3>
            <p className="mb-3 text-xs text-muted">
              {t(language, "chooseCharacterToStart")}
            </p>
            <div className="space-y-2">
              {characters.map((character) => (
                <button
                  key={character.id}
                  onClick={async () => {
                    setActiveCharacter(character);
                    await createNewConversation(character.id);
                    setSelectCharacterOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-bubble-assistant"
                >
                  <span>{character.avatar}</span>
                  <span className="font-medium">{character.name}</span>
                  <span className="ml-auto text-xs text-accent">
                    {t(language, "selectThisCharacter")}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelectCharacterOpen(false)}
              className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-xs hover:bg-border/50"
            >
              {t(language, "cancel")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
