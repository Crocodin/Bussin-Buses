import './ExploreContainer.css';
import BusPostPreview from './BusPostPreview';
import { useEffect, useState } from 'react';
import { fetchBuses, fetchUserBusses } from '../api/busApi';
import BusObject  from '../domain/BusObject'
import { useBusSocket } from '../api/useBusSocket';
import UserObject from '../domain/UserObject';

interface ContainerProps { 
  user?: UserObject
}

const ExploreContainer: React.FC<ContainerProps> = ({user}) => {
  const [buses, setBuses] = useState<BusObject[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      fetchBuses().then(setBuses).catch((e) => setError(e));
    } else {
      // if the user is specified it means we want to fetch only the post of that one user
      fetchUserBusses(user).then(setBuses).catch((e) => setError(e));
    }
  }, []);

  useBusSocket((bus) =>
    setBuses((prev) => (prev.some((b) => b.id === bus.id) ? prev : [bus, ...prev]))
  );

  if (error) return <p>{error}</p>

  return (
    <div className="post-list">
      {buses.map((bus) => (
        <BusPostPreview busObject={bus} />
      ))}
    </div>
  );
};

export default ExploreContainer;
