import { useIonRouter } from "@ionic/react";
import UserObject from "../domain/UserObject"
import "./PageFooter.css";

const PageFooter = ({ loggedInUser } : { loggedInUser: UserObject | null }) => {
  const router = useIonRouter();

  return (
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
      <div className="profile-button">
        {loggedInUser && loggedInUser.profilePictureUrl ? (
          <img src={loggedInUser.profilePictureUrl} alt="Profile" className="profile-image" />
        ) : (
          <img src="./public/default-profile.png" alt="Default Profile" className="profile-image" />
        )}
      </div>
    </footer>
  );
};

export default PageFooter;
