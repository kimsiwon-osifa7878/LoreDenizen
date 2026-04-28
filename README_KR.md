# LoreDenizen

LoreDenizen은 브라우저에서 GGUF 모델을 기반으로 캐릭터 채팅을 진행할 수 있도록 설계된 프로젝트입니다. 사용자는 캐릭터 설정과 시스템 프롬프트를 자유롭게 조정하고, 대화 기록을 로컬에 유지하면서 자신만의 AI 경험을 만들 수 있습니다.

## 프로젝트 의의

- **브라우저 중심 AI 경험**: 모델 사용 흐름을 브라우저 실행 환경에 맞춰 구성했습니다.
- **캐릭터 중심 대화**: 캐릭터 선택 후 대화를 시작하며, `First Message`를 즉시 보여줘 몰입감을 높입니다.
- **다중 모델 공급자 지원**: 로컬 GGUF, OpenRouter, Ollama를 같은 UI에서 다룹니다.
- **로컬 데이터 지속성**: 대화/메시지/캐릭터/설정을 IndexedDB에 저장합니다.

## 핵심 기능

- 새 대화 시작 시 캐릭터 선택 다이얼로그 제공
- 캐릭터 선택 직후 `First Message` 자동 표시
- 앱 언어 설정(영어/한국어)에 맞춘 응답 언어 지시를 시스템 프롬프트 끝에 자동 추가
- OpenRouter 모델 선택 시 API key 유효성 검증
- 세션 재시작 시 OpenRouter API key가 없으면 이전 선택 모델 자동 리셋

## 스크린샷

### 캐릭터 선택 다이얼로그
![캐릭터 선택 다이얼로그](docs/screenshots/character-picker-dialog.png)

### 캐릭터 선택 후 First Message 표시
![First Message 표시](docs/screenshots/first-message-seeded.png)

### OpenRouter 잘못된 API key 처리
![OpenRouter 잘못된 key 처리](docs/screenshots/openrouter-invalid-key.png)

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
