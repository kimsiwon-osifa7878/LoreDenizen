"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "@/lib/store/ui-store";
import { useChatStore } from "@/lib/store/chat-store";
import {
  createCharacter,
  getCharacter,
  updateCharacter,
  deleteCharacter,
} from "@/lib/db/characters";

const TEMPLATE_PROMPT = `당신의 이름은 {{name}}입니다.

## 성격
(여기에 캐릭터의 성격을 작성하세요)

## 말투
(여기에 캐릭터의 말투를 작성하세요)

## 세계관
(여기에 배경 설정을 작성하세요)

## 규칙
(여기에 행동 규칙을 작성하세요)`;

const EMOJI_OPTIONS = [
  "🤖",
  "👩",
  "👨",
  "🧙",
  "🦸",
  "👻",
  "🐱",
  "🐶",
  "🦊",
  "🐻",
  "📚",
  "💻",
  "🎭",
  "🎨",
  "🎮",
  "🌟",
];

export function CharacterEditor() {
  const open = useUIStore((s) => s.characterEditorOpen);
  const editingId = useUIStore((s) => s.editingCharacterId);
  const setOpen = useUIStore((s) => s.setCharacterEditorOpen);
  const loadCharacters = useChatStore((s) => s.loadCharacters);

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🤖");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(TEMPLATE_PROMPT);
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editingId) {
      getCharacter(editingId).then((char) => {
        if (char) {
          setName(char.name);
          setAvatar(char.avatar);
          setDescription(char.description);
          setSystemPrompt(char.systemPrompt);
          setTags(char.tags.join(", "));
        }
      });
    } else {
      setName("");
      setAvatar("🤖");
      setDescription("");
      setSystemPrompt(TEMPLATE_PROMPT);
      setTags("");
    }
  }, [open, editingId]);

  const handleSave = async () => {
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      avatar,
      description: description.trim(),
      systemPrompt,
      tags: tags
        .split(",")
        .map((t) => t.trim())
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {editingId ? "캐릭터 편집" : "새 캐릭터"}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="text-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 아바타 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">아바타</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors ${
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

          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium mb-1">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="캐릭터 이름"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium mb-1">설명</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="간단한 설명"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              태그 (쉼표 구분)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="태그1, 태그2"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* 시스템 프롬프트 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              시스템 프롬프트
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent resize-y font-mono"
            />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div>
            {editingId && (
              <button
                onClick={handleDelete}
                className="text-sm text-red-500 hover:underline"
              >
                삭제
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-border/50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
