import { create } from "zustand";
import type { Conversation, Message, Character, InferenceParams } from "../types";
import { DEFAULT_INFERENCE_PARAMS } from "../types";
import {
  createConversation,
  getAllConversations,
  updateConversation,
  deleteConversation,
} from "../db/conversations";
import {
  addMessage,
  getMessagesByConversation,
} from "../db/messages";
import { getCharacter, getAllCharacters } from "../db/characters";
import { getSettings } from "../db/settings";
import { llmEngine } from "../llm/engine";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  characters: Character[];
  activeCharacter: Character | null;
  isGenerating: boolean;
  streamingContent: string;
  inferenceParams: InferenceParams;

  loadConversations: () => Promise<void>;
  loadCharacters: () => Promise<void>;
  loadSettings: () => Promise<void>;
  setActiveConversation: (id: string | null) => Promise<void>;
  createNewConversation: (characterId?: string) => Promise<string>;
  deleteConv: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  stopGeneration: () => void;
  setActiveCharacter: (character: Character | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  characters: [],
  activeCharacter: null,
  isGenerating: false,
  streamingContent: "",
  inferenceParams: DEFAULT_INFERENCE_PARAMS,

  loadConversations: async () => {
    const conversations = await getAllConversations();
    set({ conversations });
  },

  loadCharacters: async () => {
    const characters = await getAllCharacters();
    set({ characters });
  },

  loadSettings: async () => {
    const settings = await getSettings();
    set({ inferenceParams: settings.inferenceParams });
  },

  setActiveConversation: async (id) => {
    if (!id) {
      set({ activeConversationId: null, messages: [], activeCharacter: null });
      return;
    }
    const messages = await getMessagesByConversation(id);
    const conversations = get().conversations;
    const conv = conversations.find((c) => c.id === id);
    let activeCharacter: Character | null = null;
    if (conv?.characterId) {
      activeCharacter = (await getCharacter(conv.characterId)) ?? null;
    }
    set({ activeConversationId: id, messages, activeCharacter });
  },

  createNewConversation: async (characterId) => {
    const modelId = llmEngine.getCurrentModelId() ?? "none";
    const charId = characterId ?? get().activeCharacter?.id ?? null;
    const conv = await createConversation({
      title: "새 대화",
      characterId: charId,
      modelId,
    });
    await get().loadConversations();
    await get().setActiveConversation(conv.id);
    return conv.id;
  },

  deleteConv: async (id) => {
    await deleteConversation(id);
    if (get().activeConversationId === id) {
      set({ activeConversationId: null, messages: [] });
    }
    await get().loadConversations();
  },

  sendMessage: async (content) => {
    const state = get();
    let convId = state.activeConversationId;

    // 대화가 없으면 새로 생성
    if (!convId) {
      convId = await get().createNewConversation();
    }

    // 사용자 메시지 저장
    const userMsg = await addMessage({
      conversationId: convId,
      role: "user",
      content,
    });
    set((s) => ({ messages: [...s.messages, userMsg] }));

    // 첫 메시지면 대화 제목 업데이트
    if (get().messages.length <= 1) {
      const title = content.slice(0, 30) + (content.length > 30 ? "..." : "");
      await updateConversation(convId, { title });
      await get().loadConversations();
    }

    // 모델이 로드되지 않았으면 중단
    if (!llmEngine.isModelLoaded()) {
      const errMsg = await addMessage({
        conversationId: convId,
        role: "assistant",
        content: "⚠️ 모델이 로드되지 않았습니다. 모델을 먼저 다운로드하고 선택해주세요.",
      });
      set((s) => ({ messages: [...s.messages, errMsg] }));
      return;
    }

    // 추론 시작
    set({ isGenerating: true, streamingContent: "" });

    try {
      // 시스템 프롬프트 + 메시지 배열 구성
      const allMessages: Array<{ role: string; content: string }> = [];
      const character = get().activeCharacter;
      if (character) {
        allMessages.push({ role: "system", content: character.systemPrompt });
      }
      for (const msg of get().messages) {
        if (msg.role !== "system") {
          allMessages.push({ role: msg.role, content: msg.content });
        }
      }

      const params = get().inferenceParams;
      const result = await llmEngine.generateCompletion(
        allMessages,
        params,
        (_token, currentText) => {
          set({ streamingContent: currentText });
        }
      );

      // 완료된 응답 저장
      const assistantMsg = await addMessage({
        conversationId: convId,
        role: "assistant",
        content: result,
      });
      set((s) => ({
        messages: [...s.messages, assistantMsg],
        streamingContent: "",
      }));
    } catch (err) {
      // 중단된 경우 현재 스트리밍 내용 저장
      const partial = get().streamingContent;
      if (partial) {
        const assistantMsg = await addMessage({
          conversationId: convId,
          role: "assistant",
          content: partial,
        });
        set((s) => ({
          messages: [...s.messages, assistantMsg],
          streamingContent: "",
        }));
      }
    } finally {
      set({ isGenerating: false, streamingContent: "" });
    }
  },

  stopGeneration: () => {
    llmEngine.stopGeneration();
  },

  setActiveCharacter: (character) => set({ activeCharacter: character }),
}));
