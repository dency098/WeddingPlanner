import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DecoratorEnquiryModal from '../components/DecoratorEnquiryModal';
import VenueImage from '../components/VenueImage';
import { getPublicDecorator } from '../services/decoratorService';

export default function DecoratorDetailsPage() {
  const { id } = useParams();
  const [decorator, setDecorator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);

  useEffect(() => {
    let active = true;
    getPublicDecorator(id)
      .then((data) => {
        if (active) setDecorator(data);
      })
      .catch((apiError) => {
        if (active) setError(apiError.response?.data?.message || 'Could not load decorator details.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <main className="venue-state">Loading decorator profile…</main>;
  if (error || !decorator) {
    return (
      <main className="venue-state">
        <h2>Decorator Unavailable</h2>
        <p>{error || 'This decorator service is not currently available.'}</p>
        <Link className="primary-button" to="/decorators">Back to Decorators</Link>
      </main>
    );
  }

  return (
    <div className="venue-details-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
      <Link className="back-link" to="/decorators" style={{ display: 'inline-block', marginBottom: '20px', color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>
        ← Back to Wedding Decorators
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* LEFT MAIN CONTENT */}
        <div>
          <header style={{ marginBottom: '25px' }}>
            <span style={{ color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>
              WEDDING DECORATOR · {decorator.city}
            </span>
            <h1 style={{ fontSize: '2.4rem', margin: '6px 0 10px', color: '#0f172a' }}>{decorator.businessName}</h1>
            <p style={{ color: '#64748b', fontSize: '1.05rem', margin: 0 }}>
              {decorator.area ? `${decorator.area}, ` : ''}{decorator.city} · {decorator.yearsOfExperience} Years of Experience
            </p>
          </header>

          {/* MAIN COVER & GALLERY */}
          <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
            <VenueImage
              src={decorator.coverImage || 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80'}
              alt={decorator.businessName}
              style={{ width: '100%', height: '400px', objectFit: 'cover' }}
            />
            {decorator.gallery && decorator.gallery.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px', padding: '12px', background: '#f8fafc' }}>
                {decorator.gallery.map((img, i) => (
                  <VenueImage key={i} src={img} alt={`Gallery image ${i}`} style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '6px' }} />
                ))}
              </div>
            )}
          </div>

          {/* ABOUT */}
          <section style={{ marginBottom: '30px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.4rem', marginTop: 0, color: '#0f172a' }}>About {decorator.businessName}</h2>
            <p style={{ color: '#334155', lineHeight: '1.7', whiteSpace: 'pre-line' }}>{decorator.description}</p>
          </section>

          {/* DECORATION SERVICES */}
          <section style={{ marginBottom: '30px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.4rem', marginTop: 0, color: '#0f172a' }}>Decoration Services Offered</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {(decorator.decorationServices || []).map((serv) => (
                <span key={serv} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '8px 14px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>
                  ✓ {serv}
                </span>
              ))}
            </div>
          </section>

          {/* DECORATION STYLES */}
          <section style={{ marginBottom: '30px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.4rem', marginTop: 0, color: '#0f172a' }}>Decoration Themes & Styles</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {(decorator.decorationStyles || []).map((st) => (
                <span key={st} style={{ background: '#f3e8ff', color: '#6b21a8', padding: '8px 14px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>
                  ★ {st}
                </span>
              ))}
            </div>
          </section>

          {/* PACKAGES */}
          {decorator.packages && decorator.packages.length > 0 && (
            <section style={{ marginBottom: '30px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.4rem', marginTop: 0, color: '#0f172a' }}>Decoration Packages</h2>
              <div style={{ display: 'grid', gap: '15px' }}>
                {decorator.packages.map((pkg, i) => (
                  <div key={i} style={{ border: '1px solid #cbd5e1', padding: '16px', borderRadius: '8px', background: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{pkg.packageName}</h3>
                      <strong style={{ fontSize: '1.2rem', color: '#7c3aed' }}>₹{Number(pkg.price).toLocaleString('en-IN')}</strong>
                    </div>
                    {pkg.description && <p style={{ margin: '8px 0 0', color: '#475569', fontSize: '0.95rem' }}>Includes: {pkg.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ADD-ONS */}
          {decorator.addOns && decorator.addOns.length > 0 && (
            <section style={{ marginBottom: '30px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.4rem', marginTop: 0, color: '#0f172a' }}>Available Add-on Services</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {decorator.addOns.map((addon) => (
                  <span key={addon} style={{ background: '#f1f5f9', color: '#334155', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>
                    + {addon}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* SERVICE AREAS & POLICIES */}
          <section style={{ marginBottom: '30px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.4rem', marginTop: 0, color: '#0f172a' }}>Service Areas & Policies</h2>
            <p><strong>Service Areas:</strong> {decorator.serviceAreas?.join(', ') || decorator.city}</p>
            {decorator.advancePayment && <p><strong>Advance Payment:</strong> {decorator.advancePayment}</p>}
            {decorator.cancellationPolicy && <p><strong>Cancellation Policy:</strong> {decorator.cancellationPolicy}</p>}
            {decorator.termsAndConditions && <p><strong>Terms & Conditions:</strong> {decorator.termsAndConditions}</p>}
          </section>
        </div>

        {/* RIGHT ACTION CARD */}
        <div>
          <div style={{ position: 'sticky', top: '20px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
              <small style={{ color: '#64748b' }}>Pricing</small>
              <h3 style={{ fontSize: '1.8rem', margin: '4px 0 0', color: '#0f172a' }}>
                ₹{Number(decorator.startingPrice).toLocaleString('en-IN')} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'normal' }}>onwards</span>
              </h3>
              <span style={{ fontSize: '0.85rem', color: '#7c3aed', fontWeight: 600 }}>{decorator.pricingType}</span>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {/* PRIMARY CTA — SEND ENQUIRY */}
              <button
                type="button"
                onClick={() => setShowEnquiryModal(true)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Send Enquiry
              </button>

              {/* SECONDARY CTA — SHORTLIST */}
              <button
                type="button"
                onClick={() => setIsShortlisted(!isShortlisted)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: isShortlisted ? '#fef2f2' : '#f8fafc',
                  color: isShortlisted ? '#dc2626' : '#334155',
                  border: isShortlisted ? '1px solid #fca5a5' : '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isShortlisted ? '♥ Shortlisted' : '♡ Shortlist'}
              </button>
            </div>

            <div style={{ marginTop: '20px', fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>
              <p style={{ margin: '0 0 6px' }}>✓ No direct booking required.</p>
              <p style={{ margin: 0 }}>✓ Send your event details to receive availability and custom quotation.</p>
            </div>
          </div>
        </div>
      </div>

      {showEnquiryModal && (
        <DecoratorEnquiryModal
          decorator={decorator}
          onClose={() => setShowEnquiryModal(false)}
        />
      )}
    </div>
  );
}

