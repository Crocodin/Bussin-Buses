import { IonButton, IonText } from "@ionic/react";
import { useNetwork } from "../network/NetworkContext";
import "./PendingBanner.css";
import { useOutbox } from "../network/OutboxContext";

export default function PendingBanner() {
  const { pending, discard } = useOutbox();
  const isOnline = useNetwork();
  if (pending.length === 0) return null;

  const waiting = pending.filter((p) => !p.error);
  const failed = pending.filter((p) => p.error);

  return (
    <div className="pending-banner" role="status">
      {waiting.length > 0 && (
        <IonText>
          {waiting.length} item{waiting.length > 1 ? "s" : ""} not sent yet.{" "}
          {isOnline ? "Sending..." : "They'll be sent when you're back online."}
        </IonText>
      )}
      {failed.map((item) => (
        <div key={item.localId} className="pending-failed">
          <IonText color="danger">"{item.name}" was rejected: {item.error}</IonText>
          <IonButton size="small" fill="clear" onClick={() => discard(item.localId)}>
            Discard
          </IonButton>
        </div>
      ))}
    </div>
  );
}