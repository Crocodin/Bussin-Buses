import { useEffect, useRef, useState } from "react";
import { IonButton, IonDatetime, IonInfiniteScroll, IonInfiniteScrollContent, IonInput, IonModal } from "@ionic/react";
import UserObject from "../domain/UserObject";
import { BusFilter, BusObject } from "../domain/BusObject";
import { fetchBuses } from "../api/busApi";
import { useBusSocket } from "../api/useBusSocket";
import BusPostPreview from "./BusPostPreview";
import "./ExploreContainer.css";
import { useOutbox } from "../network/OutboxContext";

const PAGE_SIZE = 20;

interface ContainerProps {
  user?: UserObject | null;
}

// "2026-10-25" -> ISO timestamp of the start of the NEXT day, so the picked day is included
function endOfDayIso(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d + 1).toISOString();
}

const ExploreContainer: React.FC<ContainerProps> = ({ user = null }) => {
  const [buses, setBuses] = useState<BusObject[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { pending } = useOutbox();

  const [filterParams, setFilterParams] = useState<BusFilter>({});
  const [searchText, setSearchText] = useState("");
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const requestId = useRef(0); // lets us ignore responses that arrive late

  const applySearch = (text: string) =>
    setFilterParams((prev) => {
      const search = text.trim() || undefined;
      return prev.search === search ? prev : { ...prev, search }; // same value: no refetch
    });

  const applyDay = (day: string | null) => {
    setPickedDay(day);
    setFilterParams((prev) => ({ ...prev, before: day ? endOfDayIso(day) : undefined }));
  };

  const clearFilters = () => {
    setSearchText("");
    applyDay(null);
    setFilterParams({});
  };

  // wait 300 ms after the last keystroke before changing the filter
  useEffect(() => {
    const t = window.setTimeout(() => applySearch(searchText), 300);
    return () => window.clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
    const myRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    setHasMore(true);

    if (user) {
      filterParams.id = user.id;
    }

    fetchBuses({ ...filterParams, limit: PAGE_SIZE })
      .then((page) => {
        if (myRequest !== requestId.current) return; // an older request, ignore it
        setBuses(page);
        setHasMore(page.length === PAGE_SIZE);
      })
      .catch((e) => {
        if (myRequest !== requestId.current) return;
        setBuses([]);
        setError(e.message);
      })
      .finally(() => {
        if (myRequest === requestId.current) setLoading(false);
      });
  }, [filterParams, user?.id]);

  const loadMore = async (ev: CustomEvent<void>) => {
    const target = ev.target as HTMLIonInfiniteScrollElement;
    const myRequest = requestId.current;
    const last = buses[buses.length - 1];
    if (user) {
      filterParams.id = user.id;
    }
    try {
      const page = await fetchBuses({ ...filterParams, limit: PAGE_SIZE, beforeId: last?.id });
      if (myRequest !== requestId.current) return; // the filters changed while loading
      setBuses((prev) => {
        const seen = new Set(prev.map((b) => b.id));
        return [...prev, ...page.filter((b) => !seen.has(b.id))];
      });
      setHasMore(page.length === PAGE_SIZE);
    } catch (e: any) {
      setError(e.message);
    } finally {
      target.complete();
    }
  };

  useBusSocket((bus) => {
    if (filterParams.search || filterParams.before) return;
    if (user && bus.user.id !== user.id) return;
    setBuses((prev) => (prev.some((b) => b.id === bus.id) ? prev : [bus, ...prev]));
  });

  const hasFilters = !!(filterParams.search || filterParams.before);

  return (
    <>
      <div className="filter-bar">
        <img src="./../../public/magnifier.png" alt="magnifier image"/>
        <IonInput
          className="filter-search"
          placeholder="Search by bus name"
          value={searchText}
          onIonInput={(e) => setSearchText(String(e.detail.value ?? ""))}
          clearInput
        />
        <IonButton size="small" fill="outline" onClick={() => setShowPicker(true)}>
          {pickedDay ? `Until ${pickedDay}` : "Pick date"}
        </IonButton>
        {hasFilters && (
          <IonButton size="small" fill="clear" onClick={clearFilters}>
            Clear
          </IonButton>
        )}
      </div>

      <IonModal
        isOpen={showPicker}
        onDidDismiss={() => setShowPicker(false)}
        initialBreakpoint={0.6}
        breakpoints={[0, 0.6]}
      >
        <IonDatetime
          presentation="date"
          value={pickedDay ?? undefined}
          max={new Date().toISOString().slice(0, 10)}
          onIonChange={(e) => {
            const v = e.detail.value;
            if (typeof v === "string") {
              applyDay(v.slice(0, 10)); // keep only YYYY-MM-DD
              setShowPicker(false);
            }
          }}
        />
      </IonModal>

      {error && <p className="filter-message">{error}</p>}
      {!loading && !error && buses.length === 0 && <p className="filter-message">No buses found.</p>}

      <div className="post-list">
        {pending.filter((p) => !user || p.userId === user.id).map((p) => (
          <BusPostPreview key={p.localId} previewUrl={URL.createObjectURL(p.images[0])}/>
        ))}
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