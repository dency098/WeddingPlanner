import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getUserCateringInquiries, updateCateringInquiryStatus, confirmUserCateringTasting } from '../services/cateringInquiryService';

const formatPrice = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(value || 0);

export default function UserCateringBookingDetailsPage() {
  const { id } = useParams();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let active = true;
    getUserCateringInquiries()
      .then((result) => { 
        if (active) {
          const item = result.find(i => i._id === id);
          if (item) setInquiry(item);
          else setError('Inquiry not found.');
        } 
      })
      .catch((apiError) => { if (active) setError(apiError.response?.data?.message || 'Inquiry details could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const respond = async (status, reason = '') => {
    if (status === 'cancelled' && !window.confirm('Are you sure you want to cancel this inquiry?')) return;
    setWorking(true);
    setError('');
    setNotice('');
    try {
      const response = await updateCateringInquiryStatus(id, { status, reason });
      setInquiry(response.data);
      setNotice(response.message);
    } catch (apiError) {
      setError(apiError.response?.data?.message || `Failed to ${status} the inquiry.`);
    } finally {
      setWorking(false);
    }
  };

  const confirmTasting = async () => {
    setWorking(true);
    setError('');
    setNotice('');
    try {
      const response = await confirmUserCateringTasting(id);
      setInquiry(response.data);
      setNotice(response.message);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Tasting could not be confirmed.');
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <main className="venue-state">Loading inquiry details…</main>;
  if (!inquiry) return <main className="venue-state venue-state-error" role="alert">{error}<p><Link to="/user/catering-bookings">Back to catering inquiries</Link></p></main>;

  return (
    <main className="venue-management-page">
      <Link className="back-link" to="/user/catering-bookings">← Back to My Catering Inquiries</Link>
      {error && <div className="venue-alert error" role="alert">{error}</div>}
      {notice && <div className="venue-alert success" role="status">{notice}</div>}
      
      <article className="booking-detail-page-card">
        <div className="booking-detail-body" style={{ width: '100%', borderLeft: 'none' }}>
          <div className="booking-card-topline">
            <div><p className="eyebrow">Catering Inquiry</p><h1>{inquiry.catering?.companyName || 'Catering unavailable'}</h1></div>
            <span className={`booking-status ${inquiry.status}`}>{inquiry.status.replace('_', ' ')}</span>
          </div>
          <p className="venue-location">For Venue: {inquiry.venue?.venueName}</p>
          <div className="venue-facts-grid booking-facts">
            <div><span>Total Guests</span><strong>{inquiry.totalGuestCount}</strong></div>
            <div><span>Events</span><strong>{inquiry.events?.length || 0}</strong></div>
            <div><span>Vendor</span><strong>{inquiry.vendor?.businessName || inquiry.vendor?.name || 'Vendor'}</strong></div>
          </div>

          <section className="venue-detail-section">
            <h2>Event Details</h2>
            {inquiry.events.map((evt, idx) => (
              <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                <p><strong>Date:</strong> {new Date(evt.date).toLocaleDateString()} | <strong>Days:</strong> {evt.dayCount} | <strong>Timings:</strong> {evt.timing}</p>
                <div style={{ marginTop: '0.5rem' }}>
                  {evt.meals.map((meal, mIdx) => (
                    <div key={mIdx} style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>
                      <p><strong>{meal.type}</strong> ({meal.timings})</p>
                      <p><em>Menu:</em> {meal.menuSelection}</p>
                      {meal.customizationRequest && <p><em>Custom request:</em> {meal.customizationRequest}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {inquiry.status === 'tasting_requested' && inquiry.tastingDate && (
            <section className="venue-detail-section quotation-detail" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div className="booking-card-topline"><h2>Tasting Proposed</h2></div>
              <p>The vendor has proposed a tasting session on <strong>{new Date(inquiry.tastingDate).toLocaleString('en-IN')}</strong>.</p>
              <div className="booking-response-actions" style={{ marginTop: '1rem' }}>
                <button className="primary-button" type="button" disabled={working} onClick={confirmTasting}>{working ? 'Confirming…' : 'Confirm Tasting'}</button>
              </div>
            </section>
          )}
          {inquiry.status === 'tasting_scheduled' && inquiry.tastingDate && (
             <section className="venue-detail-section quotation-detail" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
                <div className="booking-card-topline"><h2>Tasting Scheduled</h2></div>
                <p>You have a confirmed tasting scheduled on <strong>{new Date(inquiry.tastingDate).toLocaleString('en-IN')}</strong>.</p>
             </section>
          )}

          {inquiry.quotation && (
            <section className="venue-detail-section quotation-detail">
              <div className="booking-card-topline"><h2>Vendor Quotation</h2></div>
              <div className="quotation-detail-grid">
                <div><span>Base Package</span><strong>{formatPrice(inquiry.quotation.basePackagePrice)}</strong></div>
                <div><span>Custom Charges</span><strong>{formatPrice(inquiry.quotation.customCharges)}</strong><small>{inquiry.quotation.customChargeDetails || 'None'}</small></div>
                <div><span>Discount</span><strong>{formatPrice(inquiry.quotation.discount)}</strong></div>
                <div><span>Estimated Total</span><strong style={{ fontSize: '1.2rem', color: '#16a34a' }}>{formatPrice(inquiry.quotation.estimatedTotal)}</strong></div>
              </div>
              {inquiry.quotation.vendorMessage && <blockquote>{inquiry.quotation.vendorMessage}</blockquote>}
              
              {inquiry.status === 'quotation_sent' && (
                <div className="booking-response-actions" style={{ marginTop: '1.5rem' }}>
                  <button className="secondary-button" type="button" disabled={working} onClick={() => respond('rejected')}>Reject Quote</button>
                  <button className="primary-button" type="button" disabled={working} onClick={() => respond('accepted')}>{working ? 'Saving…' : 'Accept Quote'}</button>
                </div>
              )}
            </section>
          )}

          {inquiry.status === 'cancelled' && <section className="venue-detail-section"><h2>Cancellation</h2><p>Cancelled by: {inquiry.cancelledBy}</p><p>Reason: {inquiry.cancellationReason}</p></section>}
          
          {inquiry.status === 'completed' && (
            <div className="venue-detail-section" style={{ background: '#fffbeb', borderColor: '#fde68a', padding: '1.5rem', borderRadius: '8px', marginTop: '1.5rem' }}>
              <h2 style={{ color: '#92400e', marginBottom: '0.5rem' }}>Leave a Review</h2>
              <p style={{ color: '#b45309' }}>Your inquiry is completed. How was your experience with this vendor?</p>
              <button className="primary-button" style={{ marginTop: '1rem' }}>Write a Review</button>
            </div>
          )}

          {['pending', 'quotation_sent', 'accepted', 'tasting_requested', 'tasting_scheduled'].includes(inquiry.status) && (
            <div style={{ marginTop: '2rem' }}>
              <button className="danger-button" type="button" disabled={working} onClick={() => respond('cancelled', 'User cancelled')}>Cancel Inquiry</button>
            </div>
          )}
        </div>
      </article>
    </main>
  );
}
