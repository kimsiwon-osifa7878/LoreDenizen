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

## Environment variables

`HF_MODELS` example:

```json
[
  "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF",
  "bartowski/gemma-2-2b-it-GGUF",
  "bartowski/Phi-3.5-mini-instruct-GGUF"
]
```

- Local development: `.env.local`
- Production or Vercel: `.env` or server environment variables

The UI now works in repo-first mode:

- preset repos come from `HF_MODELS`
- users can also enter an exact `owner/name` repo manually
- the app loads GGUF files from that repo and lets the user download a specific file
- global Hugging Face search remains controlled by `ENABLE_HF_MODEL_SEARCH`
