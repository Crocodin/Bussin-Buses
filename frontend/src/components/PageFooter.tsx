import { useIonRouter } from "@ionic/react";
import "./PageFooter.css";
import { useAuth } from "../auth/AuthContext";
import { IMAGES_BASE_URL } from "../api/baseApi";
import NetworkStatus from "./NetworkStatus";

const PageFooter = () => {
  const { user } = useAuth()
  const router = useIonRouter();

  return (
    <>
      <NetworkStatus />
      <footer className="page-footer">
        <div className="camera-button">
          <img src="./public/photo-camera.png" alt="photo-camera.png" />
        </div>
        <div className="home-button" onClick={() => router.push('/home')}>
          <img src="./public/home.png" alt="home-button photo"/>
        </div>
        <div className="add-post-button" onClick={() => router.push('/add')}>
          <img src="./public/add_button.png" alt="add-button.png" />
        </div>
        <div className="profile-button" onClick={() => router.push('profile')}>
          {user && user.profilePictureUrl ? (
            <img src={IMAGES_BASE_URL + user.profilePictureUrl} alt="Profile" className="profile-image" />
          ) : (
            <img src="./public/default-profile.png" alt="Default Profile" className="profile-image" />
          )}
        </div>
      </footer>
    </>
  );
};

export default PageFooter;
