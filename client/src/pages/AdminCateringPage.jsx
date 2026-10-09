import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminCatering, moderateCatering } from '../services/cateringService';

const filters = ['all', 'pending', 'approved', 'rejected', 'disabled'];

export default function AdminCateringPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [caterings, setCaterings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState('');

  // Rejection modal state
  const [rejectingCatering, setRejectingCatering] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const refresh = useCallback(async () => {
    const result = await getAdminCatering(statusFilter === 'all' ? '' : statusFilter);
    setCaterings(result);
  }, [statusFilter]);

  useEffect(() => {
    let active = true;
    getAdminCatering(statusFilter === 'all' ? '' : statusFilter)
      .then((result) => { if (active) { setCaterings(result); } })
      .catch((apiError) => { if (active) setError(apiError.response?.data?.message || 'Could not load catering moderation.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [statusFilter]);

  const handleApprove = async (catering) => {
    setWorking(catering._id);
    setError('');
    try {
      await moderateCatering(catering._id, 'approved');
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Moderation action failed.');
    } finally {
      setWorking('');
    }
  };

  const openRejectModal = (catering) => {
    setRejectingCatering(catering);
    setRejectionReasonInput('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingCatering) return;
    setWorking(rejectingCatering._id);
    setError('');
    try {
      await moderateCatering(rejectingCatering._id, 'rejected', rejectionReasonInput.trim());
      setRejectingCatering(null);
      setRejectionReasonInput('');
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Rejection action failed.');
    } finally {
      setWorking('');
    }
  };

  const handleDisable = async (catering) => {
    setWorking(catering._id);
    setError('');
    try {
      await moderateCatering(catering._id, 'disabled');
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
        <div><p className="eyebrow">Platform operations</p><h1>Catering Management</h1><p>Review catering services and maintain a trusted marketplace.</p></div>
        <Link className="secondary-button" to="/admin/bookings">View bookings</Link>
      </header>
      <div className="admin-filter-tabs" role="group" aria-label="Filter catering by approval status">
        {filters.map((filter) => <button type="button" className={statusFilter === filter ? 'active' : ''} key={filter} onClick={() => changeFilter(filter)}>{filter[0].toUpperCase() + filter.slice(1)}</button>)}
      </div>
      {error && <div className="venue-alert error" role="alert">{error}</div>}
      {loading && <div className="venue-state">Loading catering applications…</div>}
      {!loading && !error && caterings.length === 0 && <div className="venue-state"><h2>No {statusFilter === 'all' ? '' : `${statusFilter} `}catering listings.</h2><p>New vendor submissions will appear here for review.</p></div>}
      {!loading && caterings.length > 0 && (
        <div className="admin-venue-list">
          {caterings.map((cater) => (
            <article className="admin-venue-row" key={cater._id}>
              <div className="admin-venue-content">
                <div className="booking-card-topline">
                  <div><p className="venue-location">{cater.dietaryType || 'Veg'} Catering</p><h2>{cater.companyName}</h2></div>
                  <span className={`moderation-badge ${cater.approvalStatus}`}>{cater.approvalStatus}</span>
                </div>
                <p><strong>Vendor:</strong> {cater.vendor?.businessName || cater.vendor?.name || 'Vendor'} ({cater.vendor?.email || 'No vendor email'})</p>
                <p><strong>Capacity & Price:</strong> {cater.minCapacity}–{cater.maxCapacity} guests · ₹{Number(cater.pricePerPlate).toLocaleString('en-IN')} Per Plate · {cater.isActive ? 'Active' : 'Inactive'}</p>
                {cater.rejectionReason && (
                  <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b', fontSize: '0.9rem' }}>
                    <strong>Rejection Reason:</strong> {cater.rejectionReason}
                  </div>
                )}
                <details style={{ marginTop: '10px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#3b82f6' }}>View listing details</summary>
                  <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#334155', display: 'grid', gap: '6px' }}>
                    <p><strong>Contact Person:</strong> {cater.contactPerson || '—'}</p>
                    <p><strong>Description:</strong> {cater.description || 'No description'}</p>
                    {cater.cuisines?.length > 0 && <p><strong>Cuisines:</strong> {cater.cuisines.join(', ')}</p>}
                    {cater.foodPreferences?.length > 0 && <p><strong>Food Preferences:</strong> {cater.foodPreferences.join(', ')}</p>}
                    {cater.mealTypes?.length > 0 && <p><strong>Meal Types:</strong> {cater.mealTypes.join(', ')}</p>}
                    {cater.fssaiLicense && <p><strong>FSSAI License:</strong> {cater.fssaiLicense}</p>}
                    {cater.packages?.length > 0 && (
                      <div>
                        <strong>Packages:</strong>
                        <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                          {cater.packages.map((pkg) => (
                            <li key={pkg.packageName}>
                              {pkg.packageName} (₹{pkg.pricePerPlate}/plate) - {pkg.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="venue-facility-tags" style={{ marginTop: '6px' }}>{(cater.staffingOptions || []).map((staff) => <span key={staff}>{staff}</span>)}</div>
                    {cater.menuPdf && <p style={{ marginTop: '6px' }}><a href={cater.menuPdf} target="_blank" rel="noreferrer">View Menu PDF</a></p>}
                  </div>
                </details>
                <div className="admin-venue-actions" style={{ marginTop: '12px' }}>
                  {cater.approvalStatus !== 'approved' && <button type="button" disabled={working === cater._id} onClick={() => handleApprove(cater)}>{cater.approvalStatus === 'disabled' ? 'Enable' : 'Approve'}</button>}
                  {cater.approvalStatus === 'pending' && <button type="button" className="reject-button" disabled={working === cater._id} onClick={() => openRejectModal(cater)}>Reject</button>}
                  {cater.approvalStatus === 'approved' && <button type="button" className="reject-button" disabled={working === cater._id} onClick={() => handleDisable(cater)}>Disable</button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingCatering && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '10px', maxWidth: '480px', width: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Reject Catering Listing</h3>
            <p style={{ color: '#475569', fontSize: '0.95rem' }}>
              Please provide a reason for rejecting <strong>{rejectingCatering.companyName}</strong>. This will be shown to the vendor.
            </p>
            <textarea
              rows="4"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
              placeholder="Enter rejection reason (e.g. FSSAI missing, invalid contact information, etc.)"
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button type="button" className="secondary-button" onClick={() => setRejectingCatering(null)}>Cancel</button>
              <button type="button" className="reject-button" disabled={working === rejectingCatering._id} onClick={handleConfirmReject}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
