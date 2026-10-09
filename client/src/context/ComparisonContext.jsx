import { useRef, useState } from 'react';
import { ComparisonContext } from './comparison-context';

const STORAGE_KEY = 'wedding-planner-venue-comparison';
const loadIds = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((id) => typeof id === 'string'))].slice(0, 3)
      : [];
  } catch {
    return [];
  }
};

export function ComparisonProvider({ children }) {
  const [venueIds, setVenueIds] = useState(loadIds);
  const currentIds = useRef(venueIds);

  const persist = (nextIds) => {
    currentIds.current = nextIds;
    setVenueIds(nextIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
    } catch {
      // The current in-memory selection remains usable when browser storage is unavailable.
    }
  };

  const addVenue = (id) => {
    if (currentIds.current.includes(id)) return { added: false, reason: 'already-added' };
    if (currentIds.current.length >= 3) return { added: false, reason: 'limit-reached' };
    persist([...currentIds.current, id]);
    return { added: true };
  };

  const removeVenue = (id) => persist(currentIds.current.filter((venueId) => venueId !== id));
  const clearVenues = () => persist([]);

  const value = { venueIds, addVenue, removeVenue, clearVenues };

  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>;
}
