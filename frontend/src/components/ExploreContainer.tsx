import './ExploreContainer.css';
import BusPostPreview from './BusPostPreview';
import { useEffect, useState } from 'react';
import { fetchBuses } from '../api/busApi';
import BusObject  from '../domain/BusObject'
import { useBusSocket } from '../api/useBusSocket';
import UserObject from '../domain/UserObject';
import { IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/react';

interface ContainerProps { 
  user?: UserObject
}

const ExploreContainer: React.FC<ContainerProps> = ({user}) => {
  const PAGE_SIZE = 3 * 7;

  const [buses, setBuses] = useState<BusObject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async (ev: CustomEvent<void>) => {
    const last = buses[buses.length - 1];
    try {
      if (!user) {
        const page = await fetchBuses({ limit: PAGE_SIZE, beforeId: last?.id });
        setBuses((prev) => {
          const seen = new Set(prev.map((b) => b.id));
          return [...prev, ...page.filter((b) => !seen.has(b.id))];
        });
        setHasMore(page.length === PAGE_SIZE);
      } else {
        const page = await fetchBuses({ limit: PAGE_SIZE, beforeId: last?.id, id: user.id })
        setBuses((prev) => {
          const seen = new Set(prev.map((b) => b.id));
          return [...prev, ...page.filter((b) => !seen.has(b.id))];
        });
        setHasMore(page.length === PAGE_SIZE)
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      (ev.target as HTMLIonInfiniteScrollElement).complete(); // tells Ionic the load is done
    }
  };

  useEffect(() => {
    if (!user) {
      fetchBuses({ limit: PAGE_SIZE })
      .then((page) => {
        setBuses(page);
        setHasMore(page.length === PAGE_SIZE);
      }).catch((e) => setError(e.message));
    } else {
      // if the user is specified it means we want to fetch only the post of that one user
      fetchBuses({ limit: PAGE_SIZE, id: user.id }).then((page) => {
        setBuses(page);
        setHasMore(page.length === PAGE_SIZE)
      }).catch((e) => setError(e));
    }
  }, []);

  useBusSocket((bus) =>
    setBuses((prev) => (prev.some((b) => b.id === bus.id) ? prev : [bus, ...prev]))
  );

  if (error) return <p>{error}</p>

  return (
    <>
      <div className="post-list">
        {buses.map((bus) => (
          <BusPostPreview key={bus.id} busObject={bus} />
        ))}
      </div>
      <IonInfiniteScroll onIonInfinite={loadMore} disabled={!hasMore}>
        <IonInfiniteScrollContent loadingText="Loading more buses..." />
      </IonInfiniteScroll>
    </>
  );
};

export default ExploreContainer;
