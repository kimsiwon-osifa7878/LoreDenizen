import Dexie, { type Table } from "dexie";
import type {
  Conversation,
  Message,
  Character,
  DownloadedModel,
  AppSettings,
} from "../types";

export class AppDatabase extends Dexie {
  conversations!: Table<Conversation>;
  messages!: Table<Message>;
  characters!: Table<Character>;
  downloadedModels!: Table<DownloadedModel>;
  settings!: Table<AppSettings>;

  constructor() {
    super("LocalLLMChat");
    this.version(1).stores({
      conversations: "id, characterId, updatedAt",
      messages: "id, conversationId, createdAt",
      characters: "id, name, *tags",
      downloadedModels: "id, hfRepo, downloadedAt",
      settings: "id",
    });
  }
}

export const db = new AppDatabase();
