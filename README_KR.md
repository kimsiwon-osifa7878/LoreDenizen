# LoreDenizen

**내 브라우저에서 돌리는 나만의 AI 캐릭터.**

LoreDenizen은 브라우저 기반 캐릭터 AI 채팅 앱입니다.  
사용자는 로컬 GGUF 모델, OpenRouter, Ollama 중 원하는 모델 공급자를 선택하고, 캐릭터의 시스템 프롬프트와 First Message를 자유롭게 편집하며, 자신만의 AI 캐릭터와 대화를 이어갈 수 있습니다.

LoreDenizen이 지향하는 것은 단순한 챗봇 UI가 아닙니다.  
이 프로젝트는 캐릭터 설정, 모델 선택, 로컬 저장, 프롬프트 편집, 대화 지속성을 하나로 묶어 **“내 브라우저 안에 사는 AI 캐릭터”** 경험을 만듭니다.

## Why LoreDenizen?

대부분의 AI 채팅 서비스는 모델과 데이터가 서비스 제공자 서버에 묶여 있습니다.  
LoreDenizen은 반대로, 사용자가 모델과 캐릭터 경험을 더 직접적으로 제어할 수 있는 방향을 실험합니다.

## 핵심 강점

- **Browser-first local AI**  
  GGUF 모델 다운로드와 실행 흐름을 브라우저 환경 중심으로 설계했습니다.
- **Character-first chat UX**  
  새 대화는 캐릭터 선택에서 시작되며, 캐릭터의 First Message가 자동 표시됩니다.
- **Editable persona and system prompts**  
  캐릭터의 성격, 말투, 세계관, 행동 규칙을 사용자가 직접 편집할 수 있습니다.
- **Multiple model providers**  
  로컬 GGUF, OpenRouter, Ollama를 하나의 UI에서 전환해 사용할 수 있습니다.
- **Persistent client-side memory**  
  대화, 메시지, 캐릭터, 설정은 브라우저 IndexedDB에 저장됩니다.

## One-line pitch

LoreDenizen turns your browser into a private character AI playground — local models, editable personas, persistent conversations.

## GitHub About (추천)

웹 기반 로컬 LLM 캐릭터 챗 앱 — GGUF, OpenRouter, Ollama를 하나의 UI에서 사용하고, 캐릭터 프롬프트와 대화 기록을 브라우저에 저장합니다.

## GitHub Topics (추천)

`local-llm`, `gguf`, `wllama`, `character-ai`, `ai-chat`, `browser-ai`, `ollama`, `openrouter`, `indexeddb`, `nextjs`, `typescript`, `ai-character`, `client-side-ai`

## 시작하기

### 1) 의존성 설치

```bash
pnpm install
```

### 2) (선택) 환경 변수 설정

`.env.local` 파일에 필요 시 아래를 설정하세요.

- `HF_MODELS`: GGUF가 들어있는 Hugging Face repo 목록(JSON 배열)
- `OPENROUTER_API_KEY`: OpenRouter 서버 API key (선택)

예시:

```json
[
  "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF",
  "bartowski/gemma-2-2b-it-GGUF",
  "bartowski/Phi-3.5-mini-instruct-GGUF"
]
```

### 3) 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 사용 방법

1. **새 대화**를 눌러 캐릭터를 선택합니다.
2. 채팅 시작 시 캐릭터의 **First Message**가 먼저 표시되는지 확인합니다.
3. **설정**에서 모델 공급자를 선택합니다.
   - 로컬 GGUF: 다운로드/선택 후 사용
   - OpenRouter: 모델 선택 + 필요 시 유효한 API key 입력
   - Ollama: 서버 URL 연결 후 모델 선택
4. 이후 대화를 진행하면 기록과 설정이 브라우저 저장소에 유지됩니다.

## 스크린샷

### 1) 메인 앱 레이아웃

기본 진입 상태에서 사이드바, 캐릭터 목록, 채팅 영역이 어떻게 보이는지 보여줍니다.

![메인 앱 레이아웃](docs/screenshots/app-home.png)

### 2) 캐릭터 선택 다이얼로그

**새 대화**를 누르면 열리는 화면으로, LoreDenizen의 캐릭터 우선 시작 흐름을 보여줍니다.

![캐릭터 선택 다이얼로그](docs/screenshots/character-picker-dialog.png)

### 3) First Message 자동 삽입

캐릭터를 선택하면 해당 캐릭터의 First Message가 대화 시작 시 자동으로 들어갑니다.

![First Message 자동 삽입](docs/screenshots/first-message-seeded.png)

### 4) Ollama 설정 탭

원격/로컬 Ollama URL 연결과 모델 선택 UI를 확인할 수 있습니다.

![Ollama 설정 탭](docs/screenshots/settings-ollama.png)

## 테스트

Playwright 브라우저 설치:

```bash
pnpm test:e2e:install
```

E2E 테스트 실행:

```bash
pnpm test:e2e
```

프로덕션 빌드 검증:

```bash
pnpm build
```
