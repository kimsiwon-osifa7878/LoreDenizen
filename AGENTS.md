# AGENTS.md — 웹 기반 로컬 LLM 캐릭터 챗 서비스

## 프로젝트 개요

설치 없이 웹 브라우저에서 허깅페이스의 오픈소스 GGUF 모델을 다운로드하여 로컬 추론하는 캐릭터 챗 서비스.
사용자가 시스템 프롬프트(지침)를 자유롭게 편집할 수 있고, 캐릭터 프리셋을 커뮤니티에서 공유할 수 있는 플랫폼.

**마케팅 포지셔닝**: "내 브라우저에서 돌리는 나만의 AI" (검열 관련 단어 절대 사용 금지)

---

## 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | **Next.js 14+ (App Router)** | Vercel 배포 최적화 |
| 언어 | **TypeScript** | strict 모드 |
| LLM 추론 엔진 | **wllama (`@wllama/wllama`)** | llama.cpp WASM 바인딩, GGUF 전용 |
| 클라이언트 DB | **IndexedDB (Dexie.js 래퍼)** | 채팅 기록, 캐릭터 카드, 설정 |
| 모델 캐싱 | **Origin Private File System (OPFS)** | wllama 내장 캐싱 활용 |
| 스타일링 | **Tailwind CSS 4** | shadcn/ui 컴포넌트 |
| 상태 관리 | **Zustand** | 경량 전역 상태 |
| 패키지 매니저 | **pnpm** | |

---

## 핵심 제약 사항 (반드시 준수)

1. **서버 사이드 추론 절대 금지** — 모든 LLM 추론은 사용자 브라우저에서 실행
2. **GGUF 포맷만 지원** — 다른 모델 포맷 지원하지 않음
3. **모든 사용자 데이터는 IndexedDB에 저장** — 서버 DB 사용 금지
4. **Next.js API Routes는 허깅페이스 모델 메타데이터 프록시용으로만 사용**
5. **모델 다운로드와 추론은 반드시 분리** — 다운로드 후 명시적 로드
6. **Vercel 배포 시 COOP/COEP 헤더 필수** — next.config.js에 설정
7. **wllama 추론은 Web Worker 내에서 실행** — UI 스레드 블로킹 금지

---

## 구현 단계

### Phase 1: 프로젝트 초기 설정

**목표**: Next.js 프로젝트 생성, 기본 의존성 설치, Vercel 배포 준비

```bash
pnpx create-next-app@latest local-llm-chat --typescript --tailwind --app --src-dir
cd local-llm-chat
pnpm add @wllama/wllama dexie zustand
pnpm add -D @types/node
```

**next.config.js 필수 설정**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // wllama multi-thread 지원을 위한 필수 헤더
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
  // wasm 파일 처리
  webpack(config) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};
module.exports = nextConfig;
```

**디렉토리 구조**:
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # 메인 채팅 페이지
│   ├── api/
│   │   └── models/
│   │       └── route.ts            # HF 모델 검색 프록시
│   └── globals.css
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx       # 채팅 메인 컨테이너
│   │   ├── MessageList.tsx         # 메시지 목록
│   │   ├── MessageBubble.tsx       # 개별 메시지 버블
│   │   ├── ChatInput.tsx           # 입력 영역
│   │   └── StreamingText.tsx       # 스트리밍 텍스트 표시
│   ├── sidebar/
│   │   ├── Sidebar.tsx             # 사이드바 컨테이너
│   │   ├── ConversationList.tsx    # 대화 목록
│   │   └── CharacterList.tsx       # 캐릭터 목록
│   ├── model/
│   │   ├── ModelManager.tsx        # 모델 관리 UI
│   │   ├── ModelDownloader.tsx     # 모델 다운로드 UI + 진행률
│   │   ├── ModelSelector.tsx       # 다운로드된 모델 선택
│   │   └── ModelSearchDialog.tsx   # HF 모델 검색 다이얼로그
│   ├── character/
│   │   ├── CharacterEditor.tsx     # 캐릭터 카드 편집기
│   │   ├── SystemPromptEditor.tsx  # 시스템 프롬프트 편집기
│   │   └── CharacterCard.tsx       # 캐릭터 카드 표시
│   └── settings/
│       └── SettingsDialog.tsx      # 설정 다이얼로그
├── lib/
│   ├── llm/
│   │   ├── engine.ts               # wllama 엔진 래퍼 (싱글톤)
│   │   ├── model-manager.ts        # 모델 다운로드/삭제/목록 관리
│   │   └── inference.ts            # 추론 실행 (스트리밍)
│   ├── db/
│   │   ├── database.ts             # Dexie DB 스키마 정의
│   │   ├── conversations.ts        # 대화 CRUD
│   │   ├── messages.ts             # 메시지 CRUD
│   │   └── characters.ts           # 캐릭터 카드 CRUD
│   ├── store/
│   │   ├── chat-store.ts           # 채팅 상태 (Zustand)
│   │   ├── model-store.ts          # 모델 상태 (Zustand)
│   │   └── ui-store.ts             # UI 상태 (Zustand)
│   └── types/
│       └── index.ts                # 공통 타입 정의
└── public/
    └── wasm/                       # wllama WASM 바이너리 (빌드 시 복사)
```

