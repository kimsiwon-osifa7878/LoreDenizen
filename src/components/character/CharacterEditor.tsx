"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { t } from "@/lib/i18n";
import {
  EMPTY_PROMPT_SECTIONS,
  buildCharacterSystemPrompt,
  createCharacter,
  deleteCharacter,
  getCharacter,
  getCharacterPromptSections,
  updateCharacter,
} from "@/lib/db/characters";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUIStore } from "@/lib/store/ui-store";
import type { CharacterPromptSections } from "@/lib/types";

const EMOJI_OPTIONS = ["AI", "E", "T", "V", "R", "M", "S", "K", "L", "N"];

const PROMPT_SECTION_FIELDS: Array<{
  key: keyof CharacterPromptSections;
  label: string;
  rows: number;
}> = [
  { key: "description", label: "Description", rows: 8 },
  { key: "personality", label: "Personality", rows: 10 },
  { key: "scenario", label: "Scenario", rows: 5 },
  { key: "firstMessage", label: "First Message", rows: 8 },
  { key: "exampleMessages", label: "Example Messages", rows: 8 },
  { key: "authorNote", label: "System Prompt / Author's Note", rows: 5 },
];

const DEFAULT_OPEN_SECTIONS: Record<keyof CharacterPromptSections, boolean> = {
  description: true,
  personality: false,
  scenario: false,
  firstMessage: false,
  exampleMessages: false,
  authorNote: false,
};

export function CharacterEditor() {
  const open = useUIStore((s) => s.characterEditorOpen);
  const editingId = useUIStore((s) => s.editingCharacterId);
  const setOpen = useUIStore((s) => s.setCharacterEditorOpen);
  const loadCharacters = useChatStore((s) => s.loadCharacters);
  const language = useSettingsStore((s) => s.language);

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("AI");
  const [description, setDescription] = useState("");
  const [promptSections, setPromptSections] =
    useState<CharacterPromptSections>(EMPTY_PROMPT_SECTIONS);
  const [openSections, setOpenSections] = useState(DEFAULT_OPEN_SECTIONS);
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setOpenSections(DEFAULT_OPEN_SECTIONS);

    if (editingId) {
      getCharacter(editingId).then((character) => {
        if (character) {
          setName(character.name);
          setAvatar(character.avatar);
          setDescription(character.description);
          setPromptSections(getCharacterPromptSections(character));
          setTags(character.tags.join(", "));
          setImages(character.images ?? []);
        }
      });
      return;
    }

    setName("");
    setAvatar("AI");
    setDescription("");
    setPromptSections(EMPTY_PROMPT_SECTIONS);
    setTags("");
    setImages([]);
  }, [open, editingId]);

  const handleSave = async () => {
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      avatar,
      description: description.trim(),
      promptSections,
      systemPrompt: buildCharacterSystemPrompt(promptSections),
      images,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (editingId) {
      await updateCharacter(editingId, data);
    } else {
      await createCharacter(data);
    }

    await loadCharacters();
    setOpen(false);
  };

  const handleDelete = async () => {
    if (!editingId) return;

    await deleteCharacter(editingId);
    await loadCharacters();
    setOpen(false);
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    const results = await Promise.all(
      Array.from(files).map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ""));
            reader.onerror = () => reject(new Error("image-read-failed"));
            reader.readAsDataURL(file);
          })
      )
    );
    setImages((prev) => [...prev, ...results.filter(Boolean)]);
    event.target.value = "";
  };

  const updatePromptSection = (
    key: keyof CharacterPromptSections,
    value: string
  ) => {
    setPromptSections((prev) => ({ ...prev, [key]: value }));
  };

  const togglePromptSection = (key: keyof CharacterPromptSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">
            {editingId
              ? t(language, "editCharacter")
              : t(language, "newCharacter")}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="text-muted hover:text-foreground"
            aria-label={t(language, "close")}
          >
            x
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t(language, "avatar")}
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-colors ${
                    avatar === emoji
                      ? "bg-accent/20 ring-2 ring-accent"
                      : "bg-bubble-assistant hover:bg-border"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              {t(language, "uploadImages")}
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            {images.length > 0 && (
              <div className="mt-2">
                <div className="mb-1 text-xs text-muted">
                  {t(language, "uploadedImages")}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((image, index) => (
                    <div key={`${image.slice(0, 20)}-${index}`} className="space-y-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt={`character upload ${index + 1}`}
                        className="h-16 w-full rounded-md object-cover"
                      />
                      <button
                        onClick={() =>
                          setImages((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="w-full text-xs text-red-500 hover:underline"
                      >
                        {t(language, "removeImage")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              {t(language, "name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t(language, "characterName")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              {t(language, "description")}
            </label>
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t(language, "shortDescription")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              {t(language, "tags")}
            </label>
            <input
              type="text"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder={t(language, "tagsPlaceholder")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">
              {t(language, "systemPrompt")}
            </div>
            {PROMPT_SECTION_FIELDS.map((field) => (
              <div
                key={field.key}
                className="overflow-hidden rounded-lg border border-border"
              >
                <button
                  type="button"
                  onClick={() => togglePromptSection(field.key)}
                  className="flex w-full items-center justify-between bg-bubble-assistant px-3 py-2 text-left text-sm font-medium hover:bg-border/70"
                >
                  <span>[{field.label}]</span>
                  <span className="text-xs text-muted">
                    {openSections[field.key]
                      ? t(language, "collapse")
                      : t(language, "expand")}
                  </span>
                </button>
                {openSections[field.key] && (
                  <textarea
                    value={promptSections[field.key]}
                    onChange={(event) =>
                      updatePromptSection(field.key, event.target.value)
                    }
                    rows={field.rows}
                    className="w-full resize-y border-t border-border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border p-4">
          <div>
            {editingId && (
              <button
                onClick={handleDelete}
                className="text-sm text-red-500 hover:underline"
              >
                {t(language, "delete")}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-border/50"
            >
              {t(language, "cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="rounded-lg bg-accent px-4 py-2 text-sm text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {t(language, "save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
