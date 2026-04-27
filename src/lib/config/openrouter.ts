export function hasOpenRouterApiKeyInEnv(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}
