import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VenueImage from '../components/VenueImage';
import { getAdminVenues, moderateVenue } from '../services/venueService';

const filters = ['all', 'pending', 'approved', 'rejected', 'disabled'];

export default function AdminVenuesPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [venues, setVenues] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, disabled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState('');

  // Rejection modal state
  const [rejectingVenue, setRejectingVenue] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const refresh = useCallback(async () => {
    const result = await getAdminVenues(statusFilter === 'all' ? '' : statusFilter);
    setVenues(result.data);
    setStats(result.stats);
  }, [statusFilter]);

  useEffect(() => {
    let active = true;
    getAdminVenues(statusFilter === 'all' ? '' : statusFilter)
      .then((result) => { if (active) { setVenues(result.data); setStats(result.stats); } })
      .catch((apiError) => { if (active) setError(apiError.response?.data?.message || 'Could not load venue moderation.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [statusFilter]);

  const handleApprove = async (venue) => {
    setWorking(venue._id);
    setError('');
    try {
      await moderateVenue(venue._id, 'approved');
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Moderation action failed.');
    } finally {
      setWorking('');
    }
  };

  const openRejectModal = (venue) => {
    setRejectingVenue(venue);
    setRejectionReasonInput('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingVenue) return;
    setWorking(rejectingVenue._id);
    setError('');
    try {
      await moderateVenue(rejectingVenue._id, 'rejected', rejectionReasonInput.trim());
      setRejectingVenue(null);
      setRejectionReasonInput('');
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Rejection action failed.');
    } finally {
      setWorking('');
    }
  };

  const handleDisable = async (venue) => {
    setWorking(venue._id);
    setError('');
    try {
      await moderateVenue(venue._id, 'disabled');
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Disable action failed.');
    } finally {
      setWorking('');
    }
  };

  const changeFilter = (filter) => {
    setLoading(true);
    setError('');
    setStatusFilter(filter);
  };

  return (
    <main className="venue-management-page admin-venue-page">
      <header className="venue-management-heading">
        <div><p className="eyebrow">Platform operations</p><h1>Venue Management</h1><p>Review venue listings and maintain a trusted marketplace.</p></div>
        <Link className="secondary-button" to="/admin/bookings">Venue bookings</Link>
      </header>
      <div className="admin-venue-stats">
        {Object.entries(stats).map(([label, value]) => <div key={label}><span>{label}</span><strong>{loading ? '—' : value}</strong></div>)}
      </div>
      <div className="admin-filter-tabs" role="group" aria-label="Filter venues by approval status">
        {filters.map((filter) => <button type="button" className={statusFilter === filter ? 'active' : ''} key={filter} onClick={() => changeFilter(filter)}>{filter[0].toUpperCase() + filter.slice(1)}</button>)}
      </div>
      {error && <div className="venue-alert error" role="alert">{error}</div>}
      {loading && <div className="venue-state">Loading venue applications…</div>}
      {!loading && !error && venues.length === 0 && <div className="venue-state"><h2>No {statusFilter === 'all' ? '' : `${statusFilter} `}venue listings.</h2><p>New vendor submissions will appear here for review.</p></div>}
      {!loading && venues.length > 0 && (
        <div className="admin-venue-list">
          {venues.map((venue) => (
            <article className="admin-venue-row" key={venue._id}>
              <VenueImage className="admin-venue-image" src={venue.coverImage} alt={`${venue.venueName} venue`} />
              <div className="admin-venue-content">
                <div className="booking-card-topline">
                  <div><p className="venue-location">{venue.city}, {venue.state} · {venue.venueType}</p><h2>{venue.venueName}</h2></div>
                  <span className={`moderation-badge ${venue.approvalStatus}`}>{venue.approvalStatus}</span>
                </div>
                <p><strong>Vendor:</strong> {venue.vendor?.businessName || venue.vendor?.name || 'Vendor'} ({venue.vendor?.email || 'No email'})</p>
                <p><strong>Capacity & Price:</strong> {venue.minimumGuests}–{Math.min(venue.maximumGuests, venue.seatingCapacity)} guests · ₹{Number(venue.startingPrice).toLocaleString('en-IN')} ({venue.priceType || 'Per Day'}) · {venue.isActive ? 'Active' : 'Inactive'}</p>
                {venue.rejectionReason && (
                  <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b', fontSize: '0.9rem' }}>
                    <strong>Rejection Reason:</strong> {venue.rejectionReason}
                  </div>
                )}
                <details style={{ marginTop: '10px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#3b82f6' }}>View full listing details</summary>
                  <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#334155', display: 'grid', gap: '6px' }}>
                    <p><strong>Description:</strong> {venue.description}</p>
                    <p><strong>Address:</strong> {venue.address}{venue.landmark ? `, Landmark: ${venue.landmark}` : ''}{venue.area ? `, Area: ${venue.area}` : ''}</p>
                    <p><strong>Contact:</strong> Phone: {venue.contactPhone || '—'}, Email: {venue.contactEmail || '—'}</p>
                    <p><strong>Rooms:</strong> {venue.numberOfRooms || 0}, <strong>Parking:</strong> {venue.parkingCapacity || 0} vehicles</p>
                    <p><strong>Advance Payment:</strong> {venue.advancePaymentPercentage ? `${venue.advancePaymentPercentage}%` : (venue.advancePayment ? `₹${venue.advancePayment}` : 'N/A')}</p>
                    {venue.eventTypes?.length > 0 && <p><strong>Event Types:</strong> {venue.eventTypes.join(', ')}</p>}
                    <div className="venue-facility-tags" style={{ marginTop: '6px' }}>{(venue.facilities || []).map((facility) => <span key={facility}>{facility}</span>)}</div>
                  </div>
                </details>
                <div className="admin-venue-actions" style={{ marginTop: '12px' }}>
                  {venue.approvalStatus !== 'approved' && <button type="button" disabled={working === venue._id} onClick={() => handleApprove(venue)}>{venue.approvalStatus === 'disabled' ? 'Enable' : 'Approve'}</button>}
                  {venue.approvalStatus === 'pending' && <button type="button" className="reject-button" disabled={working === venue._id} onClick={() => openRejectModal(venue)}>Reject</button>}
                  {venue.approvalStatus === 'approved' && <button type="button" className="reject-button" disabled={working === venue._id} onClick={() => handleDisable(venue)}>Disable</button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingVenue && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '10px', maxWidth: '480px', width: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Reject Venue Listing</h3>
            <p style={{ color: '#475569', fontSize: '0.95rem' }}>
              Please provide a reason for rejecting <strong>{rejectingVenue.venueName}</strong>. This will be shown to the vendor.
            </p>
            <textarea
              rows="4"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
              placeholder="Enter rejection reason (e.g. Invalid documents, incomplete description, etc.)"
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button type="button" className="secondary-button" onClick={() => setRejectingVenue(null)}>Cancel</button>
              <button type="button" className="reject-button" disabled={working === rejectingVenue._id} onClick={handleConfirmReject}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
