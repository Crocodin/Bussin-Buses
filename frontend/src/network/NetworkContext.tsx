import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { health } from "../api/baseApi";

const NetworkContext = createContext<boolean>(true);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const ok = navigator.onLine && (await health());
      if (!cancelled) setIsOnline(ok);
    };
    check();
    const timer = window.setInterval(check, 5000);
    window.addEventListener("online", check);
    window.addEventListener("offline", check);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("online", check);
      window.removeEventListener("offline", check);
    };
  }, []);

  return <NetworkContext.Provider value={isOnline}>{children}</NetworkContext.Provider>;
}

export const useNetwork = () => useContext(NetworkContext);