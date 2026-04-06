import { db } from "./database";
import type { Character } from "../types";

export async function createCharacter(
  data: Omit<Character, "id" | "createdAt" | "updatedAt">
): Promise<Character> {
  const now = new Date();
  const character: Character = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  await db.characters.add(character);
  return character;
}

export async function getCharacter(
  id: string
): Promise<Character | undefined> {
  return db.characters.get(id);
}

export async function getAllCharacters(): Promise<Character[]> {
  return db.characters.orderBy("name").toArray();
}

export async function updateCharacter(
  id: string,
  data: Partial<Omit<Character, "id" | "createdAt">>
): Promise<void> {
  await db.characters.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteCharacter(id: string): Promise<void> {
  await db.characters.delete(id);
}

export async function seedDefaultCharacters(): Promise<void> {
  const count = await db.characters.count();
  if (count > 0) return;

  const defaults: Omit<Character, "id" | "createdAt" | "updatedAt">[] = [
    {
      name: "기본 어시스턴트",
      avatar: "🤖",
      systemPrompt:
        "당신은 친절하고 도움이 되는 AI 어시스턴트입니다. 사용자의 질문에 명확하고 정확하게 답변하세요.",
      description: "일반적인 도움을 주는 AI 어시스턴트",
      tags: ["기본", "어시스턴트"],
    },
    {
      name: "한국어 선생님",
      avatar: "📚",
      systemPrompt:
        "당신은 한국어 교육 전문가입니다. 사용자의 한국어 문장을 교정하고, 문법과 표현을 개선하는 데 도움을 줍니다. 틀린 부분이 있으면 왜 틀렸는지 친절하게 설명해주세요.",
      description: "한국어 문법 교정 및 교육",
      tags: ["교육", "한국어"],
    },
    {
      name: "코딩 도우미",
      avatar: "💻",
      systemPrompt:
        "당신은 프로그래밍 전문가입니다. 코드 작성, 디버깅, 알고리즘 설명 등 프로그래밍 관련 질문에 답변합니다. 코드 예제를 포함하여 명확하게 설명해주세요.",
      description: "프로그래밍 질문 답변 전문가",
      tags: ["코딩", "프로그래밍"],
    },
  ];

  for (const data of defaults) {
    await createCharacter(data);
  }
}
