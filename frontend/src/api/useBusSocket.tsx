import { useEffect, useRef } from "react";
import BusObject from "../domain/BusObject";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws";

export function useBusSocket(onPostAdded: (bus: BusObject) => void) {
  const handlerRef = useRef(onPostAdded);
  handlerRef.current = onPostAdded;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimer: number | undefined;
    let closed = false;

    const connect = () => {
      ws = new WebSocket(WS_URL);
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "post_added") handlerRef.current(msg.data);
      };
      ws.onclose = () => {
        if (!closed) retryTimer = window.setTimeout(connect, 3000); // auto-reconnect
      };
    };

    connect();
    return () => {
      closed = true;
      window.clearTimeout(retryTimer);
      ws?.close();
    };
  }, []);
}