"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUIStore } from "@/lib/store/ui-store";
import type { Character } from "@/lib/types";

export function CharacterList() {
  const characters = useChatStore((s) => s.characters);
  const activeCharacter = useChatStore((s) => s.activeCharacter);
  const createNewConversation = useChatStore((s) => s.createNewConversation);
  const setCharacterEditorOpen = useUIStore((s) => s.setCharacterEditorOpen);
  const language = useSettingsStore((s) => s.language);
  const [pendingCharacter, setPendingCharacter] = useState<Character | null>(null);

  const handleSelectCharacter = (character: Character) => {
    if (activeCharacter?.id === character.id) return;
    setPendingCharacter(character);
  };

  const handleConfirmNewChat = async () => {
    if (!pendingCharacter) return;
    await createNewConversation(pendingCharacter.id);
    setPendingCharacter(null);
  };

  return (
    <div className="border-t border-border">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-muted">
          {t(language, "characters")}
        </span>
        <button
          onClick={() => setCharacterEditorOpen(true)}
          className="text-xs text-accent hover:underline"
        >
          + {t(language, "newCharacter")}
        </button>
      </div>
      <div className="custom-scrollbar max-h-80 overflow-y-auto">
        {characters.map((character) => (
          <div
            key={character.id}
            className={`cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-border/50 ${
              activeCharacter?.id === character.id ? "bg-border/70" : ""
            }`}
            onClick={() => handleSelectCharacter(character)}
          >
            <div className="flex items-center gap-2">
              <span>{character.avatar}</span>
              <span className="truncate">{character.name}</span>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setCharacterEditorOpen(true, character.id);
                }}
                className="ml-auto text-xs text-accent hover:underline"
              >
                {t(language, "editCharacter")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {pendingCharacter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-background p-4">
            <h3 className="mb-2 text-base font-semibold">
              {language === "ko" ? "다른 캐릭터를 선택했습니다" : "Different character selected"}
            </h3>
            <p className="mb-4 text-sm text-muted">
              {language === "ko"
                ? "새 채팅창을 띄울까요?"
                : "Would you like to open a new chat?"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingCharacter(null)}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-border/50"
              >
                {t(language, "cancel")}
              </button>
              <button
                onClick={handleConfirmNewChat}
                className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm text-white hover:bg-accent-hover"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
