import { IonButton, IonCardContent, IonContent, IonHeader, IonInput, IonItem, IonPage, IonSpinner, IonText, useIonRouter } from "@ionic/react";
import { useEffect, useState } from "react";
import { registerUser } from "../api/authApi";
import { useAuth } from "../auth/AuthContext";
import NetworkStatus from "../components/NetworkStatus";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const router = useIonRouter();
  const { isAuthenticated } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false); // show errors only after the first submit
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const nameInvalid = name.trim().length < 3;
  const emailInvalid = !EMAIL_RE.test(email.trim());
  const passwordInvalid = password.length < 8;

  useEffect(() => {
    if (isAuthenticated) router.push("/home", "root", "replace");
  }, [isAuthenticated]);

  const handleSubmit = async () => {
    setSubmitted(true);
    setErrorMessage("");
    if (nameInvalid || emailInvalid || passwordInvalid) return;

    setLoading(true);
    try {
      await registerUser(name.trim(), email.trim(), password);
    } catch (e: any) {
      setErrorMessage(e.response?.data?.error ?? 'Could not register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) return null;

  return (
    <IonPage>
      <IonHeader>
        <NetworkStatus />
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCardContent>
          <h2>Join Bussin' Buses</h2>

          <IonItem>
            <IonInput
              label="What do you want me to call you?"
              labelPlacement="floating"
              value={name}
              onIonInput={(e) => setName(String(e.detail.value ?? ""))}
              className={submitted && nameInvalid ? "ion-invalid ion-touched" : ""}
              errorText="At least 3 characters"
              autocomplete="username"
            />
          </IonItem>

          <IonItem>
            <IonInput
              label="Do you have email? ;)"
              labelPlacement="floating"
              type="email"
              value={email}
              onIonInput={(e) => setEmail(String(e.detail.value ?? ""))}
              className={submitted && emailInvalid ? "ion-invalid ion-touched" : ""}
              errorText="Invalid email"
              autocomplete="email"
            />
          </IonItem>

          <IonItem>
            <IonInput
              label="What's your safe word? (password)"
              labelPlacement="floating"
              type="password"
              value={password}
              onIonInput={(e) => setPassword(String(e.detail.value ?? ""))}
              className={submitted && passwordInvalid ? "ion-invalid ion-touched" : ""}
              errorText="At least 8 characters"
              autocomplete="new-password"
            />
          </IonItem>

          {errorMessage && (
            <IonText color="danger">
              <p>{errorMessage}</p>
            </IonText>
          )}

          <IonButton expand="block" className="ion-margin-top" onClick={handleSubmit} disabled={loading}>
            {loading ? <IonSpinner name="dots" /> : "Register"}
          </IonButton>

          <IonButton expand="block" fill="clear" routerLink="/login">
            Already have an account? Log in
          </IonButton>
        </IonCardContent>
      </IonContent>
    </IonPage>
  );
}