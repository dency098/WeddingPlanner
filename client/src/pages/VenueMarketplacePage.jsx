import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import VenueImage from '../components/VenueImage';
import { CompareButton } from '../components/ComparisonControls';
import { searchVenues } from '../services/venueService';

const venueTypes = ['', 'Banquet Hall', 'Wedding Lawn', 'Resort', 'Hotel', 'Farmhouse', 'Community Hall'];
const facilities = ['AC', 'Parking', 'Rooms', 'Catering', 'Kitchen', 'Decoration Allowed', 'DJ Allowed', 'Bridal Room', 'Groom Room', 'Power Backup'];

const formatPrice = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

export default function VenueMarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    venueType: searchParams.get('venueType') || '',
    minGuests: searchParams.get('minGuests') || '',
    maxGuests: searchParams.get('maxGuests') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    date: searchParams.get('date') || '',
    facilities: searchParams.get('facilities') ? searchParams.get('facilities').split(',') : [],
  });
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    searchVenues(Object.fromEntries(searchParams.entries()))
      .then((result) => {
        if (active) setVenues(result);
      })
      .catch((apiError) => {
        if (active) setError(apiError.response?.data?.message || 'We could not load venues. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [searchParams, retryCount]);

  const change = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submitSearch = (event) => {
    event.preventDefault();
    const params = Object.fromEntries(
      Object.entries(filters)
        .filter(([, value]) => Array.isArray(value) ? value.length > 0 : Boolean(value))
        .map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : value])
    );
    setLoading(true);
    setError('');
    setSearchParams(params);
  };

  const toggleFacility = (facility) => {
    setFilters((current) => ({
      ...current,
      facilities: current.facilities.includes(facility)
        ? current.facilities.filter((item) => item !== facility)
        : [...current.facilities, facility],
    }));
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      venueType: '',
      minGuests: '',
      maxGuests: '',
      minPrice: '',
      maxPrice: '',
      date: '',
      facilities: [],
    });
    setLoading(true);
    setError('');
    setSearchParams({});
  };

  return (
    <main className="marketplace-page">
      <header className="venue-public-header marketplace-navbar">
        <Link to="/" className="brand-mark">
          <span className="brand-icon">W</span>
          <span>Wedding Planner</span>
        </Link>
        <nav aria-label="Venue navigation">
          <Link to="/">Home</Link>
          <Link className="selected" to="/venues">Wedding Venues</Link>
        </nav>
        <Link className="venue-header-cta" to="/login">Log in</Link>
      </header>

      <section className="marketplace-intro">
        <span className="marketplace-intro-kicker">Curated wedding spaces</span>
        <p className="eyebrow">A place for your celebration</p>
        <h1>Find a venue that feels like yours.</h1>
        <p>Thoughtful spaces, clear details, and a little more confidence in every decision.</p>
        <div className="marketplace-trust-row" aria-label="Marketplace benefits">
          <span>Verified venue listings</span>
          <span>Live availability checks</span>
          <span>Direct vendor enquiries</span>
        </div>
      </section>

      <form className="venue-filter-bar card shadow-sm" onSubmit={submitSearch}>
        <label>
          City
          <input className="form-control" name="city" value={filters.city} onChange={change} placeholder="Try Surat" />
        </label>
        <label>
          Venue type
          <select className="form-select" name="venueType" value={filters.venueType} onChange={change}>
            {venueTypes.map((type) => <option key={type} value={type}>{type || 'All types'}</option>)}
          </select>
        </label>
        <label>
          Minimum guests
          <input className="form-control" name="minGuests" type="number" min="1" value={filters.minGuests} onChange={change} placeholder="Any" />
        </label>
        <label>
          Maximum guests
          <input className="form-control" name="maxGuests" type="number" min="1" value={filters.maxGuests} onChange={change} placeholder="Any" />
        </label>
        <label>
          Min price
          <input className="form-control" name="minPrice" type="number" min="0" value={filters.minPrice} onChange={change} placeholder="Any" />
        </label>
        <label>
          Max price
          <input className="form-control" name="maxPrice" type="number" min="0" value={filters.maxPrice} onChange={change} placeholder="Any" />
        </label>
        <label>
          Available on
          <input className="form-control" name="date" type="date" value={filters.date} onChange={change} />
        </label>
        <details className="filter-facilities">
          <summary>Facilities{filters.facilities.length ? ` · ${filters.facilities.length} selected` : ''}</summary>
          <div>
            {facilities.map((facility) => (
              <label key={facility}>
                <input className="form-check-input" type="checkbox" checked={filters.facilities.includes(facility)} onChange={() => toggleFacility(facility)} />
                {facility}
              </label>
            ))}
          </div>
        </details>
        <button className="primary-button btn btn-primary" type="submit">Search venues</button>
        {searchParams.size > 0 && (
          <button className="marketplace-clear-filters btn btn-link" type="button" onClick={clearFilters}>Clear filters</button>
        )}
      </form>

      <section className="venue-results" aria-live="polite">
        <div className="venue-results-heading">
          <div>
            <p className="eyebrow">Explore the collection</p>
            <h2>{loading ? 'Finding your venue…' : `${venues.length} ${venues.length === 1 ? 'venue' : 'venues'} to discover`}</h2>
          </div>
          <span>{loading ? 'Checking current listings…' : 'Approved venues · Live listings'}</span>
        </div>

        {loading && (
          <div className="venue-state d-flex flex-column align-items-center gap-3" role="status" aria-live="polite">
            <span className="spinner-border text-primary" aria-hidden="true"></span>
            <span>Finding spaces for your celebration…</span>
          </div>
        )}
        {!loading && error && (
          <div className="venue-state venue-state-error" role="alert">
            <h3>We couldn’t load the venues.</h3>
            <p>{error}</p>
            <button type="button" className="btn btn-outline-primary mt-3" onClick={() => {
              setLoading(true);
              setRetryCount((count) => count + 1);
            }}>Try again</button>
          </div>
        )}
        {!loading && !error && venues.length === 0 && (
          <div className="venue-state">
            <h3>No wedding venues found.</h3>
            <p>Try another city, date, guest count, or price range.</p>
            {searchParams.size > 0 && <button type="button" className="btn btn-outline-primary mt-3" onClick={clearFilters}>Clear filters</button>}
          </div>
        )}

        {!loading && !error && venues.length > 0 && (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-4">
            {venues.map((venue) => (
              <div className="col" key={venue._id}>
              <article className="market-venue-card card h-100">
                <Link to={`/venues/${venue._id}`} className="market-venue-image-link" aria-label={`View ${venue.venueName}`}>
                  <VenueImage className="market-venue-image" src={venue.coverImage} alt={`${venue.venueName} wedding venue`} />
                  <span className="venue-type-badge">{venue.venueType}</span>
                </Link>
                <div className="market-venue-info">
                  <div className="market-venue-title-row">
                    <div>
                      <p className="venue-location">{venue.city}, {venue.state}</p>
                      <h3>{venue.venueName}</h3>
                    </div>
                    <div className="venue-price">
                      <strong>{formatPrice(venue.startingPrice)}</strong>
                      <span>{venue.priceType}</span>
                    </div>
                  </div>
                  <p className="venue-capacity">{venue.minimumGuests}–{Math.min(venue.maximumGuests, venue.seatingCapacity)} guests</p>
                  <div className="venue-facility-tags">
                    {(venue.facilities || []).slice(0, 3).map((facility) => <span key={facility}>{facility}</span>)}
                    {(venue.facilities || []).length > 3 && <span>+{venue.facilities.length - 3}</span>}
                  </div>
                  <CompareButton venueId={venue._id} />
                  <Link className="venue-card-link" to={`/venues/${venue._id}`}>View details <span aria-hidden="true">→</span></Link>
                </div>
              </article>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
