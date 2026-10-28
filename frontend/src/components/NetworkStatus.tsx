import { useEffect, useState } from "react";
import { health } from "../api/baseApi";
import { IonText } from "@ionic/react";
import './NetworkStatus.css'

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const ok = navigator.onLine && (await health());
      if (!cancelled) setIsOnline(ok);
    };

    check();
    const timer = window.setInterval(check, 5000); // keeps checking, so it recovers when the server returns
    window.addEventListener("online", check);
    window.addEventListener("offline", check);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("online", check);
      window.removeEventListener("offline", check);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="offline-banner" role="status">
      <IonText>You are offline!</IonText>
    </div>
  );
}