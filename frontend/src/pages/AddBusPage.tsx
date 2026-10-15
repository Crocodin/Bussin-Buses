import { useState } from "react";
import { IonContent, IonPage } from "@ionic/react";
import { postBus } from "../api/busApi";

const AddBusPage: React.FC = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState("");

  const handleSubmit = async () => {
    setResult("Uploading...");
    try {
      const bus = await postBus(name, description, files);
      setResult("OK: " + JSON.stringify(bus, null, 2));
    } catch (e: any) {
      setResult("Error: " + (e.response?.status ?? "") + " " + e.message);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <h2>Add bus (test)</h2>

        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <br />
        <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <br />
        <br />

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
        <br />

        {files.map((f) => (
          <img
            key={f.name + f.size}
            src={URL.createObjectURL(f)}
            alt={f.name}
            style={{ width: 80, height: 80, objectFit: "cover", margin: 4 }}
          />
        ))}
        <br />

        <button onClick={handleSubmit}>Upload</button>
        <pre>{result}</pre>
      </IonContent>
    </IonPage>
  );
};

export default AddBusPage;