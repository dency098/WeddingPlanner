import { useEffect, useState } from 'react';
import '../styles/DecoratorEnquiries.css';
import { Link } from 'react-router-dom';
import { getUserDecoratorEnquiries } from '../services/decoratorEnquiryService';
import { getUserVenueEnquiries } from '../services/venueEnquiryService';
import { getUserCateringInquiries } from '../services/cateringInquiryService';

const dateLabel = (value) => new Date(value).toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export default function UserDecoratorEnquiriesPage() {
  const [activeTab, setActiveTab] = useState('decorator'); // 'decorator', 'venue', 'catering'

  const [decoratorEnquiries, setDecoratorEnquiries] = useState([]);
  const [venueEnquiries, setVenueEnquiries] = useState([]);
  const [cateringEnquiries, setCateringEnquiries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getUserDecoratorEnquiries().catch(() => []),
      getUserVenueEnquiries().catch(() => []),
      getUserCateringInquiries().catch(() => []),
    ])
      .then(([decData, venData, catData]) => {
        if (active) {
          setDecoratorEnquiries(decData || []);
          setVenueEnquiries(venData || []);
          setCateringEnquiries(catData || []);
        }
      })
      .catch((apiError) => {
        if (active) setError(apiError.response?.data?.message || 'Could not load your enquiries.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="venue-management-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px' }}>
      <header className="venue-management-heading">
        <div>
          <p className="eyebrow">User Dashboard</p>
          <h1>My Service Enquiries</h1>
          <p>Track vendor responses and custom quotations for all your wedding services.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link className="secondary-button" to="/venues">Explore Venues</Link>
          <Link className="secondary-button" to="/catering">Explore Catering</Link>
          <Link className="primary-button" to="/decorators">Explore Decorators</Link>
        </div>
      </header>

      {/* ENQUIRY CATEGORY TABS */}
      <div className="admin-filter-tabs" role="tablist" style={{ marginBottom: '25px', display: 'flex', gap: '10px' }}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'decorator'}
          className={activeTab === 'decorator' ? 'active' : ''}
          onClick={() => setActiveTab('decorator')}
          style={{ padding: '8px 18px', borderRadius: '20px', fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' }}
        >
          Wedding Decorators ({decoratorEnquiries.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'venue'}
          className={activeTab === 'venue' ? 'active' : ''}
          onClick={() => setActiveTab('venue')}
          style={{ padding: '8px 18px', borderRadius: '20px', fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' }}
        >
          Venue Enquiries ({venueEnquiries.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'catering'}
          className={activeTab === 'catering' ? 'active' : ''}
          onClick={() => setActiveTab('catering')}
          style={{ padding: '8px 18px', borderRadius: '20px', fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' }}
        >
          Catering Enquiries ({cateringEnquiries.length})
        </button>
      </div>

      {error && <div className="venue-alert error" role="alert">{error}</div>}
      {loading && <div className="venue-state">Loading your enquiries…</div>}

      {/* DECORATOR ENQUIRIES TAB */}
      {!loading && activeTab === 'decorator' && (
        <>
          {decoratorEnquiries.length === 0 ? (
            <div className="venue-state">
              <h2>No decorator enquiries sent yet.</h2>
              <p>Browse approved wedding decorators and send requirements.</p>
              <Link className="primary-button" to="/decorators">Find Decorators</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {decoratorEnquiries.map((enquiry) => (
                <article
                  key={enquiry._id}
                  className="user-decorator-enquiry-card"
                  style={{
                    background: '#fff',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
                        WEDDING DECORATOR
                      </span>
                      <h2 style={{ fontSize: '1.25rem', margin: '4px 0 6px', color: '#0f172a' }}>
                        {enquiry.decorator?.businessName || 'Decorator Service'}
                      </h2>
                      <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
                        {(enquiry.eventSchedule?.length || 1)} function{(enquiry.eventSchedule?.length || 1) === 1 ? '' : 's'} · {enquiry.city}
                      </p>
                    </div>

                    <div className="user-decorator-event-list">
                      {(enquiry.eventSchedule?.length ? enquiry.eventSchedule : [{
                        eventType: enquiry.eventType,
                        eventDate: enquiry.eventDate,
                        guestCount: enquiry.guestCount,
                        decorationsRequired: enquiry.decorationsRequired,
                        style: enquiry.style,
                        budget: enquiry.budget,
                      }]).map((event, index) => (
                        <div className="user-decorator-event" key={`${event.eventDate}-${index}`}>
                          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                            <strong>{event.eventType}</strong>
                            <span>{dateLabel(event.eventDate)}</span>
                          </div>
                          <div className="small text-muted mt-1">
                            {event.guestCount} guests
                            {(event.startTime || event.endTime) && ` · ${event.startTime || '—'}${event.endTime ? `–${event.endTime}` : ''}`}
                          </div>
                          {event.decorationsRequired?.length > 0 && (
                            <div className="small mt-2"><strong>Decor:</strong> {event.decorationsRequired.join(', ')}</div>
                          )}
                          {event.style && <div className="small"><strong>Style:</strong> {event.style}</div>}
                          {event.notes && <div className="small text-muted mt-1">{event.notes}</div>}
                        </div>
                      ))}
                    </div>

                    <span
                      className={`booking-status ${enquiry.status === 'responded' ? 'accepted' : enquiry.status}`}
                      style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}
                    >
                      {enquiry.status === 'responded' ? 'Vendor Responded' : enquiry.status}
                    </span>
                  </div>

                  {enquiry.status === 'responded' && enquiry.response && (
                    <div style={{ marginTop: '15px', padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#166534' }}>
                        Vendor Status: {enquiry.response.availabilityStatus === 'available' ? '✓ Available' : enquiry.response.availabilityStatus === 'not_available' ? '✗ Not Available' : 'Need More Details'}
                      </p>
                      {enquiry.response.estimatedPrice > 0 && (
                        <p style={{ margin: '0 0 6px', color: '#15803d', fontWeight: 700 }}>
                          Estimated Quote: ₹{Number(enquiry.response.estimatedPrice).toLocaleString('en-IN')}
                        </p>
                      )}
                      {enquiry.response.vendorMessage && (
                        <p style={{ margin: 0, color: '#166534', fontSize: '0.9rem' }}>
                          "{enquiry.response.vendorMessage}"
                        </p>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setSelectedEnquiry({ type: 'decorator', data: enquiry })}
                    >
                      View Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* VENUE ENQUIRIES TAB */}
      {!loading && activeTab === 'venue' && (
        <>
          {venueEnquiries.length === 0 ? (
            <div className="venue-state">
              <h2>No venue enquiries sent yet.</h2>
              <p>Explore wedding venues and send requirement enquiries.</p>
              <Link className="primary-button" to="/venues">Find Venues</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {venueEnquiries.map((enquiry) => (
                <article
                  key={enquiry._id}
                  style={{
                    background: '#fff',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                        VENUE ENQUIRY
                      </span>
                      <h2 style={{ fontSize: '1.25rem', margin: '4px 0 6px', color: '#0f172a' }}>
                        {enquiry.venue?.venueName || enquiry.venueName || 'Venue Partner'}
                      </h2>
                      <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
                        {enquiry.eventType} · {new Date(enquiry.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {enquiry.city} · {enquiry.guestCount} Guests
                      </p>
                    </div>

                    <span
                      className={`booking-status ${enquiry.status === 'responded' ? 'accepted' : enquiry.status}`}
                      style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}
                    >
                      {enquiry.status === 'responded' ? 'Vendor Responded' : enquiry.status}
                    </span>
                  </div>

                  {enquiry.status === 'responded' && enquiry.response && (
                    <div style={{ marginTop: '15px', padding: '14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#1e40af' }}>
                        Vendor Status: {enquiry.response.availabilityStatus === 'available' ? '✓ Available' : enquiry.response.availabilityStatus === 'not_available' ? '✗ Not Available' : 'Need More Details'}
                      </p>
                      {enquiry.response.estimatedPrice > 0 && (
                        <p style={{ margin: '0 0 6px', color: '#1d4ed8', fontWeight: 700 }}>
                          Estimated Quote: ₹{Number(enquiry.response.estimatedPrice).toLocaleString('en-IN')}
                        </p>
                      )}
                      {enquiry.response.vendorMessage && (
                        <p style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem' }}>
                          "{enquiry.response.vendorMessage}"
                        </p>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setSelectedEnquiry({ type: 'venue', data: enquiry })}
                    >
                      View Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* CATERING ENQUIRIES TAB */}
      {!loading && activeTab === 'catering' && (
        <>
          {cateringEnquiries.length === 0 ? (
            <div className="venue-state">
              <h2>No catering enquiries sent yet.</h2>
              <p>Explore wedding catering services and request menu quotes.</p>
              <Link className="primary-button" to="/catering">Find Caterers</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {cateringEnquiries.map((enquiry) => (
                <article
                  key={enquiry._id}
                  style={{
                    background: '#fff',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                        CATERING ENQUIRY
                      </span>
                      <h2 style={{ fontSize: '1.25rem', margin: '4px 0 6px', color: '#0f172a' }}>
                        {enquiry.catering?.companyName || 'Catering Partner'}
                      </h2>
                      <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
                        {enquiry.eventType} · {new Date(enquiry.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {enquiry.city} · {enquiry.guestCount || enquiry.totalGuestCount} Guests
                      </p>
                    </div>

                    <span
                      className={`booking-status ${enquiry.status === 'responded' ? 'accepted' : enquiry.status}`}
                      style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}
                    >
                      {enquiry.status === 'responded' ? 'Vendor Responded' : enquiry.status}
                    </span>
                  </div>

                  {enquiry.response && (
                    <div style={{ marginTop: '15px', padding: '14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#047857' }}>
                        Vendor Status: {enquiry.response.availabilityStatus === 'available' ? '✓ Available' : enquiry.response.availabilityStatus === 'not_available' ? '✗ Not Available' : 'Need More Details'}
                      </p>
                      {enquiry.response.estimatedPrice > 0 && (
                        <p style={{ margin: '0 0 6px', color: '#047857', fontWeight: 700 }}>
                          Estimated Quote: ₹{Number(enquiry.response.estimatedPrice).toLocaleString('en-IN')}
                        </p>
                      )}
                      {enquiry.response.message && (
                        <p style={{ margin: 0, color: '#047857', fontSize: '0.9rem' }}>
                          "{enquiry.response.message}"
                        </p>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setSelectedEnquiry({ type: 'catering', data: enquiry })}
                    >
                      View Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* DETAIL MODAL */}
      {selectedEnquiry && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '10px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Enquiry Details ({selectedEnquiry.type.toUpperCase()})</h3>
            
            {selectedEnquiry.type === 'decorator' && (
              <>
                <p><strong>Decorator:</strong> {selectedEnquiry.data.decorator?.businessName}</p>
                <p><strong>Events:</strong></p>
                <div className="user-decorator-detail-schedule">
                  {(selectedEnquiry.data.eventSchedule?.length ? selectedEnquiry.data.eventSchedule : [{
                    eventType: selectedEnquiry.data.eventType,
                    eventDate: selectedEnquiry.data.eventDate,
                    guestCount: selectedEnquiry.data.guestCount,
                    startTime: '',
                    endTime: '',
                    decorationsRequired: selectedEnquiry.data.decorationsRequired,
                    style: selectedEnquiry.data.style,
                    notes: '',
                  }]).map((event, index) => (
                    <div className="user-decorator-event" key={`${event.eventDate}-${index}`}>
                      <strong>{event.eventType}</strong> · {dateLabel(event.eventDate)} · {event.guestCount} guests
                      {(event.startTime || event.endTime) && <div>Time: {event.startTime || '—'}{event.endTime ? `–${event.endTime}` : ''}</div>}
                      {event.decorationsRequired?.length > 0 && <div>Decor: {event.decorationsRequired.join(', ')}</div>}
                      {event.style && <div>Style: {event.style}</div>}
                      {event.notes && <div>Notes: {event.notes}</div>}
                    </div>
                  ))}
                </div>
                <p><strong>Location:</strong> {selectedEnquiry.data.city} ({selectedEnquiry.data.venueName || 'Venue TBD'})</p>
                <p><strong>Decor Required:</strong> {(selectedEnquiry.data.decorationsRequired || []).join(', ')}</p>
                <p><strong>Style:</strong> {selectedEnquiry.data.style || 'Standard'}</p>
                <p><strong>Budget:</strong> {selectedEnquiry.data.budget}</p>
                <p><strong>Message:</strong> {selectedEnquiry.data.message || 'None'}</p>
              </>
            )}

            {selectedEnquiry.type === 'venue' && (
              <>
                <p><strong>Venue:</strong> {selectedEnquiry.data.venue?.venueName || selectedEnquiry.data.venueName}</p>
                <p><strong>Event:</strong> {selectedEnquiry.data.eventType} on {new Date(selectedEnquiry.data.eventDate).toLocaleDateString()}</p>
                <p><strong>Location:</strong> {selectedEnquiry.data.city}</p>
                <p><strong>Guest Count:</strong> {selectedEnquiry.data.guestCount}</p>
                <p><strong>Venue Type:</strong> {selectedEnquiry.data.preferredVenueType || 'Any'}</p>
                <p><strong>Budget:</strong> {selectedEnquiry.data.budget}</p>
                <p><strong>Rooms Required:</strong> {selectedEnquiry.data.numberOfRooms || 0}</p>
                <p><strong>Message:</strong> {selectedEnquiry.data.message || 'None'}</p>
              </>
            )}

            {selectedEnquiry.type === 'catering' && (
              <>
                <p><strong>Caterer:</strong> {selectedEnquiry.data.catering?.companyName}</p>
                <p><strong>Event:</strong> {selectedEnquiry.data.eventType} on {new Date(selectedEnquiry.data.eventDate).toLocaleDateString()}</p>
                <p><strong>Location:</strong> {selectedEnquiry.data.city} ({selectedEnquiry.data.venueName || 'Venue TBD'})</p>
                <p><strong>Guest Count:</strong> {selectedEnquiry.data.guestCount || selectedEnquiry.data.totalGuestCount}</p>
                <p><strong>Food Preference:</strong> {selectedEnquiry.data.foodPreference}</p>
                {selectedEnquiry.data.cuisines?.length > 0 && <p><strong>Cuisines:</strong> {selectedEnquiry.data.cuisines.join(', ')}</p>}
                {selectedEnquiry.data.mealTypes?.length > 0 && <p><strong>Meal Types:</strong> {selectedEnquiry.data.mealTypes.join(', ')}</p>}
                {selectedEnquiry.data.liveCounters?.length > 0 && <p><strong>Live Counters:</strong> {selectedEnquiry.data.liveCounters.join(', ')}</p>}
                {selectedEnquiry.data.selectedPackage && <p><strong>Package:</strong> {selectedEnquiry.data.selectedPackage}</p>}
                <p><strong>Message:</strong> {selectedEnquiry.data.message || 'None'}</p>
              </>
            )}

            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <button type="button" className="secondary-button" onClick={() => setSelectedEnquiry(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