---

### Phase 2: 데이터베이스 레이어 (IndexedDB + Dexie)

**목표**: 모든 사용자 데이터를 브라우저 IndexedDB에 저장하는 레이어 구축

**`src/lib/db/database.ts`** — DB 스키마:
```typescript
import Dexie, { type Table } from 'dexie';

export interface Conversation {
  id: string;                 // crypto.randomUUID()
  title: string;
  characterId: string | null; // 연결된 캐릭터
  modelId: string;            // 사용한 모델 ID
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface Character {
  id: string;
  name: string;
  avatar: string;             // base64 또는 emoji
  systemPrompt: string;       // 사용자가 자유롭게 편집 가능
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DownloadedModel {
  id: string;                 // "owner/repo::filename" 형식
  hfRepo: string;             // HF 저장소 (예: "TheBloke/Llama-2-7B-Chat-GGUF")
  fileName: string;           // GGUF 파일명
  fileSize: number;           // 바이트
  quantization: string;       // Q4_K_M 등
  downloadedAt: Date;
  lastUsedAt: Date;
}

export interface AppSettings {
  id: 'global';
  activeModelId: string | null;
  defaultCharacterId: string | null;
  theme: 'light' | 'dark' | 'system';
  inferenceParams: {
    temperature: number;      // 기본 0.7
    topP: number;             // 기본 0.9
    topK: number;             // 기본 40
    repeatPenalty: number;    // 기본 1.1
    maxTokens: number;        // 기본 512
  };
}

export class AppDatabase extends Dexie {
  conversations!: Table<Conversation>;
  messages!: Table<Message>;
  characters!: Table<Character>;
  downloadedModels!: Table<DownloadedModel>;
  settings!: Table<AppSettings>;

  constructor() {
    super('LocalLLMChat');
    this.version(1).stores({
      conversations: 'id, characterId, updatedAt',
      messages: 'id, conversationId, createdAt',
      characters: 'id, name, *tags',
      downloadedModels: 'id, hfRepo, downloadedAt',
      settings: 'id',
    });
  }
}

export const db = new AppDatabase();
```

**구현 시 주의사항**:
- 모든 DB 함수는 async/await 사용
- 대화 삭제 시 관련 메시지도 cascade 삭제
- 설정은 싱글 레코드 ('global' ID)로 관리
- 처음 앱 로드 시 기본 설정 레코드와 기본 캐릭터 2-3개 시드

---

### Phase 3: LLM 엔진 레이어 (wllama)

**목표**: wllama를 래핑하여 모델 다운로드/로드/추론을 관리하는 서비스 레이어

