# LoreDenizen

Browser-based GGUF chat app that downloads models from Hugging Face and runs them locally.

## Development

1. Prepare `.env.local` based on `.env.example`.
2. Put preset repository paths in `HF_MODELS` as a JSON string array.
3. Start the app.

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## E2E test (Playwright)

```bash
# install Chromium for Playwright
pnpm test:e2e:install

# run E2E tests
pnpm test:e2e
```

If your environment blocks Playwright browser downloads, set an already-installed
Chromium path and run tests with:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium pnpm test:e2e
```

## Environment variables

`HF_MODELS` example:

```json
[
  "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF",
  "bartowski/gemma-2-2b-it-GGUF",
  "bartowski/Phi-3.5-mini-instruct-GGUF"
]
```


`OPENROUTER_MODELS` example:

```json
[
  "openai/gpt-4o-mini",
  "anthropic/claude-3.5-sonnet"
]
```

Additional variables:

- `OPENROUTER_API_KEY`: server-side OpenRouter API key (optional; if empty, UI asks for one-time session key).
- `OPENROUTER_MODELS`: allowed OpenRouter model list shown in the Settings dialog.
- `ollamaUrl` defaults to `http://localhost:11434` in app settings and can be changed by user.

- Local development: `.env.local`
- Production or Vercel: `.env` or server environment variables

The UI now works in repo-first mode:

- preset repos come from `HF_MODELS`
- users can also enter an exact `owner/name` repo manually
- the app loads GGUF files from that repo and lets the user download a specific file
- global Hugging Face search remains controlled by `ENABLE_HF_MODEL_SEARCH`

## 진행상황

- Phase 1은 대부분 완료됨: Next.js App Router, TypeScript strict, Tailwind 4, wllama/Dexie/Zustand 설치, COOP/COEP 헤더, WASM 복사, `npm run build` 성공.
- 정리 필요 사항: 현재 셸에서 `pnpm`이 인식되지 않아 `pnpm build`는 미확인, `package-lock.json`과 `pnpm-lock.yaml` 공존, 일부 한국어 주석 인코딩 깨짐.
- 현재 코드는 Phase 2 일부와 Phase 3 일부까지 이미 진행됨.
- 다음 우선순위: Phase 1 마감 정리 후 Phase 2 DB 레이어 검증 및 보강.
