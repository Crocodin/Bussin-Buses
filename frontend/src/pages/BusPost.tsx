import BusObject from '../domain/BusObject';
import "./BusPost.css";
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import UserObject from '../domain/UserObject';
import { IonContent, IonFooter, IonPage } from '@ionic/react';
import PageFooter from '../components/PageFooter';
import { fetchBus } from '../api/busApi';
import { IMAGES_BASE_URL } from '../api/baseApi';

const BusPost = () => {
  const { id } = useParams<{ id: string }>();
  const [busObject, setBusObject] = useState<BusObject|null>(null)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    if (!id) {
      setBusObject(null);
      setError('Bus ID is missing');
      return;
    }

    fetchBus(id)
      .then(setBusObject)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch bus'));
  }, [id]);

  const user: UserObject | null = busObject?.user || null;
  const [activeIndex, setActiveIndex] = useState(0);
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <IonPage> 
      <IonContent fullscreen>
        {busObject !== null  && (
          <div className="post">
            <div className="post-header">
              { /* this contains the user info */ }
              {user && (
                <>
                  <img src={IMAGES_BASE_URL + user.profilePictureUrl} alt={user.username} className='profile-image'/>
                  <h3>{user.username}</h3>
                </>
              )}
            </div>

            <div className="post-image">
              <div className="image-carousel" onScroll={handleScroll}>
                {busObject.imageUrls.map((url, index) => (
                  <img key={index} src={IMAGES_BASE_URL + url} alt={`Bus ${busObject.id} - Image ${index + 1}`} />
                ))}
              </div>

              {busObject.imageUrls.length > 1 && (
                <div className="carousel-dots">
                  {busObject.imageUrls.map((_, index) => (
                    <span
                      key={index}
                      className={`carousel-dot ${index === activeIndex ? 'active' : ''}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="post-details">
              <h2>{busObject.name}</h2>
              <p>{busObject.description}</p>
              {busObject.timestamp && (
                <p><strong>Posted:</strong> {busObject.timestamp}</p>
              )}
            </div>
            <div className="location-image">
              <img src={busObject.location} alt="Location" />
            </div>
          </div>
        )}
        {busObject === null && (
          <div className="post">
            <h2>Post not found</h2>
          </div>
        )}
      </IonContent>
      <IonFooter>
        <PageFooter loggedInUser={null} />
      </IonFooter>
    </IonPage>
  );
};

export default BusPost;
