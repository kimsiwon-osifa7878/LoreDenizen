import { db } from "./database";
import type { Message } from "../types";

export async function addMessage(
  data: Omit<Message, "id" | "createdAt">
): Promise<Message> {
  const message: Message = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date(),
  };
  await db.messages.add(message);
  return message;
}

export async function getMessagesByConversation(
  conversationId: string
): Promise<Message[]> {
  return db.messages
    .where("conversationId")
    .equals(conversationId)
    .sortBy("createdAt");
}

export async function deleteMessage(id: string): Promise<void> {
  await db.messages.delete(id);
}

export async function deleteMessagesByConversation(
  conversationId: string
): Promise<void> {
  await db.messages.where("conversationId").equals(conversationId).delete();
}
