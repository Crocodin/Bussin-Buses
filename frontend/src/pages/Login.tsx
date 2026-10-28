import { IonButton, IonCardContent, IonContent, IonHeader, IonInput, IonItem, IonPage, IonSpinner, IonText, useIonRouter } from "@ionic/react";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import NetworkStatus from "../components/NetworkStatus";

export default function Login() {
  const router = useIonRouter();
  const { isAuthenticated, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isAuthenticated) router.push("/home", "root", "replace");
  }, [isAuthenticated]);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setErrorMessage("Enter your email and password.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setErrorMessage(
        e.response?.status === 401
          ? "Wrong email or password."
          : e.response?.data?.error ?? "Could not reach the server."
      );
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) null;

  return (
    <IonPage>
      <IonHeader>
        <NetworkStatus />
      </IonHeader>
      
      <IonContent className="ion-padding">
        <IonCardContent>
          <h2>Welcome back</h2>

          <IonItem>
            <IonInput
              label="Let me check your email!"
              labelPlacement="floating"
              type="email"
              value={email}
              onIonInput={(e) => setEmail(String(e.detail.value ?? ""))}
              autocomplete="email"
            />
          </IonItem>

          <IonItem>
            <IonInput
              label="What's the code word?"
              labelPlacement="floating"
              type="password"
              value={password}
              onIonInput={(e) => setPassword(String(e.detail.value ?? ""))}
              autocomplete="current-password"
            />
          </IonItem>

          {errorMessage && (
            <IonText color="danger">
              <p>{errorMessage}</p>
            </IonText>
          )}

          <IonButton expand="block" className="ion-margin-top" onClick={handleSubmit} disabled={loading}>
            {loading ? <IonSpinner name="dots" /> : "Log in"}
          </IonButton>

          <IonButton expand="block" fill="clear" routerLink="/register">
            No account yet? Register
          </IonButton>
        </IonCardContent>
      </IonContent>
    </IonPage>
  );
}