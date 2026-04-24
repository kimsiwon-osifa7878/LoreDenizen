"use client";

import { t } from "@/lib/i18n";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUIStore } from "@/lib/store/ui-store";

export function CharacterList() {
  const characters = useChatStore((s) => s.characters);
  const activeCharacter = useChatStore((s) => s.activeCharacter);
  const setActiveCharacter = useChatStore((s) => s.setActiveCharacter);
  const setCharacterEditorOpen = useUIStore((s) => s.setCharacterEditorOpen);
  const language = useSettingsStore((s) => s.language);

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
      <div className="custom-scrollbar max-h-40 overflow-y-auto">
        {characters.map((character) => (
          <div
            key={character.id}
            className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-border/50 ${
              activeCharacter?.id === character.id ? "bg-border/70" : ""
            }`}
            onClick={() => setActiveCharacter(character)}
            onDoubleClick={() => setCharacterEditorOpen(true, character.id)}
          >
            <span>{character.avatar}</span>
            <span className="truncate">{character.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
