import { db } from "./database";
import type { Conversation } from "../types";

export async function createConversation(
  data: Omit<Conversation, "id" | "createdAt" | "updatedAt">
): Promise<Conversation> {
  const now = new Date();
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  await db.conversations.add(conversation);
  return conversation;
}

export async function getConversation(
  id: string
): Promise<Conversation | undefined> {
  return db.conversations.get(id);
}

export async function getAllConversations(): Promise<Conversation[]> {
  return db.conversations.orderBy("updatedAt").reverse().toArray();
}

export async function updateConversation(
  id: string,
  data: Partial<Omit<Conversation, "id" | "createdAt">>
): Promise<void> {
  await db.conversations.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteConversation(id: string): Promise<void> {
  await db.transaction("rw", [db.conversations, db.messages], async () => {
    await db.messages.where("conversationId").equals(id).delete();
    await db.conversations.delete(id);
  });
}