**`src/lib/llm/engine.ts`** — wllama 엔진 싱글톤:
```typescript
import { Wllama } from '@wllama/wllama';

// wllama WASM 파일 경로 설정
const CONFIG_PATHS = {
  'single-thread/wllama.wasm': '/wasm/single-thread/wllama.wasm',
  'multi-thread/wllama.wasm': '/wasm/multi-thread/wllama.wasm',
};

class LLMEngine {
  private wllama: Wllama | null = null;
  private currentModelId: string | null = null;
  private isLoading = false;

  async initialize(): Promise<void> {
    if (this.wllama) return;
    this.wllama = new Wllama(CONFIG_PATHS);
  }

  // HuggingFace에서 모델 다운로드 (OPFS에 캐싱됨)
  async downloadModel(
    hfRepo: string,
    fileName: string,
    onProgress: (progress: { loaded: number; total: number }) => void
  ): Promise<void> {
    // wllama.loadModelFromHF가 내부적으로 다운로드+캐싱 처리
    // 여기서는 다운로드만 하고 언로드
    await this.initialize();
    await this.wllama!.loadModelFromHF(hfRepo, fileName, {
      progressCallback: onProgress,
    });
    await this.wllama!.exit(); // 모델 언로드 (다운로드만 완료)
    this.wllama = null;
  }

  // 캐시된 모델 로드
  async loadModel(hfRepo: string, fileName: string): Promise<void> {
    if (this.isLoading) throw new Error('모델 로딩 중');
    this.isLoading = true;
    try {
      await this.initialize();
      await this.wllama!.loadModelFromHF(hfRepo, fileName, {
        n_ctx: 2048,  // 컨텍스트 크기
      });
      this.currentModelId = `${hfRepo}::${fileName}`;
    } finally {
      this.isLoading = false;
    }
  }

  // 스트리밍 추론
  async *generateStream(
    messages: Array<{ role: string; content: string }>,
    params: { temperature: number; topP: number; topK: number; maxTokens: number }
  ): AsyncGenerator<string> {
    if (!this.wllama) throw new Error('모델이 로드되지 않음');

    // 메시지를 프롬프트 문자열로 변환 (chat template 적용)
    const prompt = this.formatMessages(messages);

    // wllama의 createCompletion을 스트리밍으로 실행
    // 콜백 기반이므로 AsyncGenerator로 래핑
    // 실제 구현 시 wllama API에 맞게 조정 필요
  }

  private formatMessages(messages: Array<{ role: string; content: string }>): string {
    // ChatML 포맷 기본 사용
    return messages.map(m => {
      if (m.role === 'system') return `<|im_start|>system\n${m.content}<|im_end|>`;
      if (m.role === 'user') return `<|im_start|>user\n${m.content}<|im_end|>`;
      if (m.role === 'assistant') return `<|im_start|>assistant\n${m.content}<|im_end|>`;
      return '';
    }).join('\n') + '\n<|im_start|>assistant\n';
  }

  async unloadModel(): Promise<void> {
    if (this.wllama) {
      await this.wllama.exit();
      this.wllama = null;
      this.currentModelId = null;
    }
  }

  isModelLoaded(): boolean {
    return this.currentModelId !== null;
  }

  getCurrentModelId(): string | null {
    return this.currentModelId;
  }
}

export const llmEngine = new LLMEngine();
```

**wllama 사용 시 주의사항**:
- wllama는 WebGPU를 지원하지 않음 (WASM SIMD만) — 이것은 의도된 트레이드오프 (GGUF 호환성 우선)
- 파일 크기 제한 2GB — 큰 모델은 split 필요 (loadModelFromHF가 자동 처리)
- multi-thread 사용 시 COOP/COEP 헤더 필수 (Phase 1에서 설정 완료)
- wllama 인스턴스는 동시에 하나의 모델만 로드 가능
- 추론은 Web Worker에서 실행되어 UI 블로킹 없음 (wllama 내장)

**WASM 파일 배포**:
```bash
# node_modules에서 public으로 wasm 파일 복사하는 빌드 스크립트 필요
# package.json에 postinstall 추가:
"scripts": {
  "postinstall": "cp -r node_modules/@wllama/wllama/esm/single-thread public/wasm/single-thread && cp -r node_modules/@wllama/wllama/esm/multi-thread public/wasm/multi-thread"
}
```

또는 CDN 사용 (비추천이지만 간편):
```typescript
import WasmFromCDN from '@wllama/wllama/esm/wasm-from-cdn.js';
const wllama = new Wllama(WasmFromCDN);
```

---

### Phase 4: 채팅 UI

**목표**: ChatGPT/Open WebUI 스타일의 깔끔한 채팅 인터페이스

**레이아웃 구조**:
```
┌─────────────────────────────────────────────────┐
│  헤더 (모델 상태 표시 / 설정 버튼)                  │
├────────────┬────────────────────────────────────┤
│            │                                    │
│  사이드바    │        채팅 영역                    │
│            │                                    │
│  - 대화 목록 │   ┌─────────────────────────┐     │
│  - 새 대화   │   │ 메시지 버블들 (스크롤)     │     │
│  - 캐릭터    │   │                         │     │
│             │   └─────────────────────────┘     │
│             │   ┌─────────────────────────┐     │
│             │   │ 입력창 + 전송 버튼        │     │
│             │   └─────────────────────────┘     │
└────────────┴────────────────────────────────────┘
```

**UI 구현 요구사항**:

1. **메시지 버블**:
   - 사용자: 우측 정렬, 파란 배경
   - 어시스턴트: 좌측 정렬, 회색 배경, 캐릭터 아바타 표시
   - 마크다운 렌더링 지원 (react-markdown)
   - 스트리밍 중 타이핑 애니메이션 (커서 깜빡임)

2. **입력창**:
   - textarea (자동 높이 조절, 최대 6줄)
   - Enter 전송, Shift+Enter 줄바꿈
   - 전송 버튼 (아이콘)
   - 추론 중이면 "중지" 버튼으로 변경

