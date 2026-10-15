import './ExploreContainer.css';
import BusPostPreview from './BusPostPreview';
import { useEffect, useState } from 'react';
import { fetchBuses } from '../api/busApi';
import BusObject  from '../domain/BusObject'
import { useBusSocket } from '../api/useBusSocket';

interface ContainerProps { }

const ExploreContainer: React.FC<ContainerProps> = () => {
  const [buses, setBuses] = useState<BusObject[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBuses().then(setBuses).catch((e) => setError(e));
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
