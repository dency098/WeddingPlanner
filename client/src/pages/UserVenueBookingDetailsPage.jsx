import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CancelBookingDialog from '../components/CancelBookingDialog';
import VenueImage from '../components/VenueImage';
import {
  cancelVenueBooking,
  getUserVenueBooking,
  respondToVenueBookingQuotation,
  confirmUserVenueVisit
} from '../services/bookingService';

const eventLabels = {
  booking_requested: 'Booking requested',
  quotation_sent: 'Quotation sent',
  quotation_accepted: 'Quotation accepted',
  quotation_rejected: 'Quotation rejected',
  booking_confirmed: 'Booking confirmed',
  accepted: 'Booking accepted',
  rejected: 'Booking rejected',
  cancelled: 'Booking cancelled',
  completed: 'Booking completed',
};

const formatPrice = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(value || 0);

export default function UserVenueBookingDetailsPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getUserVenueBooking(id)
      .then((result) => { if (active) setBooking(result); })
      .catch((apiError) => { if (active) setError(apiError.response?.data?.message || 'Booking details could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const answerQuotation = async (status) => {
    setWorking(true);
    setError('');
    setNotice('');
    try {
      const response = await respondToVenueBookingQuotation(id, status);
      setBooking(response.data.data);
      setNotice(response.data.message);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Your quotation response could not be saved.');
    } finally {
      setWorking(false);
    }
  };

  const cancel = async (reason) => {
    setWorking(true);
    setError('');
    try {
      const response = await cancelVenueBooking(id, reason);
      setBooking(response.data);
      setNotice(response.message);
      setCancelOpen(false);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Booking could not be cancelled.');
    } finally {
      setWorking(false);
    }
  };

  const confirmVisit = async () => {
    setWorking(true);
    setError('');
    setNotice('');
    try {
      const response = await confirmUserVenueVisit(id);
      setBooking(response.data);
      setNotice(response.message);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Visit could not be confirmed.');
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <main className="venue-state">Loading booking details…</main>;
  if (!booking) return <main className="venue-state venue-state-error" role="alert">{error || 'Booking not found.'}<p><Link to="/user/bookings">Back to bookings</Link></p></main>;

  return (
    <main className="venue-management-page">
      <Link className="back-link" to="/user/bookings">← Back to My Venue Bookings</Link>
      {error && <div className="venue-alert error" role="alert">{error}</div>}
      {notice && <div className="venue-alert success" role="status">{notice}</div>}
      <article className="booking-detail-page-card">
        <VenueImage className="booking-detail-hero" src={booking.venue?.coverImage} alt={`${booking.venue?.venueName || 'Venue'} cover`} />
        <div className="booking-detail-body">
          <div className="booking-card-topline"><div><p className="eyebrow">Venue booking</p><h1>{booking.venue?.venueName || 'Venue unavailable'}</h1></div><span className={`booking-status ${booking.status}`}>{booking.status}</span></div>
          <p className="venue-location">{booking.venue?.city}, {booking.venue?.state} · {booking.venue?.venueType}</p>
          <div className="venue-facts-grid booking-facts">
            <div><span>Event date</span><strong>{new Date(booking.eventDate).toLocaleDateString('en-IN', { dateStyle: 'long', timeZone: 'UTC' })}</strong></div>
            <div><span>Guest count</span><strong>{booking.guestCount}</strong></div>
            <div><span>Event type</span><strong>{booking.eventType}</strong></div>
            <div><span>Estimated price</span><strong>₹{Number(booking.estimatedPrice).toLocaleString('en-IN')}</strong></div>
            <div><span>Vendor</span><strong>{booking.vendor?.businessName || booking.vendor?.name || 'Vendor'}</strong></div>
            <div><span>Status</span><strong className="status-capitalize">{booking.status}</strong></div>
          </div>
          <section className="venue-detail-section"><h2>Your message</h2><p>{booking.message || 'No message was added to this request.'}</p></section>
          <section className="venue-detail-section"><h2>Vendor response</h2><p>{booking.vendorResponse || 'The venue has not responded yet.'}</p></section>
          {booking.quotation && (
            <section className="venue-detail-section quotation-detail">
              <div className="booking-card-topline"><h2>Booking quotation</h2><span className={`booking-status ${booking.quotationStatus}`}>{booking.quotationStatus}</span></div>
              <div className="quotation-detail-grid">
                <div><span>Base venue price</span><strong>{formatPrice(booking.quotation.baseVenuePrice)}</strong></div>
                <div><span>Extra charges</span><strong>{formatPrice(booking.quotation.extraCharges)}</strong><small>{booking.quotation.extraChargeDetails || 'No extra charge details'}</small></div>
                <div><span>Estimated total</span><strong>{formatPrice(booking.quotation.estimatedTotal)}</strong></div>
                <div><span>Advance ({booking.quotation.advancePercentage}%)</span><strong>{formatPrice(booking.quotation.advanceAmount)}</strong></div>
                <div><span>Remaining amount</span><strong>{formatPrice(booking.quotation.remainingAmount)}</strong></div>
              </div>
              {booking.quotation.vendorMessage && <blockquote>{booking.quotation.vendorMessage}</blockquote>}
              {booking.quotationStatus === 'sent' && booking.status === 'quotation_sent' && (
                <div className="booking-response-actions">
                  <button className="secondary-button" type="button" disabled={working} onClick={() => answerQuotation('rejected')}>Reject quotation</button>
                  <button className="primary-button" type="button" disabled={working} onClick={() => answerQuotation('accepted')}>{working ? 'Saving…' : 'Accept quotation'}</button>
                </div>
              )}
            </section>
          )}

          {booking.status === 'visit_requested' && booking.visitDate && (
            <section className="venue-detail-section quotation-detail" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div className="booking-card-topline"><h2>Venue Visit Proposed</h2></div>
              <p>The vendor has proposed a venue visit on <strong>{new Date(booking.visitDate).toLocaleString('en-IN')}</strong>.</p>
              <div className="booking-response-actions" style={{ marginTop: '1rem' }}>
                <button className="primary-button" type="button" disabled={working} onClick={confirmVisit}>{working ? 'Confirming…' : 'Confirm Visit'}</button>
              </div>
            </section>
          )}
          {booking.status === 'visit_scheduled' && booking.visitDate && (
             <section className="venue-detail-section quotation-detail" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
                <div className="booking-card-topline"><h2>Venue Visit Scheduled</h2></div>
                <p>You have a confirmed visit scheduled on <strong>{new Date(booking.visitDate).toLocaleString('en-IN')}</strong>.</p>
             </section>
          )}

          {booking.lifecycleEvents?.length > 0 && (
            <section className="venue-detail-section">
              <h2>Booking timeline</h2>
              <ol className="booking-timeline">
                {[...booking.lifecycleEvents].sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt)).map((event, index) => (
                  <li key={`${event.type}-${event.occurredAt}-${index}`}>
                    <span className="timeline-marker" aria-hidden="true" />
                    <div><strong>{eventLabels[event.type] || event.type.replaceAll('_', ' ')}</strong><time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString('en-IN')}</time></div>
                  </li>
                ))}
                <li className="timeline-future"><span className="timeline-marker" aria-hidden="true" /><div><strong>Event date</strong><time dateTime={booking.eventDate}>{new Date(booking.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'UTC' })}</time></div></li>
                {booking.status !== 'completed' && booking.status !== 'cancelled' && <li className="timeline-future"><span className="timeline-marker" aria-hidden="true" /><div><strong>Booking completed</strong></div></li>}
              </ol>
            </section>
          )}
          {booking.cancellationReason && <section className="venue-detail-section"><h2>Cancellation details</h2><p>{booking.cancellationReason}</p></section>}
          {booking.cancelledAt && (
            <section className="venue-detail-section cancellation-record">
              <h2>Cancellation record</h2>
              <p><strong>Cancelled by:</strong> {{ user: 'Customer', vendor: 'Vendor', admin: 'Administrator' }[booking.cancelledBy] || 'Unknown'}</p>
              <p><strong>Reason:</strong> {booking.cancellationReason}</p>
              <p><strong>Cancelled on:</strong> {new Date(booking.cancelledAt).toLocaleString('en-IN')}</p>
            </section>
          )}
          <div className="booking-response-actions" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            {booking.venue?._id && <Link className="secondary-button" to={`/venues/${booking.venue._id}`}>View venue</Link>}
            {booking.venue?._id && <Link className="primary-button" to={`/user/catering-inquiry/new?venueId=${booking.venue._id}`}>Add Catering Service</Link>}
          </div>
          {booking.status === 'completed' && (
            <div className="venue-detail-section" style={{ background: '#fffbeb', borderColor: '#fde68a', padding: '1.5rem', borderRadius: '8px', marginTop: '1.5rem' }}>
              <h2 style={{ color: '#92400e', marginBottom: '0.5rem' }}>Leave a Review</h2>
              <p style={{ color: '#b45309' }}>Your booking is completed. How was your experience with this vendor?</p>
              {/* Note: In a real app this would open a review modal or link to a review page */}
              <button className="primary-button" style={{ marginTop: '1rem' }}>Write a Review</button>
            </div>
          )}
          {['pending', 'quotation_sent', 'accepted', 'confirmed', 'visit_requested', 'visit_scheduled'].includes(booking.status) && (
            <button className="danger-button" type="button" onClick={() => setCancelOpen(true)}>Cancel booking</button>
          )}
        </div>
      </article>
      {cancelOpen && <CancelBookingDialog booking={booking} onClose={() => setCancelOpen(false)} onConfirm={cancel} working={working} requestError={error} />}
    </main>
  );
}
