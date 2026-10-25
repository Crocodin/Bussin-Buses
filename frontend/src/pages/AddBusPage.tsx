
import { useEffect, useRef, useState } from "react";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from "@ionic/react";

import {
  addOutline,
  busOutline,
  cameraOutline,
  closeCircle,
  cloudUploadOutline,
  imagesOutline,
  trashOutline,
} from "ionicons/icons";

import { postBus } from "../api/busApi";
import "./AddBusPage.css";
import PageFooter from "../components/PageFooter";

const AddBusPage: React.FC = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    const imageFiles = selectedFiles.filter((file) =>
      file.type.startsWith("image/")
    );

    setFiles((current) => {
      const combined = [...current, ...imageFiles];
      const seen = new Set<string>();

      return combined.filter((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;

        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });

    setResult("");
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setResult("Please enter the bus number or name.");
      setIsSuccess(false);
      return;
    }

    setIsUploading(true);
    setResult("");

    try {
      await postBus(name.trim(), description.trim(), files);

      setResult('Bus added successfully!');
      setIsSuccess(true);

      setName("");
      setDescription("");
      setFiles([]);
    } catch (e: any) {
      setResult("Error: " + (e.response?.status ?? "") + " " + e.message);
      setIsSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="add-bus-content">
        <main className="add-bus-container">
          <div className="add-bus-card">
            <IonCardContent>
              <IonItem className="form-item" lines="none">
                <IonInput
                  placeholder="Can I have your bus number?"
                  value={name}
                  onIonInput={(event) =>
                    setName(String(event.detail.value ?? ""))
                  }
                  name="name-input"
                  autocomplete="off"
                />
              </IonItem>

              <IonItem className="form-item description-item" lines="none">
                <IonTextarea
                  label="Description"
                  labelPlacement="stacked"
                  placeholder="Where did you see it? Any details worth sharing?"
                  value={description}
                  onIonInput={(event) =>
                    setDescription(String(event.detail.value ?? ""))
                  }
                  name="description-input"
                  autoGrow
                  rows={4}
                />
              </IonItem>
            </IonCardContent>
          </div>

          <IonCard className="add-bus-card photos-card">
            <IonCardHeader>
              <IonCardTitle>
                <span className="section-title">Photos</span>
              </IonCardTitle>
              <p className="section-description">
                Add photos of the bus, its exterior, or its interior.
              </p>
            </IonCardHeader>

            <IonCardContent>
              <button
                type="button"
                className="photo-dropzone"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Choose bus photos"
              >
                <span className="dropzone-description">
                  Tap to browse your device
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesSelected}
                name="images-input"
                className="visually-hidden"
                tabIndex={-1}
                aria-hidden="true"
              />

              {files.length > 0 && (
                <div className="photo-list">
                  <div className="photo-list-header">
                    <span>Selected photos</span>
                    <span className="photo-count">{files.length}</span>
                  </div>

                  <div className="photo-grid">
                    {files.map((file, index) => (
                      <div
                        className="photo-preview"
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                        />

                        <button
                          type="button"
                          className="remove-photo"
                          onClick={() => removeFile(index)}
                          aria-label={`Remove ${file.name}`}
                        >
                          <IonIcon icon={closeCircle} />
                        </button>

                        <span className="photo-filename">
                          {file.name}
                        </span>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="add-more-photos"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <IonIcon icon={addOutline} />
                      <span>Add more</span>
                    </button>
                  </div>

                  <IonButton
                    fill="clear"
                    color="medium"
                    size="small"
                    className="clear-photos-button"
                    onClick={() => setFiles([])}
                  >
                    <IonIcon slot="start" icon={trashOutline} />
                    Clear photos
                  </IonButton>
                </div>
              )}
            </IonCardContent>
          </IonCard>

          {result && (
            <div
              className={`upload-message ${
                isSuccess ? "success-message" : "error-message"
              }`}
              role="status"
              aria-live="polite"
            >
              <IonText>
                <pre>{result}</pre>
              </IonText>
            </div>
          )}

          <div className="submit-section">
            <IonButton
              expand="block"
              className="submit-button"
              onClick={handleSubmit}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <IonSpinner name="crescent" slot="start" />
                  Uploading...
                </>
              ) : (
                <>
                  <IonIcon icon={cameraOutline} slot="start" />
                  Add bus
                </>
              )}
            </IonButton>

            <p className="submit-hint">
              Check your details before submitting.
            </p>
          </div>
        </main>


      </IonContent>
      <IonFooter>
        <PageFooter loggedInUser={null} />
      </IonFooter>
    </IonPage>
  );
};

export default AddBusPage;
