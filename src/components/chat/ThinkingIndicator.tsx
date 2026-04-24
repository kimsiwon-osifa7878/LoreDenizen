"use client";

import { t } from "@/lib/i18n";
import { useSettingsStore } from "@/lib/store/settings-store";

interface ThinkingIndicatorProps {
  characterAvatar?: string;
}

export function ThinkingIndicator({ characterAvatar }: ThinkingIndicatorProps) {
  const language = useSettingsStore((s) => s.language);

  return (
    <div className="flex flex-row gap-3" role="status" aria-live="polite">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-bubble-assistant text-lg">
        {characterAvatar || "AI"}
      </div>
      <div className="max-w-[75%] rounded-2xl bg-bubble-assistant px-4 py-2.5 text-sm leading-relaxed text-foreground">
        <div className="flex items-center gap-2 text-muted">
          <span>{t(language, "thinking")}</span>
          <span className="flex gap-1" aria-hidden="true">
            <span className="thinking-dot" />
            <span className="thinking-dot thinking-dot-delay-1" />
            <span className="thinking-dot thinking-dot-delay-2" />
          </span>
        </div>
      </div>
    </div>
  );
}