3. **사이드바**:
   - 접기/펼치기 (모바일에서 오버레이)
   - 대화 목록: 최근순, 클릭하면 해당 대화 로드
   - "새 대화" 버튼 상단 고정
   - 대화 삭제 (스와이프 또는 우클릭 메뉴)

4. **반응형 디자인**:
   - 모바일: 사이드바 오버레이, 풀스크린 채팅
   - 데스크톱: 좌측 사이드바 고정 (280px)
   - 다크/라이트 모드 지원

5. **빈 상태 처리**:
   - 모델 미로드: "모델을 먼저 다운로드하세요" + 모델 관리 버튼
   - 대화 없음: 제안 프롬프트 카드 표시
   - 추론 중: 로딩 인디케이터 + 스트리밍 텍스트

---

### Phase 5: 모델 관리 UI

**목표**: 허깅페이스에서 GGUF 모델 검색, 다운로드, 관리하는 인터페이스

**모델 관리 다이얼로그 구성**:

1. **"내 모델" 탭**:
   - 다운로드된 모델 목록 (이름, 크기, 양자화, 마지막 사용일)
   - 모델 선택 (라디오) → 선택 시 자동 로드
   - 모델 삭제 버튼
   - 현재 로드된 모델 표시 (초록 배지)

2. **"모델 다운로드" 탭**:
   - 허깅페이스 검색 입력 (API Route로 프록시)
   - 검색 결과 목록: 모델명, 파일 크기, 양자화 종류, 다운로드 수
   - GGUF 파일만 필터링하여 표시
   - 추천 모델 프리셋 표시 (Gemma-2B, Phi-3-mini, Qwen-2.5 등)
   - 다운로드 버튼 → 진행률 바

3. **"설정" 탭**:
   - 추론 파라미터: temperature, top_p, top_k, max_tokens (슬라이더)
   - 모델 저장 위치 정보 표시 (OPFS, 변경 불가하지만 정보 표시)
   - 전체 캐시 삭제 버튼

**API Route (`src/app/api/models/route.ts`)**:
```typescript
// HuggingFace API를 프록시하여 GGUF 모델 검색
// GET /api/models?q=gemma+gguf&limit=20
// HF API: https://huggingface.co/api/models?search={query}&filter=gguf
// 응답에서 GGUF 파일만 필터링하여 반환
```

---

### Phase 6: 캐릭터 카드 시스템

**목표**: 시스템 프롬프트를 "캐릭터 카드"로 관리하고 편집할 수 있는 시스템

**캐릭터 카드 에디터 구성**:

1. **기본 정보**:
   - 캐릭터 이름
   - 아바타 (이모지 선택 또는 이미지 업로드 → base64)
   - 설명 (한 줄)
   - 태그 (쉼표 구분)

2. **시스템 프롬프트 편집기**:
   - 전체 화면 가능한 textarea
   - 마크다운 미리보기 토글
   - 기본 템플릿 제공:
     ```
     당신의 이름은 {{name}}입니다.
     
     ## 성격
     (여기에 캐릭터의 성격을 작성하세요)
     
     ## 말투
     (여기에 캐릭터의 말투를 작성하세요)
     
     ## 세계관
     (여기에 배경 설정을 작성하세요)
     
     ## 규칙
     (여기에 행동 규칙을 작성하세요)
     ```

3. **기본 제공 캐릭터 (시드 데이터)**:
   - "기본 어시스턴트" — 일반적인 도움 AI
   - "한국어 선생님" — 한국어 교정/교육
   - "코딩 도우미" — 프로그래밍 질문 답변

---

### Phase 7: 채팅 로직 통합

**목표**: UI, DB, LLM 엔진을 연결하여 완전한 채팅 플로우 구현

**채팅 플로우**:
```
1. 사용자가 메시지 입력 → 전송
2. 메시지를 IndexedDB에 저장 (role: 'user')
3. 현재 대화의 모든 메시지 로드
4. 캐릭터의 systemPrompt를 첫 번째 메시지로 추가
5. wllama에 메시지 배열 전달하여 스트리밍 추론 시작
6. 스트리밍 토큰을 실시간으로 UI에 표시
7. 추론 완료 시 전체 응답을 IndexedDB에 저장 (role: 'assistant')
8. 대화 제목 자동 생성 (첫 메시지 기반)
```

**Zustand 스토어 구조 (`src/lib/store/chat-store.ts`)**:
```typescript
interface ChatState {
  // 현재 상태
  activeConversationId: string | null;
  messages: Message[];
  isGenerating: boolean;
  streamingContent: string;  // 현재 스트리밍 중인 텍스트

  // 액션
  sendMessage: (content: string) => Promise<void>;
  stopGeneration: () => void;
  loadConversation: (id: string) => Promise<void>;
  createConversation: (characterId?: string) => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
}
```

