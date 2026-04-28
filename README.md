# LoreDenizen

LoreDenizen is a browser-first character chat app where users can run their own GGUF models locally, edit persona/system prompts freely, and continue conversations with persistent client-side storage.

## Why this project matters

- **Personal AI in your browser**: model download, caching, and inference are designed around browser runtime usage.
- **Character-first chat UX**: each conversation starts from a selected character and supports structured character prompt sections including a seeded first message.
- **Pluggable model providers**: local GGUF + OpenRouter + Ollama in a unified UI.
- **Persistent user data**: conversations, messages, characters, and settings are saved in IndexedDB.

## Key features

- Character picker for new chats.
- Auto-seeded **First Message** when a chat starts with a character.
- Language-aware system prompt extension (responses are instructed to follow the selected app language).
- OpenRouter model selection with API key validation and safer session restore behavior.
- Model management tabs for local GGUF, OpenRouter, and Ollama.

## Screenshots

### Character picker
![Character picker dialog](docs/screenshots/character-picker-dialog.png)

### First Message appears immediately after character selection
![First message seeded](docs/screenshots/first-message-seeded.png)

### OpenRouter invalid API key handling
![OpenRouter invalid key state](docs/screenshots/openrouter-invalid-key.png)

## Getting started

### 1) Install dependencies

```bash
pnpm install
```

### 2) Optional environment setup

Create `.env.local` and configure as needed:

- `HF_MODELS`: JSON array of Hugging Face repos (GGUF).
- `OPENROUTER_API_KEY`: optional server API key for OpenRouter.

Example:

```json
[
  "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF",
  "bartowski/gemma-2-2b-it-GGUF",
  "bartowski/Phi-3.5-mini-instruct-GGUF"
]
```

### 3) Run dev server

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Usage flow

1. Open **New chat** and select a character.
2. Confirm the character's **First Message** appears automatically.
3. Open **Settings** and choose a model provider:
   - Local GGUF: download/select from model tabs.
   - OpenRouter: select a model and provide a valid API key if needed.
   - Ollama: connect URL and choose a discovered model.
4. Start chatting; app state and history persist in browser storage.

## Testing

Install Playwright browser:

```bash
pnpm test:e2e:install
```

Run E2E tests:

```bash
pnpm test:e2e
```

Run production build check:

```bash
pnpm build
```
