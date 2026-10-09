import { useEffect, useState } from 'react';
import { getVendorDecoratorEnquiries, respondDecoratorEnquiry } from '../services/decoratorEnquiryService';
import '../styles/DecoratorEnquiries.css';

const dateLabel = (value) => new Date(value).toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export default function VendorDecoratorEnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Responding state
  const [respondingEnquiry, setRespondingEnquiry] = useState(null);
  const [availabilityStatus, setAvailabilityStatus] = useState('available');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [vendorMessage, setVendorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEnquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getVendorDecoratorEnquiries();
      setEnquiries(data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Could not load received enquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getVendorDecoratorEnquiries()
      .then((data) => {
        if (isMounted) setEnquiries(data);
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.message || 'Could not load received enquiries.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openResponseModal = (enquiry) => {
    setRespondingEnquiry(enquiry);
    setAvailabilityStatus(enquiry.response?.availabilityStatus || 'available');
    setEstimatedPrice(enquiry.response?.estimatedPrice ? String(enquiry.response.estimatedPrice) : '');
    setVendorMessage(enquiry.response?.vendorMessage || '');
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!respondingEnquiry) return;

    setSubmitting(true);
    setError('');
    try {
      await respondDecoratorEnquiry(respondingEnquiry._id, {
        availabilityStatus,
        estimatedPrice: estimatedPrice ? Number(estimatedPrice) : 0,
        vendorMessage: vendorMessage.trim(),
      });
      setRespondingEnquiry(null);
      await fetchEnquiries();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to send response.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="venue-management-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px' }}>
      <header className="venue-management-heading">
        <div>
          <p className="eyebrow">Vendor Workspace</p>
          <h1>Decorator Enquiries</h1>
          <p>Review customer decoration requirements and send price quotes.</p>
        </div>
      </header>

      {error && <div className="venue-alert error" role="alert">{error}</div>}
      {loading && <div className="venue-state">Loading enquiries…</div>}

      {!loading && enquiries.length === 0 && (
        <div className="venue-state">
          <h2>No decoration enquiries received yet.</h2>
          <p>Ensure your decorator service listings are active and approved.</p>
        </div>
      )}

      {!loading && enquiries.length > 0 && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {enquiries.map((enquiry) => (
            <article
              key={enquiry._id}
              className="vendor-decorator-enquiry-card"
              style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div className="vendor-decorator-enquiry-header">
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
                    {enquiry.decorator?.businessName || 'Wedding Decorator'}
                  </span>
                  <h2 style={{ fontSize: '1.3rem', margin: '4px 0 6px', color: '#0f172a' }}>
                    {enquiry.userName} · {enquiry.eventSchedule?.length || 1} function{(enquiry.eventSchedule?.length || 1) === 1 ? '' : 's'}
                  </h2>
                  <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>Location: {enquiry.city} · Customer: {enquiry.userEmail}{enquiry.userPhone ? ` · ${enquiry.userPhone}` : ''}</p>
                </div>

                <section className="vendor-decorator-event-list" aria-label="Requested decoration event schedule">
                  <h3 className="h6 mb-2">Event schedule</h3>
                  <div className="row g-2">
                    {(enquiry.eventSchedule?.length ? enquiry.eventSchedule : [{
                      eventType: enquiry.eventType,
                      eventDate: enquiry.eventDate,
                      guestCount: enquiry.guestCount,
                      decorationsRequired: enquiry.decorationsRequired,
                      style: enquiry.style,
                      budget: enquiry.budget,
                    }]).map((event, index) => (
                      <div className="col-12 col-md-6" key={`${event.eventDate}-${index}`}>
                        <article className="vendor-decorator-event h-100">
                          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                            <strong>{event.eventType}</strong>
                            <span>{dateLabel(event.eventDate)}</span>
                          </div>
                          <div className="small text-muted mt-1">
                            {event.guestCount} guests
                            {(event.startTime || event.endTime) && ` · ${event.startTime || '—'}${event.endTime ? `–${event.endTime}` : ''}`}
                          </div>
                          <p className="small mb-1 mt-2"><strong>Decor:</strong> {event.decorationsRequired?.join(', ') || 'Not specified'}</p>
                          <p className="small mb-1"><strong>Style:</strong> {event.style || 'Standard'}</p>
                          {event.budget && <p className="small mb-1"><strong>Budget:</strong> {event.budget}</p>}
                          {event.notes && <p className="small text-muted mb-0">{event.notes}</p>}
                        </article>
                      </div>
                    ))}
                  </div>
                </section>

                <span className={`booking-status ${enquiry.status === 'responded' ? 'accepted' : enquiry.status}`}>
                  {enquiry.status === 'responded' ? 'Responded' : enquiry.status}
                </span>
              </div>

              {/* DETAILS GRID */}
              <div className="vendor-decorator-enquiry-details">
                <div>
                  <p style={{ margin: '0 0 4px' }}><strong>Customer Contact:</strong> {enquiry.userEmail} {enquiry.userPhone ? `· ${enquiry.userPhone}` : ''}</p>
                  <p style={{ margin: '0 0 4px' }}><strong>Venue:</strong> {enquiry.venueName || 'Not specified'} ({enquiry.venueType || 'General'})</p>
                  <p style={{ margin: 0 }}><strong>Budget Range:</strong> {enquiry.budget}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px' }}><strong>Decor Needed:</strong> {(enquiry.decorationsRequired || []).join(', ')}</p>
                  <p style={{ margin: '0 0 4px' }}><strong>Style:</strong> {enquiry.style || 'Standard'}</p>
                </div>

                {enquiry.message && (
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                    <strong>Message from Customer:</strong>
                    <p style={{ margin: '4px 0 0', color: '#334155' }}>"{enquiry.message}"</p>
                  </div>
                )}
              </div>

              {/* VENDOR RESPONSE SUMMARY */}
              {enquiry.status === 'responded' && enquiry.response && (
                <div style={{ marginTop: '15px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.9rem' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#166534' }}>
                    Your Response: {enquiry.response.availabilityStatus === 'available' ? 'Available' : enquiry.response.availabilityStatus === 'not_available' ? 'Not Available' : 'Need More Details'}
                    {enquiry.response.estimatedPrice > 0 ? ` · Est. Price: ₹${Number(enquiry.response.estimatedPrice).toLocaleString('en-IN')}` : ''}
                  </p>
                  {enquiry.response.vendorMessage && <p style={{ margin: 0, color: '#166534' }}>"{enquiry.response.vendorMessage}"</p>}
                </div>
              )}

              <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => openResponseModal(enquiry)}
                  style={{ background: '#7c3aed' }}
                >
                  {enquiry.status === 'responded' ? 'Update Response' : 'Respond to Enquiry'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* RESPONSE MODAL */}
      {respondingEnquiry && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '10px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Respond to Decoration Enquiry</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '15px' }}>
              Enquiry from {respondingEnquiry.userName} for {respondingEnquiry.eventType} ({new Date(respondingEnquiry.eventDate).toLocaleDateString()})
            </p>

            <form onSubmit={handleSendResponse}>
              <div className="venue-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <label>
                  Availability Status *
                  <select
                    value={availabilityStatus}
                    onChange={(e) => setAvailabilityStatus(e.target.value)}
                    required
                  >
                    <option value="available">Available</option>
                    <option value="not_available">Not Available</option>
                    <option value="need_more_details">Need More Details</option>
                  </select>
                </label>

                <label>
                  Estimated Price Quote (₹)
                  <input
                    type="number"
                    min="0"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(e.target.value)}
                    placeholder="e.g. 85000"
                  />
                </label>

                <label>
                  Message to Customer
                  <textarea
                    rows="4"
                    value={vendorMessage}
                    onChange={(e) => setVendorMessage(e.target.value)}
                    placeholder="We can provide the requested floral mandap, stage and lighting. Final quotation can be prepared after venue inspection."
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="secondary-button" onClick={() => setRespondingEnquiry(null)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={submitting} style={{ background: '#7c3aed' }}>
                  {submitting ? 'Sending…' : 'Send Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
