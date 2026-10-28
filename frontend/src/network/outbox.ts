import { createStore, del, entries, set } from "idb-keyval";

export interface OutboxItem {
  localId: string;
  userId: number;
  name: string;
  description: string;
  images: File[];
  createdAt: number;
  error?: string;      // set when the server rejected it for good
}

const store = createStore("bussin-db", "outbox");

export async function addToOutbox(item: OutboxItem) {
  await set(item.localId, item, store);
}

export async function updateOutbox(item: OutboxItem) {
  await set(item.localId, item, store);
}

export async function removeFromOutbox(localId: string) {
  await del(localId, store);
}

export async function listOutbox(): Promise<OutboxItem[]> {
  const all = await entries<string, OutboxItem>(store);
  return all.map(([, item]) => item).sort((a, b) => a.createdAt - b.createdAt);
}