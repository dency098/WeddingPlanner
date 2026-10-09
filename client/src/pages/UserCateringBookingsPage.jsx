import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getUserCateringInquiries } from '../services/cateringInquiryService';

const dateLabel = (value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function UserCateringBookingsPage() {
  const location = useLocation();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice] = useState(location.state?.notice || '');

  useEffect(() => {
    let active = true;
    getUserCateringInquiries()
      .then((result) => { if (active) setInquiries(result); })
      .catch((apiError) => { if (active) setError(apiError.response?.data?.message || 'Could not load your inquiries.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="venue-management-page">
      <header className="venue-management-heading">
        <div><p className="eyebrow">Your plans</p><h1>My Catering Inquiries</h1><p>Check the latest response to every catering request.</p></div>
        <Link className="secondary-button" to="/user/bookings">My Venue Bookings</Link>
      </header>
      {notice && <div className="venue-alert success" role="status">{notice}</div>}
      {error && <div className="venue-alert error" role="alert">{error}</div>}
      {loading && <div className="venue-state">Refreshing your inquiry status…</div>}
      {!loading && !error && inquiries.length === 0 && (
        <div className="venue-state">
          <h2>Your catering plans will appear here.</h2>
          <p>Send a request to a catering service from your venue booking details.</p>
        </div>
      )}
      {!loading && inquiries.length > 0 && (
        <div className="user-booking-list">
          {inquiries.map((inquiry) => (
            <article className="user-booking-card" key={inquiry._id}>
              <div className="user-booking-info" style={{ width: '100%' }}>
                <div className="booking-card-topline">
                  <div><p className="venue-location">Venue: {inquiry.venue?.venueName}</p><h2>{inquiry.catering?.companyName || 'Catering unavailable'}</h2></div>
                  <span className={`booking-status ${inquiry.status}`}>{inquiry.status.replace('_', ' ')}</span>
                </div>
                <div className="booking-detail-chips">
                  <span>{inquiry.events.length} Event(s)</span>
                  <span>{inquiry.totalGuestCount} guests</span>
                  {inquiry.quotation && <span>₹{Number(inquiry.quotation.estimatedTotal).toLocaleString('en-IN')} Est.</span>}
                </div>
                <p className="booking-vendor-line">Vendor: {inquiry.vendor?.businessName || inquiry.vendor?.name || 'Vendor'}</p>
                <Link className="booking-detail-link" to={`/user/catering-bookings/${inquiry._id}`}>View inquiry details</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
