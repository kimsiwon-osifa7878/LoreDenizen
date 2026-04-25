"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { t } from "@/lib/i18n";
import {
  createCharacter,
  deleteCharacter,
  getCharacter,
  updateCharacter,
} from "@/lib/db/characters";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUIStore } from "@/lib/store/ui-store";
import type { AppLanguage } from "@/lib/types";

const EMOJI_OPTIONS = [
  "AI",
  "🙂",
  "🤖",
  "🧑‍🏫",
  "💻",
  "📚",
  "✨",
  "🧠",
  "🌙",
  "🔥",
  "🎨",
  "🎭",
];

function getTemplatePrompt(language: AppLanguage): string {
  if (language === "ko") {
    return `당신의 이름은 {{name}}입니다.

## 성격
(여기에 캐릭터의 성격을 작성하세요)

## 말투
(여기에 캐릭터의 말투를 작성하세요)

## 세계관
(여기에 배경 설정을 작성하세요)

## 규칙
(여기에 행동 규칙을 작성하세요)`;
  }

  return `Your name is {{name}}.

## Personality
(Describe the character's personality here)

## Speaking style
(Describe the character's tone and voice here)

## Background
(Describe the setting or backstory here)

## Rules
(Describe behavior rules here)`;
}

export function CharacterEditor() {
  const open = useUIStore((s) => s.characterEditorOpen);
  const editingId = useUIStore((s) => s.editingCharacterId);
  const setOpen = useUIStore((s) => s.setCharacterEditorOpen);
  const loadCharacters = useChatStore((s) => s.loadCharacters);
  const language = useSettingsStore((s) => s.language);

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("AI");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(getTemplatePrompt(language));
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;

    if (editingId) {
      getCharacter(editingId).then((character) => {
        if (character) {
          setName(character.name);
          setAvatar(character.avatar);
          setDescription(character.description);
          setSystemPrompt(character.systemPrompt);
          setTags(character.tags.join(", "));
          setImages(character.images ?? []);
        }
      });
      return;
    }

    setName("");
    setAvatar("AI");
    setDescription("");
    setSystemPrompt(getTemplatePrompt(language));
    setTags("");
    setImages([]);
  }, [open, editingId, language]);

  const handleSave = async () => {
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      avatar,
      description: description.trim(),
      systemPrompt,
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

  if (!open) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-background">
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
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-colors ${
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

          <div>
            <label className="mb-1 block text-sm font-medium">
              {t(language, "systemPrompt")}
            </label>
            <textarea
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              rows={10}
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
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
