import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VenueImage from '../components/VenueImage';
import { getAdminDecorators, moderateDecorator } from '../services/decoratorService';

const filters = ['all', 'pending', 'approved', 'rejected', 'disabled'];

export default function AdminDecoratorsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [decorators, setDecorators] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, disabled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState('');

  // Rejection modal state
  const [rejectingDecorator, setRejectingDecorator] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const refresh = useCallback(async () => {
    const result = await getAdminDecorators(statusFilter === 'all' ? '' : statusFilter);
    setDecorators(result.data);
    setStats(result.stats);
  }, [statusFilter]);

  useEffect(() => {
    let active = true;
    getAdminDecorators(statusFilter === 'all' ? '' : statusFilter)
      .then((result) => {
        if (active) {
          setDecorators(result.data);
          setStats(result.stats);
        }
      })
      .catch((apiError) => {
        if (active) setError(apiError.response?.data?.message || 'Could not load decorator moderation.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [statusFilter]);

  const handleApprove = async (decorator) => {
    setWorking(decorator._id);
    setError('');
    try {
      await moderateDecorator(decorator._id, 'approved');
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Moderation action failed.');
    } finally {
      setWorking('');
    }
  };

  const openRejectModal = (decorator) => {
    setRejectingDecorator(decorator);
    setRejectionReasonInput('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingDecorator) return;
    setWorking(rejectingDecorator._id);
    setError('');
    try {
      await moderateDecorator(rejectingDecorator._id, 'rejected', rejectionReasonInput.trim());
      setRejectingDecorator(null);
      setRejectionReasonInput('');
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Rejection action failed.');
    } finally {
      setWorking('');
    }
  };

  const handleDisable = async (decorator) => {
    setWorking(decorator._id);
    setError('');
    try {
      await moderateDecorator(decorator._id, 'disabled');
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
        <div>
          <p className="eyebrow">Platform operations</p>
          <h1>Wedding Decorator Moderation</h1>
          <p>Review and manage wedding decorator service applications.</p>
        </div>
      </header>

      <div className="admin-venue-stats">
        {Object.entries(stats).map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{loading ? '—' : value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-filter-tabs" role="group" aria-label="Filter decorators by approval status">
        {filters.map((filter) => (
          <button
            type="button"
            className={statusFilter === filter ? 'active' : ''}
            key={filter}
            onClick={() => changeFilter(filter)}
          >
            {filter[0].toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className="venue-alert error" role="alert">{error}</div>}
      {loading && <div className="venue-state">Loading decorator applications…</div>}
      {!loading && !error && decorators.length === 0 && (
        <div className="venue-state">
          <h2>No {statusFilter === 'all' ? '' : `${statusFilter} `}decorator listings.</h2>
          <p>New decorator submissions will appear here for admin review.</p>
        </div>
      )}

      {!loading && decorators.length > 0 && (
        <div className="admin-venue-list">
          {decorators.map((dec) => (
            <article className="admin-venue-row" key={dec._id}>
              {dec.coverImage ? (
                <VenueImage className="admin-venue-image" src={dec.coverImage} alt={dec.businessName} />
              ) : null}

              <div className="admin-venue-content">
                <div className="booking-card-topline">
                  <div>
                    <p className="venue-location">{dec.city}{dec.area ? `, ${dec.area}` : ''} · Wedding Decorator</p>
                    <h2>{dec.businessName}</h2>
                  </div>
                  <span className={`moderation-badge ${dec.approvalStatus}`}>{dec.approvalStatus}</span>
                </div>

                <p>
                  <strong>Vendor:</strong> {dec.vendor?.businessName || dec.vendor?.name || 'Vendor'} · {dec.vendor?.email || 'No email'} · {dec.contactNumber}
                </p>
                <p>
                  <strong>Price:</strong> ₹{Number(dec.startingPrice).toLocaleString('en-IN')} onwards ({dec.pricingType}) · {dec.yearsOfExperience} yrs exp
                </p>

                <details style={{ marginTop: '10px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#4f46e5' }}>View complete decorator details</summary>
                  <div style={{ marginTop: '10px', fontSize: '0.9rem', display: 'grid', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                    <p><strong>Description:</strong> {dec.description}</p>
                    <p><strong>Decoration Services:</strong> {(dec.decorationServices || []).join(', ') || 'None specified'}</p>
                    <p><strong>Styles:</strong> {(dec.decorationStyles || []).join(', ') || 'None specified'}</p>
                    <p><strong>Event Types:</strong> {(dec.eventTypes || []).join(', ') || 'None specified'}</p>
                    <p><strong>Venue Types Supported:</strong> {(dec.venueTypes || []).join(', ') || 'None specified'}</p>
                    <p><strong>Service Areas:</strong> {(dec.serviceAreas || []).join(', ') || 'None specified'}</p>

                    {dec.packages && dec.packages.length > 0 && (
                      <div>
                        <strong>Packages:</strong>
                        <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                          {dec.packages.map((pkg, i) => (
                            <li key={i}>{pkg.packageName} - ₹{pkg.price} ({pkg.description})</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {dec.addOns && dec.addOns.length > 0 && (
                      <p><strong>Add-ons:</strong> {dec.addOns.join(', ')}</p>
                    )}

                    {dec.cancellationPolicy && <p><strong>Cancellation Policy:</strong> {dec.cancellationPolicy}</p>}
                    {dec.termsAndConditions && <p><strong>Terms & Conditions:</strong> {dec.termsAndConditions}</p>}
                  </div>
                </details>

                <div className="admin-venue-actions" style={{ marginTop: '15px' }}>
                  {dec.approvalStatus !== 'approved' && (
                    <button
                      type="button"
                      disabled={working === dec._id}
                      onClick={() => handleApprove(dec)}
                      style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Accept
                    </button>
                  )}

                  {dec.approvalStatus === 'pending' && (
                    <button
                      type="button"
                      className="reject-button"
                      disabled={working === dec._id}
                      onClick={() => openRejectModal(dec)}
                    >
                      Reject
                    </button>
                  )}

                  {dec.approvalStatus === 'approved' && (
                    <button
                      type="button"
                      className="reject-button"
                      disabled={working === dec._id}
                      onClick={() => handleDisable(dec)}
                    >
                      Disable
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* REJECT MODAL (Requirement #12) */}
      {rejectingDecorator && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '450px',
              width: '90%',
            }}
          >
            <h3 style={{ margin: '0 0 10px' }}>Reject Wedding Decorator</h3>
            <p style={{ margin: '0 0 15px', color: '#666', fontSize: '0.9rem' }}>
              Specify the reason for rejecting <strong>{rejectingDecorator.businessName}</strong>. The vendor will see this reason on their dashboard.
            </p>
            <label style={{ display: 'block', marginBottom: '15px' }}>
              <strong>Reason</strong>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                rows="4"
                placeholder="e.g. Please upload clearer portfolio images and provide valid contact details."
                style={{ width: '100%', marginTop: '6px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setRejectingDecorator(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="reject-button"
                onClick={handleConfirmReject}
                disabled={working === rejectingDecorator._id}
              >
                {working === rejectingDecorator._id ? 'Rejecting…' : 'Reject Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

