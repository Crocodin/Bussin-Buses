import { useIonRouter } from "@ionic/react";
import { BusObject }  from "../domain/BusObject";
import "./BusPostPreview.css";
import { IMAGES_BASE_URL } from "../api/baseApi";

const BusPostPreview = ({ busObject }: { busObject: BusObject }) => {
  const firstImageUrl = busObject.imageUrls[0];
  const router = useIonRouter();

  const navigateToPostDetail = () => {
    router.push(`/post/${busObject.id}`);
  }

  return (
    <div className="post-preview" onClick={navigateToPostDetail}>
      <img src={IMAGES_BASE_URL + firstImageUrl} alt={`Bus ${busObject.id} - Preview`} className="post-preview-image" />
    </div>
  );
};

export default BusPostPreview;