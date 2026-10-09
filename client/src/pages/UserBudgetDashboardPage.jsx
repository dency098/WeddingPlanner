import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserVenueBookings } from '../services/bookingService';
import { getUserCateringInquiries } from '../services/cateringInquiryService';

const formatPrice = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(value || 0);

export default function UserBudgetDashboardPage() {
  const [venueBookings, setVenueBookings] = useState([]);
  const [cateringInquiries, setCateringInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      getUserVenueBookings(),
      getUserCateringInquiries()
    ])
    .then(([venues, caterings]) => {
      if (active) {
        setVenueBookings(venues);
        setCateringInquiries(caterings);
      }
    })
    .catch((err) => {
      if (active) setError('Failed to load budget data.');
    })
    .finally(() => {
      if (active) setLoading(false);
    });
    
    return () => { active = false; };
  }, []);

  if (loading) return <main className="venue-state">Loading budget overview...</main>;
  
  const activeVenues = venueBookings.filter(b => !['cancelled', 'rejected'].includes(b.status));
  const activeCatering = cateringInquiries.filter(c => !['cancelled', 'rejected'].includes(c.status));
  
  const totalVenueEstimate = activeVenues.reduce((acc, curr) => acc + Number(curr.estimatedPrice || (curr.quotation?.estimatedTotal || 0)), 0);
  const totalCateringEstimate = activeCatering.reduce((acc, curr) => acc + Number(curr.quotation?.estimatedTotal || 0), 0);
  
  const totalEstimate = totalVenueEstimate + totalCateringEstimate;

  return (
    <main className="venue-management-page">
      <header className="venue-management-heading">
        <div>
          <p className="eyebrow">Your Wedding</p>
          <h1>Budget & Estimates Hub</h1>
          <p>Track all your vendor quotations in one place.</p>
        </div>
      </header>

      {error && <div className="venue-alert error" role="alert">{error}</div>}

      <section className="stats-grid" style={{ marginBottom: '2rem' }}>
        <article className="stat-card">
          <span>Total Estimated Budget</span>
          <strong>{formatPrice(totalEstimate)}</strong>
        </article>
        <article className="stat-card">
          <span>Venue Costs</span>
          <strong>{formatPrice(totalVenueEstimate)}</strong>
        </article>
        <article className="stat-card">
          <span>Catering Costs</span>
          <strong>{formatPrice(totalCateringEstimate)}</strong>
        </article>
        <article className="stat-card">
          <span>Active Quotations</span>
          <strong>{activeVenues.length + activeCatering.length}</strong>
        </article>
      </section>

      <section className="panel-grid two-columns">
        <div className="panel panel-large">
          <div className="panel-header"><h2>Venue Estimates</h2><Link to="/user/bookings">Manage</Link></div>
          {activeVenues.length === 0 ? (
            <p className="dashboard-empty">No active venue bookings.</p>
          ) : (
            <div className="booking-list">
              {activeVenues.map(booking => (
                <div className="booking-row" key={booking._id}>
                  <div>
                    <strong>{booking.venue?.venueName}</strong>
                    <small>{new Date(booking.eventDate).toLocaleDateString()} · {booking.status.replace('_', ' ')}</small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>{formatPrice(booking.quotation?.estimatedTotal || booking.estimatedPrice)}</strong>
                    {booking.quotation?.advanceAmount && <div style={{ fontSize: '0.8rem', color: '#666' }}>Advance: {formatPrice(booking.quotation.advanceAmount)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel panel-large">
          <div className="panel-header"><h2>Catering Estimates</h2><Link to="/user/catering-bookings">Manage</Link></div>
          {activeCatering.length === 0 ? (
            <p className="dashboard-empty">No active catering inquiries.</p>
          ) : (
            <div className="booking-list">
              {activeCatering.map(inq => (
                <div className="booking-row" key={inq._id}>
                  <div>
                    <strong>{inq.catering?.companyName}</strong>
                    <small>For {inq.venue?.venueName} · {inq.status.replace('_', ' ')}</small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>{formatPrice(inq.quotation?.estimatedTotal || 0)}</strong>
                    {!inq.quotation && <div style={{ fontSize: '0.8rem', color: '#666' }}>Pending Quote</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
