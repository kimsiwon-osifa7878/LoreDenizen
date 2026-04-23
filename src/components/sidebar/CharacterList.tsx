"use client";

import { useChatStore } from "@/lib/store/chat-store";
import { useUIStore } from "@/lib/store/ui-store";

export function CharacterList() {
  const characters = useChatStore((s) => s.characters);
  const activeCharacter = useChatStore((s) => s.activeCharacter);
  const setActiveCharacter = useChatStore((s) => s.setActiveCharacter);
  const setCharacterEditorOpen = useUIStore((s) => s.setCharacterEditorOpen);

  return (
    <div className="border-t border-border">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-muted">캐릭터</span>
        <button
          onClick={() => setCharacterEditorOpen(true)}
          className="text-xs text-accent hover:underline"
        >
          + 새 캐릭터
        </button>
      </div>
      <div className="max-h-40 overflow-y-auto custom-scrollbar">
        {characters.map((char) => (
          <div
            key={char.id}
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm hover:bg-border/50 transition-colors ${
              activeCharacter?.id === char.id ? "bg-border/70" : ""
            }`}
            onClick={() => setActiveCharacter(char)}
            onDoubleClick={() => setCharacterEditorOpen(true, char.id)}
          >
            <span>{char.avatar}</span>
            <span className="truncate">{char.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
