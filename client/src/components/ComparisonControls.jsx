import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useVenueComparison } from '../context/useVenueComparison';

export function CompareButton({ venueId }) {
  const { venueIds, addVenue, removeVenue } = useVenueComparison();
  const [message, setMessage] = useState('');
  const selected = venueIds.includes(venueId);
  const toggle = () => {
    if (selected) {
      removeVenue(venueId);
      setMessage('');
      return;
    }
    const result = addVenue(venueId);
    setMessage(result.reason === 'limit-reached' ? 'You can compare up to three venues.' : '');
  };

  return (
    <span className="compare-control">
      <button className="compare-toggle" type="button" aria-pressed={selected} onClick={toggle}>
        {selected ? 'Remove from compare' : 'Compare'}
      </button>
      {message && <small role="status">{message}</small>}
    </span>
  );
}

export default function ComparisonTray() {
  const { venueIds, clearVenues } = useVenueComparison();
  if (!venueIds.length) return null;

  return (
    <aside className="comparison-tray" aria-label="Venue comparison selection">
      <div>
        <strong>Compare ({venueIds.length}/3)</strong>
        <span>{venueIds.length === 1 ? 'Add up to two more venues' : 'Selected venues are ready'}</span>
      </div>
      <Link className="primary-button" to="/venues/compare">Compare now</Link>
      <button className="secondary-button" type="button" onClick={clearVenues}>Clear all</button>
    </aside>
  );
}
