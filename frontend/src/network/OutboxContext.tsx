import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { postBus } from "../api/busApi";
import { useAuth } from "../auth/AuthContext";
import { useNetwork } from "../network/NetworkContext";
import { addToOutbox, listOutbox, OutboxItem, removeFromOutbox, updateOutbox } from "./outbox";
import { NewBusInput } from "../domain/BusObject";

interface OutboxContextValue {
  pending: OutboxItem[];
  submitBus: (input: NewBusInput) => Promise<"sent" | "queued">;
  discard: (localId: string) => Promise<void>;
}

const OutboxContext = createContext<OutboxContextValue | null>(null);

// no response (offline, timeout, server down) or a 5xx: worth retrying
const shouldQueue = (e: any) => !e.response || e.response.status >= 500;

export function OutboxProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isOnline = useNetwork();
  const [pending, setPending] = useState<OutboxItem[]>([]);
  const flushing = useRef(false); // stops two syncs from running at once and sending duplicates

  const refresh = useCallback(async () => {
    const all = await listOutbox();
    setPending(user ? all.filter((i) => i.userId === user.id) : []);
  }, [user?.id]);

  const flush = useCallback(async () => {
    if (flushing.current || !user) return;
    flushing.current = true;
    try {
      const items = (await listOutbox()).filter((i) => i.userId === user.id && !i.error);
      for (const item of items) {
        try {
          await postBus(item.name, item.description, item.images);
          await removeFromOutbox(item.localId);
        } catch (e: any) {
          if (shouldQueue(e)) break; // still unreachable: stop, the next trigger retries
          // rejected for good: keep it, but mark it so the user can see why
          await updateOutbox({ ...item, error: e.response?.data?.error ?? "Rejected by the server" });
        }
      }
    } finally {
      flushing.current = false;
      await refresh();
    }
  }, [user?.id, refresh]);

  useEffect(() => {
    refresh();
    if (isOnline && user) flush();
  }, [isOnline, user?.id]);

  const submitBus = async (input: NewBusInput): Promise<"sent" | "queued"> => {
    if (!user) throw new Error("Not logged in");

    if (isOnline) {
      try {
        await postBus(input.name, input.description, input.images);
        return "sent";
      } catch (e: any) {
        if (!shouldQueue(e)) throw e; // validation errors go back to the form
      }
    }

    await addToOutbox({
      ...input,
      localId: crypto.randomUUID(),
      userId: user.id,
      createdAt: Date.now(),
    });
    await refresh();
    return "queued";
  };

  const discard = async (localId: string) => {
    await removeFromOutbox(localId);
    await refresh();
  };

  return (
    <OutboxContext.Provider value={{ pending, submitBus, discard }}>{children}</OutboxContext.Provider>
  );
}

export function useOutbox() {
  const ctx = useContext(OutboxContext);
  if (!ctx) throw new Error("useOutbox must be used inside <OutboxProvider>");
  return ctx;
}