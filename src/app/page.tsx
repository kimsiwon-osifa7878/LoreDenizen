"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ModelManager } from "@/components/model/ModelManager";
import { CharacterEditor } from "@/components/character/CharacterEditor";
import { useChatStore } from "@/lib/store/chat-store";
import { useModelStore } from "@/lib/store/model-store";
import { seedDefaultCharacters } from "@/lib/db/characters";

export default function Home() {
  const loadConversations = useChatStore((s) => s.loadConversations);
  const loadCharacters = useChatStore((s) => s.loadCharacters);
  const loadSettings = useChatStore((s) => s.loadSettings);
  const loadModels = useModelStore((s) => s.loadModels);

  useEffect(() => {
    async function init() {
      await seedDefaultCharacters();
      await Promise.all([
        loadConversations(),
        loadCharacters(),
        loadSettings(),
        loadModels(),
      ]);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full">
      <Sidebar />
      <ChatContainer />
      <ModelManager />
      <CharacterEditor />
    </div>
  );
}
