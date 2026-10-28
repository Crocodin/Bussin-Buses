import { useIonRouter } from "@ionic/react";
import { BusObject }  from "../domain/BusObject";
import "./BusPostPreview.css";
import { IMAGES_BASE_URL } from "../api/baseApi";

type BusPostPreviewParams = {
  busObject?: BusObject,
  previewUrl?: string,
  localId?: number,
  pendingError?: string
}

const BusPostPreview = ({ busObject, previewUrl, localId, pendingError }: BusPostPreviewParams) => {
  const firstImageUrl = busObject?.imageUrls[0];
  const router = useIonRouter();

  const navigateToPostDetail = () => {
    router.push(`/post/${busObject?.id}`);
  }

  if (previewUrl) return (
    <div key={localId} className="post-preview">
      <img src={previewUrl} className="post-preview-image" />
      <span className="pending-badge">{pendingError ? "Failed" : "Not sent"}</span>
    </div>
  )

  if (busObject) return (
    <div className="post-preview" onClick={navigateToPostDetail}>
      <img src={IMAGES_BASE_URL + firstImageUrl} alt={`Bus ${busObject.id} - Preview`} className="post-preview-image" />
    </div>
  );
};

export default BusPostPreview;