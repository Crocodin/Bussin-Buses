import { IonText } from "@ionic/react";
import { useNetwork } from "../network/NetworkContext";
import './NetworkStatus.css'

export default function NetworkStatus() {
  const isOnline = useNetwork();
  if (isOnline) return null;
  return (
    <div className="offline-banner" role="status">
      <IonText>You are offline!</IonText>
    </div>
  );
}