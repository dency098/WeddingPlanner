import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import VenueImage from '../components/VenueImage';
import { getPublicVendorProfile } from '../services/vendorService';

const formatPrice = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(value || 0);

export default function VendorProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getPublicVendorProfile(id)
      .then((result) => { if (active) setProfile(result); })
      .catch((apiError) => { if (active) setError(apiError.response?.data?.message || 'Vendor profile could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <main className="venue-state">Loading vendor profile…</main>;
  if (error || !profile) return <main className="venue-state venue-state-error" role="alert">{error || 'Vendor profile not found.'}<p><Link to="/venues">Browse venues</Link></p></main>;

  return (
    <main className="venue-management-page vendor-public-profile">
      <Link className="back-link" to="/venues">← Back to venues</Link>
      <section className="vendor-profile-card">
        {profile.profileImage
          ? <img className="vendor-profile-image" src={profile.profileImage} alt={`${profile.businessName} profile`} />
          : <div className="vendor-profile-placeholder" aria-hidden="true">{profile.businessName?.charAt(0) || 'V'}</div>}
        <div>
          <p className="eyebrow">Venue partner</p>
          <h1>{profile.businessName}</h1>
          {profile.businessLocation && <p>{profile.businessLocation}</p>}
          {profile.yearsOfExperience !== null && <p>{profile.yearsOfExperience} {profile.yearsOfExperience === 1 ? 'year' : 'years'} of experience</p>}
          {profile.publicContact && <p>Public contact: <a href={`tel:${profile.publicContact}`}>{profile.publicContact}</a></p>}
          {profile.businessDescription && <p className="vendor-profile-description">{profile.businessDescription}</p>}
          <p>{profile.venueCount} {profile.venueCount === 1 ? 'approved venue' : 'approved venues'}</p>
        </div>
      </section>
      <section className="vendor-profile-venues">
        <div className="venue-results-heading"><div><p className="eyebrow">Current listings</p><h2>Venues by {profile.businessName}</h2></div></div>
        {!profile.venues.length && <div className="venue-state">No approved active venues are currently listed.</div>}
        {profile.venues.length > 0 && (
          <div className="venue-card-grid">
            {profile.venues.map((venue) => (
              <article className="market-venue-card" key={venue._id}>
                <Link to={`/venues/${venue._id}`} className="market-venue-image-link" aria-label={`View ${venue.venueName}`}>
                  <VenueImage className="market-venue-image" src={venue.coverImage} alt={`${venue.venueName} wedding venue`} />
                </Link>
                <div className="market-venue-info">
                  <p className="venue-location">{venue.city}, {venue.state}</p>
                  <h3>{venue.venueName}</h3>
                  <p>{venue.venueType} · {formatPrice(venue.startingPrice)} {venue.priceType}</p>
                  <Link className="venue-card-link" to={`/venues/${venue._id}`}>View venue <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
