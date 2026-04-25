"use client";

import { useEffect, useState } from "react";
import { updateCharacter } from "@/lib/db/characters";
import { t } from "@/lib/i18n";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUIStore } from "@/lib/store/ui-store";

export function CharacterList() {
  const characters = useChatStore((s) => s.characters);
  const activeCharacter = useChatStore((s) => s.activeCharacter);
  const setActiveCharacter = useChatStore((s) => s.setActiveCharacter);
  const loadCharacters = useChatStore((s) => s.loadCharacters);
  const setCharacterEditorOpen = useUIStore((s) => s.setCharacterEditorOpen);
  const language = useSettingsStore((s) => s.language);
  const [persona, setPersona] = useState("");

  useEffect(() => {
    setPersona(activeCharacter?.systemPrompt ?? "");
  }, [activeCharacter]);

  const handleSavePersona = async () => {
    if (!activeCharacter) return;
    await updateCharacter(activeCharacter.id, { systemPrompt: persona });
    await loadCharacters();
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
            onClick={() => setActiveCharacter(character)}
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
                {t(language, "openPersonaEditor")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeCharacter && (
        <div className="space-y-2 border-t border-border px-3 py-3">
          <div className="text-xs font-medium text-muted">{activeCharacter.name}</div>
          <textarea
            value={persona}
            onChange={(event) => setPersona(event.target.value)}
            rows={6}
            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={handleSavePersona}
            className="w-full rounded-md bg-accent px-3 py-2 text-xs text-white hover:bg-accent-hover"
          >
            {t(language, "savePersona")}
          </button>
        </div>
      )}
    </div>
  );
}
