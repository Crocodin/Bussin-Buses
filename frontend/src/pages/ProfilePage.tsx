import { IonContent, IonFooter, IonPage, IonText } from "@ionic/react";
import { useAuth } from "../auth/AuthContext";
import ExploreContainer from "../components/ExploreContainer";
import PageFooter from "../components/PageFooter";
import { IMAGES_BASE_URL } from "../api/baseApi";
import { useRef, useState } from "react";
import { changeProfileImagine } from "../api/userApi";
import "./ProfilePage.css"

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const [result, setResult] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    setIsUploading(true);
    setResult("");
    try {
      const updated = await changeProfileImagine(file);
      updateUser({ ...user, profilePictureUrl: updated.profilePictureUrl });
      setResult("Picture successfully changed!");
      setIsSuccess(true);
    } catch (e: any) {
      setResult("Error: " + (e.response?.data?.error ?? e.message));
      setIsSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  return (
    <IonPage>
      <IonContent>
        <div className="profile-info">
          <img
            src={user.profilePictureUrl ? IMAGES_BASE_URL + user.profilePictureUrl : "/default-profile.png"}
            alt="Profile"
            className="profile-image-big"
          />
          <h1>{user.username}</h1>

          <div className="button-div">
            <div className="button-profile red" onClick={logout}>Logout</div>
            <div
              className="button-profile blue"
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {isUploading ? "Uploading..." : "Change Picture"}
            </div>

            {result && (
              <IonText color={isSuccess ? "success" : "danger"}>
                <p>{result}</p>
              </IonText>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChosen}
              className="visually-hidden"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
        </div>

        <ExploreContainer user={user} />
        
      </IonContent>
      <IonFooter>
        <PageFooter />
      </IonFooter>
    </IonPage>
  );
}