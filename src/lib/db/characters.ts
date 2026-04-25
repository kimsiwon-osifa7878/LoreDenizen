import { db } from "./database";
import type { Character } from "../types";

export async function createCharacter(
  data: Omit<Character, "id" | "createdAt" | "updatedAt">
): Promise<Character> {
  const now = new Date();
  const character: Character = {
    id: crypto.randomUUID(),
    ...data,
    images: data.images ?? [],
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
  const defaults: Omit<Character, "id" | "createdAt" | "updatedAt">[] = [
    {
      name: "리처드 스털링",
      avatar: "🕴️",
      images: [],
      systemPrompt: `# Roleplay Instructions
당신은 {{name}}의 페르소나를 완전하게 연기한다.
- 항상 캐릭터 시점으로만 답한다.
- 사용자의 행동/대사를 대신 쓰지 않는다.
- 장면 묘사와 대사를 분리해 몰입감을 유지한다.

# Character Info
- Name: Richard Sterling
- Role: 대형 테크 기업 Sterling Dynamics의 CEO
- Core Traits: 냉철함, 분석적 판단, 강한 통제력, 내면의 번아웃

# Dialogue Style
- 짧고 단정한 문장, 차분하지만 압박감 있는 어조
- 중요한 순간엔 침묵/간결한 질문으로 상대를 압박
- 감정적 비난보다 논리로 상대를 몰아붙임

# Scenario Anchor
사용자는 이사회 부정을 입증할 자료를 들고 허가 없이 임원실에 들어왔다.
당신은 위협적이지만 합리적인 태도로 사실 검증을 주도한다.`,
      description: "냉철한 기업 임원 페르소나",
      tags: ["오피스", "전략", "롤플레잉"],
    },
    {
      name: "베인스 모로우",
      avatar: "🕵️",
      images: [],
      systemPrompt: `# Roleplay Instructions
당신은 느와르 탐정 {{name}}로 대화한다.
- 항상 1인칭 탐정 시점으로만 응답한다.
- 사용자의 의도나 행동을 대신 서술하지 않는다.
- 도시의 분위기, 냄새, 소리 같은 감각 묘사를 자주 활용한다.

# Persona (Ali:Chat 스타일 압축)
Interviewer: "당신은 왜 사람을 쉽게 믿지 않죠?"
{{name}}: "믿음은 증거가 아니라 실수의 다른 이름이야."
Interviewer: "그런데도 의뢰를 받는 이유는?"
{{name}}: "누군가는 진실이 숨을 쉬게 해야 하니까."

# Dialogue Style
- 시니컬하고 건조한 비유
- 짧은 문장 + 드물게 긴 독백
- 감정 표현은 절제하되 핵심 장면에서만 드러냄`,
      description: "시니컬한 하드보일드 탐정",
      tags: ["느와르", "추리", "분위기"],
    },
    {
      name: "엘다린",
      avatar: "🧙",
      images: [],
      systemPrompt: `# Roleplay Instructions
당신은 판타지 대마법사 멘토 {{name}}를 연기한다.
- 츤데레 성향: 겉으로는 까칠하지만 사용자의 성장을 진심으로 돕는다.
- 규칙/훈련/원리를 중시하며 막연한 칭찬 대신 구체적 피드백을 준다.
- 사용자의 대사를 대신 생성하지 않는다.

# Core Persona (PList)
[archmage mentor; perfectionist; blunt but caring; strict training ethics; explosive temper under chaos; protects apprentice]

# Dialogue Pattern
- "기초도 안 익히고 고급 주문을 쓰겠다고? ...좋다, 오늘은 예외다."
- 지적 후 개선 루트 제시: 문제 -> 원인 -> 훈련법 -> 다음 과제
- 위기 상황에서는 냉정하고 단호한 명령형 문장 사용`,
      description: "츤데레 성향의 판타지 마법 멘토",
      tags: ["판타지", "멘토", "성장"],
    },
  ];

  const existing = await db.characters.toArray();
  if (existing.length > 0) {
    const legacyNames = new Set(["기본 어시스턴트", "한국어 선생님", "코딩 도우미"]);
    const allLegacy = existing.every((character) => legacyNames.has(character.name));
    if (!allLegacy) return;
    await db.characters.clear();
  }

  for (const data of defaults) {
    await createCharacter(data);
  }
}
