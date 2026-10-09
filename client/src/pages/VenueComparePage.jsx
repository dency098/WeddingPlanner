import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VenueImage from '../components/VenueImage';
import { useVenueComparison } from '../context/useVenueComparison';
import { getVenue } from '../services/venueService';

const formatPrice = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(value || 0);

const facilityRows = [
  ['Parking', 'Parking'],
  ['Rooms', 'Rooms'],
  ['Air conditioning', 'AC'],
  ['Catering', 'Catering'],
  ['Kitchen', 'Kitchen'],
  ['Decoration allowed', 'Decoration Allowed'],
  ['DJ allowed', 'DJ Allowed'],
  ['Bridal room', 'Bridal Room'],
  ['Groom room', 'Groom Room'],
  ['Power backup', 'Power Backup'],
];

export default function VenueComparePage() {
  const { venueIds, removeVenue, clearVenues } = useVenueComparison();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      setError('');
      if (venueIds.length === 0) {
        setVenues([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const items = await Promise.all(venueIds.map((id) => getVenue(id)));
        if (active) setVenues(items);
      } catch (apiError) {
        if (active) setError(apiError.response?.data?.message || 'Selected venue details could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; };
  }, [venueIds]);

  const renderValue = (value) => value === undefined || value === null || value === '' ? 'Not listed' : value;

  return (
    <main className="venue-management-page comparison-page">
      <header className="venue-management-heading">
        <div><p className="eyebrow">A clearer way to choose</p><h1>Compare venues</h1><p>Review listed venue details side by side.</p></div>
        <div className="comparison-actions">
          <Link className="secondary-button" to="/venues">Browse venues</Link>
          {venues.length > 0 && <button className="secondary-button" type="button" onClick={clearVenues}>Clear all</button>}
        </div>
      </header>
      {error && <div className="venue-alert error" role="alert">{error}</div>}
      {loading && <div className="venue-state">Loading selected venues…</div>}
      {!loading && venues.length === 0 && !error && (
        <div className="venue-state"><h2>No venues selected</h2><p>Add up to three venues from the marketplace to compare them here.</p><Link className="primary-button" to="/venues">Explore venues</Link></div>
      )}
      {!loading && venues.length > 0 && (
        <div className="comparison-scroll" role="region" aria-label="Venue comparison" tabIndex="0">
          <table className="comparison-table">
            <thead>
              <tr>
                <th scope="col">Venue details</th>
                {venues.map((venue) => (
                  <th scope="col" key={venue._id}>
                    <div className="comparison-venue-heading">
                      <VenueImage src={venue.coverImage} alt={`${venue.venueName} cover`} />
                      <strong>{venue.venueName}</strong>
                      <div>
                        <Link to={`/venues/${venue._id}`}>View details</Link>
                        <button type="button" onClick={() => removeVenue(venue._id)}>Remove</button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Venue type', (venue) => venue.venueType],
                ['Location', (venue) => [venue.location, venue.city, venue.state].filter(Boolean).join(', ')],
                ['Starting price', (venue) => `${formatPrice(venue.startingPrice)} · ${venue.priceType}`],
                ['Minimum guests', (venue) => venue.minimumGuests],
                ['Maximum guests', (venue) => venue.maximumGuests],
                ['Seating capacity', (venue) => venue.seatingCapacity],
                ['Parking capacity', (venue) => venue.parkingCapacity],
              ].map(([label, getValue]) => (
                <tr key={label}><th scope="row">{label}</th>{venues.map((venue) => <td key={venue._id}>{renderValue(getValue(venue))}</td>)}</tr>
              ))}
              {facilityRows.map(([label, facility]) => (
                <tr key={facility}>
                  <th scope="row">{label}</th>
                  {venues.map((venue) => (
                    <td key={venue._id} aria-label={`${label}: ${(venue.facilities || []).includes(facility) ? 'included' : 'not listed'}`}>
                      {(venue.facilities || []).includes(facility) ? '✓' : '✗'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
