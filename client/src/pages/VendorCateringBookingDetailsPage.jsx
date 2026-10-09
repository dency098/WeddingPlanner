import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getVendorCateringInquiries, sendCateringQuotation, requestVendorCateringTasting } from '../services/cateringInquiryService';

export default function VendorCateringBookingDetailsPage() {
  const { id } = useParams();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  // Quote Form State
  const [basePackagePrice, setBasePackagePrice] = useState('');
  const [customCharges, setCustomCharges] = useState('0');
  const [customChargeDetails, setCustomChargeDetails] = useState('');
  const [discount, setDiscount] = useState('0');
  const [vendorMessage, setVendorMessage] = useState('');
  const [tastingDateInput, setTastingDateInput] = useState('');
  const [showTastingForm, setShowTastingForm] = useState(false);

  useEffect(() => {
    let active = true;
    getVendorCateringInquiries()
      .then((result) => {
        if (active) {
          const item = result.find(i => i._id === id);
          if (item) {
            setInquiry(item);
            if (item.quotation) {
              setBasePackagePrice(item.quotation.basePackagePrice);
              setCustomCharges(item.quotation.customCharges);
              setCustomChargeDetails(item.quotation.customChargeDetails);
              setDiscount(item.quotation.discount);
              setVendorMessage(item.quotation.vendorMessage);
            } else {
              setBasePackagePrice(Number(item.catering?.pricePerPlate || 0) * Number(item.totalGuestCount || 0));
            }
          }
          else setError('Inquiry not found.');
        }
      })
      .catch((apiError) => { if (active) setError(apiError.response?.data?.message || 'Could not load inquiry.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const estimatedTotal = Math.max(0, Number(basePackagePrice) + Number(customCharges) - Number(discount));

  const handleSendQuote = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const payload = {
        basePackagePrice: Number(basePackagePrice),
        customCharges: Number(customCharges),
        customChargeDetails: customChargeDetails.trim(),
        discount: Number(discount),
        estimatedTotal,
        vendorMessage: vendorMessage.trim()
      };
      const res = await sendCateringQuotation(id, payload);
      setInquiry(res.data);
      setNotice(res.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send quotation.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestTasting = async (e) => {
    e.preventDefault();
    if (!tastingDateInput) {
      setError('Please select a tasting date.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await requestVendorCateringTasting(id, tastingDateInput);
      setInquiry(res.data);
      setNotice(res.message);
      setShowTastingForm(false);
      setTastingDateInput('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request tasting.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="venue-state">Loading inquiry details…</main>;
  if (!inquiry) return <main className="venue-state venue-state-error">{error}<Link to="/vendor/catering-bookings">Back</Link></main>;

  const hasCustomRequest = inquiry.events.some(evt => evt.meals.some(m => !!m.customizationRequest));

  return (
    <main className="venue-management-page venue-form-page">
      <Link className="back-link" to="/vendor/catering-bookings">← Back to Inquiries</Link>
      <header className="venue-management-heading">
        <div><p className="eyebrow">Inquiry Details</p><h1>Quotation for {inquiry.user?.firstName}</h1></div>
        <span className={`moderation-badge ${inquiry.status}`}>{inquiry.status.replace('_', ' ')}</span>
      </header>

      {error && <div className="venue-alert error" role="alert">{error}</div>}
      {notice && <div className="venue-alert success" role="status">{notice}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        <section className="venue-form-section" style={{ margin: 0 }}>
          <div className="venue-form-section-heading"><div><h2>Event Requirements</h2></div></div>
          <div style={{ padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
            <p><strong>Venue:</strong> {inquiry.venue?.venueName}</p>
            <p><strong>Service:</strong> {inquiry.catering?.companyName}</p>
            <p><strong>Total Guests:</strong> {inquiry.totalGuestCount}</p>
            
            <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Events Timeline</h3>
            {inquiry.events.map((evt, idx) => (
              <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '4px' }}>
                <p><strong>Date:</strong> {new Date(evt.date).toLocaleDateString()} | <strong>Timings:</strong> {evt.timing}</p>
                <div style={{ marginTop: '0.5rem' }}>
                  {evt.meals.map((m, mIdx) => (
                    <div key={mIdx} style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '3px solid #ccc' }}>
                      <p><strong>{m.type}</strong> ({m.timings})</p>
                      <p><em>Menu:</em> {m.menuSelection}</p>
                      {m.customizationRequest && (
                        <p style={{ color: '#d97706', marginTop: '0.25rem' }}><em>Custom Request:</em> {m.customizationRequest}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="venue-form-section" style={{ margin: 0 }}>
          <div className="venue-form-section-heading"><div><h2>Quotation Builder</h2></div></div>
          
          <form className="venue-edit-form" onSubmit={handleSendQuote} style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ddd' }}>
            {hasCustomRequest && (
              <div className="venue-alert" style={{ background: '#fef3c7', color: '#92400e', marginBottom: '1rem' }}>
                The user has requested custom items. Ensure you add custom charges below if applicable!
              </div>
            )}
            <div className="venue-form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <label>Base Package Price (₹)<input type="number" value={basePackagePrice} onChange={e => setBasePackagePrice(e.target.value)} disabled={inquiry.status !== 'pending'} required /></label>
              <label>Custom Charges (₹)<input type="number" value={customCharges} onChange={e => setCustomCharges(e.target.value)} disabled={inquiry.status !== 'pending'} /></label>
              <label>Custom Charge Details<input type="text" placeholder="e.g. Extra premium items added to dinner" value={customChargeDetails} onChange={e => setCustomChargeDetails(e.target.value)} disabled={inquiry.status !== 'pending'} /></label>
              <label>Discount (₹)<input type="number" value={discount} onChange={e => setDiscount(e.target.value)} disabled={inquiry.status !== 'pending'} /></label>
              <label>Message to User<textarea rows="3" value={vendorMessage} onChange={e => setVendorMessage(e.target.value)} disabled={inquiry.status !== 'pending'} placeholder="Optional message..."></textarea></label>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee', fontSize: '1.25rem' }}>
              <strong>Estimated Total: ₹{estimatedTotal.toLocaleString('en-IN')}</strong>
            </div>

            {inquiry.status === 'pending' && (
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                <button type="submit" className="primary-button" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Sending…' : 'Send Quotation to User'}
                </button>
                <button type="button" className="secondary-button" style={{ flex: 1 }} disabled={saving} onClick={() => setShowTastingForm(!showTastingForm)}>
                  Propose Tasting
                </button>
              </div>
            )}
            {showTastingForm && inquiry.status === 'pending' && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', borderTop: '1px solid #ddd' }}>
                <h3>Propose a Tasting Date</h3>
                <label>Date & Time
                  <input type="datetime-local" value={tastingDateInput} onChange={(e) => setTastingDateInput(e.target.value)} required />
                </label>
                <button type="button" className="primary-button" style={{ width: '100%', marginTop: '1rem' }} onClick={handleRequestTasting} disabled={saving}>
                  {saving ? 'Sending...' : 'Send Tasting Request'}
                </button>
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
