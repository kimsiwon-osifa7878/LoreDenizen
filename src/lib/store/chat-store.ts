import { create } from "zustand";
import { t } from "../i18n";
import {
  createConversation,
  deleteConversation,
  getAllConversations,
  updateConversation,
} from "../db/conversations";
import { getAllCharacters, getCharacter } from "../db/characters";
import { addMessage, getMessagesByConversation } from "../db/messages";
import { getSettings } from "../db/settings";
import { llmEngine } from "../llm/engine";
import { useSettingsStore } from "./settings-store";
import type { Character, Conversation, InferenceParams, Message } from "../types";
import { DEFAULT_INFERENCE_PARAMS } from "../types";

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
    set((state) => ({
      characters,
      activeCharacter: state.activeCharacter
        ? characters.find((item) => item.id === state.activeCharacter?.id) ?? null
        : null,
    }));
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
    const conversation = get().conversations.find((item) => item.id === id);
    const activeCharacter = conversation?.characterId
      ? (await getCharacter(conversation.characterId)) ?? null
      : null;

    set({ activeConversationId: id, messages, activeCharacter });
  },

  createNewConversation: async (characterId) => {
    const language = useSettingsStore.getState().language;
    const modelId = llmEngine.getCurrentModelId() ?? "none";
    const charId = characterId ?? get().activeCharacter?.id ?? null;
    if (!charId) {
      throw new Error("character-required");
    }
    const conversation = await createConversation({
      title: t(language, "newConversationTitle"),
      characterId: charId,
      modelId,
    });

    await get().loadConversations();
    await get().setActiveConversation(conversation.id);
    return conversation.id;
  },

  deleteConv: async (id) => {
    await deleteConversation(id);
    if (get().activeConversationId === id) {
      set({ activeConversationId: null, messages: [], activeCharacter: null });
    }
    await get().loadConversations();
  },

  sendMessage: async (content) => {
    let conversationId = get().activeConversationId;

    if (!conversationId) {
      conversationId = await get().createNewConversation();
    }

    const userMessage = await addMessage({
      conversationId,
      role: "user",
      content,
    });
    set((state) => ({ messages: [...state.messages, userMessage] }));

    if (get().messages.length <= 1) {
      const title = content.slice(0, 30) + (content.length > 30 ? "..." : "");
      await updateConversation(conversationId, { title });
      await get().loadConversations();
    }

    if (!llmEngine.isModelLoaded()) {
      const language = useSettingsStore.getState().language;
      const errorMessage = await addMessage({
        conversationId,
        role: "assistant",
        content: t(language, "modelNotLoaded"),
      });
      set((state) => ({ messages: [...state.messages, errorMessage] }));
      return;
    }

    set({ isGenerating: true, streamingContent: "" });

    try {
      const allMessages: Array<{ role: string; content: string }> = [];
      const character = get().activeCharacter;
      if (character) {
        allMessages.push({ role: "system", content: character.systemPrompt });
      }
      for (const message of get().messages) {
        if (message.role !== "system") {
          allMessages.push({ role: message.role, content: message.content });
        }
      }

      const result = await llmEngine.generateCompletion(
        allMessages,
        get().inferenceParams,
        (_token, currentText) => {
          set({ streamingContent: currentText });
        }
      );

      const assistantMessage = await addMessage({
        conversationId,
        role: "assistant",
        content: result,
      });
      set((state) => ({
        messages: [...state.messages, assistantMessage],
        streamingContent: "",
      }));
    } catch {
      const partial = get().streamingContent;
      if (partial) {
        const assistantMessage = await addMessage({
          conversationId,
          role: "assistant",
          content: partial,
        });
        set((state) => ({
          messages: [...state.messages, assistantMessage],
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
}));