**스트리밍 구현 핵심**:
```typescript
// wllama의 createCompletion 콜백을 AsyncGenerator로 변환
const sendMessage = async (content: string) => {
  // 1. 사용자 메시지 저장
  // 2. streamingContent 초기화
  // 3. isGenerating = true
  // 4. wllama 추론 시작 (콜백으로 토큰 수신)
  //    - 각 토큰마다 streamingContent += token
  //    - UI는 streamingContent를 구독하여 실시간 렌더링
  // 5. 완료 시 전체 응답을 Message로 저장
  // 6. isGenerating = false, streamingContent 초기화
};
```

---

### Phase 8: 마무리 및 배포

**목표**: 최종 점검, 에러 처리, Vercel 배포

1. **에러 처리**:
   - 모델 미로드 시 채팅 입력 비활성화 + 안내 메시지
   - 다운로드 실패 시 재시도 버튼
   - WASM 지원 미확인 시 브라우저 호환성 안내
   - 메모리 부족 시 사용자에게 모델 크기 줄이기 제안

2. **성능 최적화**:
   - React.memo로 메시지 리스트 최적화
   - 대화 목록 가상 스크롤 (대화가 많을 때)
   - 모델 다운로드 진행률 throttle (100ms)

3. **Vercel 배포 설정**:
   - `vercel.json`에 COOP/COEP 헤더 추가 (next.config.js와 동일)
   - WASM 파일 정적 서빙 확인
   - Edge Runtime 사용하지 않음 (Node.js runtime)

4. **접근성**:
   - 키보드 내비게이션
   - 스크린 리더 지원 (aria-label)
   - 고대비 모드 지원

---

## 코드 컨벤션

- **컴포넌트**: 함수형 컴포넌트 + hooks만 사용
- **파일 명명**: kebab-case (예: `chat-container.tsx`) — 단, 컴포넌트 파일명만 PascalCase
- **export**: named export 기본 (default export는 page.tsx만)
- **에러 처리**: try-catch + 사용자 친화적 toast 메시지
- **주석**: 복잡한 로직에만 한국어 주석
- **커밋**: 한국어 커밋 메시지, 기능 단위

---

## wllama API 참고

```typescript
import { Wllama } from '@wllama/wllama';

// 초기화
const wllama = new Wllama(CONFIG_PATHS);

// HF에서 모델 로드 (자동 다운로드 + 캐싱)
await wllama.loadModelFromHF('owner/repo', 'model.gguf', {
  progressCallback: ({ loaded, total }) => { /* 진행률 */ },
  n_ctx: 2048,
});

// 텍스트 생성 (completions)
const result = await wllama.createCompletion(prompt, {
  nPredict: 512,
  sampling: {
    temp: 0.7,
    top_p: 0.9,
    top_k: 40,
    penalty_repeat: 1.1,
  },
  onNewToken: (token, piece, currentText, { abortSignal }) => {
    // 스트리밍 토큰 콜백
    // piece: 디코딩된 텍스트 조각
    // currentText: 지금까지 생성된 전체 텍스트
  },
});

// 모델 언로드
await wllama.exit();
```

**GGUF 모델 추천 (테스트용)**:
- `TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF` — 초경량, 테스트용
- `bartowski/gemma-2-2b-it-GGUF` — 소형, 괜찮은 품질
- `bartowski/Phi-3.5-mini-instruct-GGUF` — 소형, 고품질

---

## 구현 순서 요약

| 순서 | Phase | 핵심 산출물 | 의존성 |
|------|-------|-----------|--------|
| 1 | 프로젝트 설정 | 빈 Next.js + 헤더 설정 | 없음 |
| 2 | DB 레이어 | Dexie 스키마 + CRUD 함수 | Phase 1 |
| 3 | LLM 엔진 | wllama 래퍼 + 모델 관리 | Phase 1 |
| 4 | 채팅 UI | 메시지 목록 + 입력창 + 사이드바 | Phase 2 |
| 5 | 모델 관리 UI | 다운로드/선택/삭제 인터페이스 | Phase 3 |
| 6 | 캐릭터 카드 | 편집기 + 시드 데이터 | Phase 2 |
| 7 | 통합 | 채팅 플로우 완성 | Phase 3~6 |
| 8 | 배포 | Vercel 배포 + 에러 처리 | Phase 7 |

**각 Phase 완료 후 반드시 `pnpm build`로 빌드 확인 후 다음으로 진행.**
