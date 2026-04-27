"use client";

import { t } from "@/lib/i18n";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUIStore } from "@/lib/store/ui-store";

export function CharacterPickerDialog() {
  const open = useUIStore((s) => s.characterPickerOpen);
  const setOpen = useUIStore((s) => s.setCharacterPickerOpen);
  const createNewConversation = useChatStore((s) => s.createNewConversation);
  const characters = useChatStore((s) => s.characters);
  const language = useSettingsStore((s) => s.language);

  if (!open) return null;

  return (
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
                await createNewConversation(character.id);
                setOpen(false);
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
          onClick={() => setOpen(false)}
          className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-xs hover:bg-border/50"
        >
          {t(language, "cancel")}
        </button>
      </div>
    </div>
  );
}
