import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import { getPublicCatering } from '../services/cateringService';
import CateringEnquiryModal from '../components/CateringEnquiryModal';

const formatPrice = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

export default function CateringMarketplacePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caterings, setCaterings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected catering for details / enquiry modal
  const [selectedEnquiryCatering, setSelectedEnquiryCatering] = useState(null);
  const [viewingDetailsCatering, setViewingDetailsCatering] = useState(null);

  useEffect(() => {
    let active = true;
    getPublicCatering()
      .then((data) => { if (active) setCaterings(data); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Failed to load catering services.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleOpenEnquiry = (catering) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedEnquiryCatering(catering);
  };

  return (
    <main className="venue-marketplace-page">
      <header className="marketplace-header" style={{ textAlign: 'center', padding: '4rem 1rem', background: '#fdfbf7' }}>
        <h1>Explore Wedding Catering Services</h1>
        <p>Find top culinary partners, menu packages, and live counters for your celebration.</p>
      </header>

      {error && <div className="venue-alert error" style={{ margin: '2rem' }} role="alert">{error}</div>}
      
      {loading ? (
        <div className="venue-state">Loading catering options…</div>
      ) : (
        <div className="venue-grid" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {caterings.length === 0 ? (
            <div className="venue-state" style={{ gridColumn: '1 / -1' }}>No catering services found.</div>
          ) : (
            caterings.map((cater) => (
              <article className="venue-card" key={cater._id}>
                <div className="venue-card-content">
                  <div className="venue-card-header">
                    <h2>{cater.companyName}</h2>
                    <p className="venue-location">{cater.dietaryType || 'Veg'} Catering · {cater.city || 'Gujarat'}</p>
                  </div>
                  <p className="venue-price">{formatPrice(cater.pricePerPlate)} <span>per plate starting</span></p>
                  <p className="venue-capacity">Guest count: {cater.minCapacity}–{cater.maxCapacity} guests</p>
                  
                  {cater.cuisines?.length > 0 && (
                    <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <strong>Cuisines:</strong> {cater.cuisines.join(', ')}
                    </p>
                  )}

                  {cater.foodPreferences?.length > 0 && (
                    <p style={{ fontSize: '0.875rem', color: '#166534', marginTop: '0.25rem' }}>
                      <strong>Food Options:</strong> {cater.foodPreferences.join(', ')}
                    </p>
                  )}

                  {cater.fssaiLicense && (
                    <p style={{ fontSize: '0.875rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 'bold' }}>
                      ✓ FSSAI Certified ({cater.fssaiLicense})
                    </p>
                  )}

                  {cater.packages?.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                      <strong>Menu Packages:</strong> {cater.packages.map(p => p.packageName).join(' · ')}
                    </div>
                  )}
                  
                  <div className="venue-facility-tags" style={{ marginTop: '0.5rem' }}>
                    {(cater.staffingOptions || []).slice(0, 3).map(f => <span key={f}>{f}</span>)}
                    {(cater.liveCounters || []).slice(0, 2).map(lc => <span key={lc} style={{ background: '#fef3c7', color: '#92400e' }}>{lc}</span>)}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '1rem' }}>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setViewingDetailsCatering(cater)}
                    >
                      View Menu
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => handleOpenEnquiry(cater)}
                    >
                      Send Enquiry
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* CATERING DETAILS MODAL */}
      {viewingDetailsCatering && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{viewingDetailsCatering.companyName}</h2>
                <small style={{ color: '#64748b' }}>{viewingDetailsCatering.dietaryType || 'Veg'} Catering · Contact: {viewingDetailsCatering.contactPerson || 'Vendor'}</small>
              </div>
              <button type="button" onClick={() => setViewingDetailsCatering(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'grid', gap: '14px', fontSize: '0.95rem', color: '#334155' }}>
              <p><strong>Starting Price:</strong> {formatPrice(viewingDetailsCatering.pricePerPlate)} / plate</p>
              <p><strong>Capacity:</strong> {viewingDetailsCatering.minCapacity} to {viewingDetailsCatering.maxCapacity} guests</p>
              <p><strong>Description:</strong> {viewingDetailsCatering.description || 'No description provided.'}</p>
              
              {viewingDetailsCatering.cuisines?.length > 0 && <p><strong>Cuisines:</strong> {viewingDetailsCatering.cuisines.join(', ')}</p>}
              {viewingDetailsCatering.foodPreferences?.length > 0 && <p><strong>Food Preferences:</strong> {viewingDetailsCatering.foodPreferences.join(', ')}</p>}
              {viewingDetailsCatering.mealTypes?.length > 0 && <p><strong>Meal Types:</strong> {viewingDetailsCatering.mealTypes.join(', ')}</p>}
              
              {viewingDetailsCatering.packages?.length > 0 && (
                <div>
                  <h3 style={{ margin: '8px 0 4px', fontSize: '1.05rem' }}>Menu Packages</h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {viewingDetailsCatering.packages.map((pkg, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <strong>{pkg.packageName}</strong> — {formatPrice(pkg.pricePerPlate)}/plate
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#475569' }}>{pkg.description}</p>
                        {pkg.items?.length > 0 && (
                          <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                            <strong>Items included:</strong> {pkg.items.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingDetailsCatering.liveCounters?.length > 0 && (
                <div>
                  <strong>Live Food Counters:</strong>
                  <div className="venue-facility-tags" style={{ marginTop: '4px' }}>
                    {viewingDetailsCatering.liveCounters.map(lc => <span key={lc} style={{ background: '#fef3c7', color: '#92400e' }}>{lc}</span>)}
                  </div>
                </div>
              )}

              {viewingDetailsCatering.serviceInclusions?.length > 0 && (
                <div>
                  <strong>Service Inclusions:</strong>
                  <div className="venue-facility-tags" style={{ marginTop: '4px' }}>
                    {viewingDetailsCatering.serviceInclusions.map(si => <span key={si}>{si}</span>)}
                  </div>
                </div>
              )}

              {viewingDetailsCatering.termsAndConditions && (
                <p><strong>Terms & Conditions:</strong> {viewingDetailsCatering.termsAndConditions}</p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
              <button type="button" className="secondary-button" onClick={() => setViewingDetailsCatering(null)}>Close</button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  const cater = viewingDetailsCatering;
                  setViewingDetailsCatering(null);
                  handleOpenEnquiry(cater);
                }}
              >
                Send Catering Enquiry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATERING ENQUIRY MODAL */}
      {selectedEnquiryCatering && (
        <CateringEnquiryModal
          catering={selectedEnquiryCatering}
          onClose={() => setSelectedEnquiryCatering(null)}
        />
      )}
    </main>
  );
}
