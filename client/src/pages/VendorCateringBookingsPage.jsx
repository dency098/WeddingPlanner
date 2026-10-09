import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVendorCatering } from '../services/cateringService';
import {
  createTestCateringInquiry,
  getVendorCateringInquiries,
  respondCateringInquiry,
} from '../services/cateringInquiryService';

const dateLabel = (value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const formatPrice = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

export default function VendorCateringBookingsPage() {
  const [inquiries, setInquiries] = useState([]);
  const [vendorCatering, setVendorCatering] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState('');

  // Response Modal state
  const [respondingInquiry, setRespondingInquiry] = useState(null);
  const [responseForm, setResponseForm] = useState({
    availabilityStatus: 'available',
    estimatedPrice: '',
    message: '',
  });

  const refresh = useCallback(async () => {
    const [inqData, catData] = await Promise.all([
      getVendorCateringInquiries(),
      getVendorCatering(),
    ]);
    setInquiries(inqData || []);
    if (catData && catData.length > 0) {
      setVendorCatering(catData[0]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([getVendorCateringInquiries(), getVendorCatering()])
      .then(([inqData, catData]) => {
        if (active) {
          setInquiries(inqData || []);
          if (catData && catData.length > 0) {
            setVendorCatering(catData[0]);
          }
        }
      })
      .catch((apiError) => {
        if (active) setError(apiError.response?.data?.message || 'Could not load your catering inquiries.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreateTestEnquiry = async () => {
    if (!vendorCatering) {
      setError('You need an active Catering service to generate a test enquiry. Please add a Catering service first.');
      return;
    }

    setWorking('test-enquiry');
    setError('');
    setNotice('');

    try {
      await createTestCateringInquiry(vendorCatering._id);
      setNotice('✓ Test Food Enquiry created successfully! Check your inquiries list below.');
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to create test catering enquiry.');
    } finally {
      setWorking('');
    }
  };

  const openRespondModal = (inquiry) => {
    setRespondingInquiry(inquiry);
    setResponseForm({
      availabilityStatus: 'available',
      estimatedPrice: String(inquiry.totalBudget || inquiry.budgetPerPlate * (inquiry.guestCount || 100) || ''),
      message: '',
    });
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!respondingInquiry) return;

    setWorking(respondingInquiry._id);
    setError('');
    setNotice('');

    try {
      await respondCateringInquiry(respondingInquiry._id, {
        availabilityStatus: responseForm.availabilityStatus,
        estimatedPrice: Number(responseForm.estimatedPrice || 0),
        message: responseForm.message,
      });
      setNotice('✓ Response sent to customer successfully.');
      setRespondingInquiry(null);
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to send response.');
    } finally {
      setWorking('');
    }
  };

  return (
    <main className="venue-management-page">
      <header className="venue-management-heading">
        <div>
          <p className="eyebrow">Vendor workspace</p>
          <h1>Catering Inquiries & Food Requests</h1>
          <p>Review customer catering requirements, test food tasting requests, and send custom quotes.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="primary-button"
            disabled={working === 'test-enquiry'}
            onClick={handleCreateTestEnquiry}
            style={{ background: '#059669', borderColor: '#059669' }}
          >
            {working === 'test-enquiry' ? 'Generating Test Enquiry…' : '🍲 Send Test Food Enquiry'}
          </button>
          <Link className="secondary-button" to="/vendor/services">Manage Services</Link>
        </div>
      </header>

      {notice && <div className="venue-alert success" role="status" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>{notice}</div>}
      {error && <div className="venue-alert error" role="alert">{error}</div>}
      {loading && <div className="venue-state">Loading catering requests…</div>}
      
      {!loading && !error && inquiries.length === 0 && (
        <div className="venue-state">
          <h2>No catering inquiries yet.</h2>
          <p>You can click "Send Test Food Enquiry" above to generate a test enquiry for development testing.</p>
        </div>
      )}

      {!loading && inquiries.length > 0 && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {inquiries.map((inquiry) => (
            <article
              key={inquiry._id}
              style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '12px',
                border: inquiry.isTest ? '2px dashed #059669' : '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                      CATERING ENQUIRY
                    </span>
                    {inquiry.isTest && (
                      <span style={{ fontSize: '0.75rem', background: '#d1fae5', color: '#047857', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                        TEST ENQUIRY
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.3rem', margin: '4px 0 6px', color: '#0f172a' }}>
                    Customer: {inquiry.userName || (inquiry.user ? `${inquiry.user.name || inquiry.user.firstName || ''}` : 'Guest')}
                  </h2>
                  <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
                    ✉️ {inquiry.userEmail || inquiry.user?.email || 'N/A'} · 📞 {inquiry.userPhone || inquiry.user?.phone || 'Not provided'}
                  </p>
                </div>

                <span className={`booking-status ${inquiry.status}`} style={{ textTransform: 'capitalize' }}>
                  {inquiry.status?.replace('_', ' ')}
                </span>
              </div>

              {/* DETAILS GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '8px', marginTop: '16px', fontSize: '0.9rem' }}>
                <div><span>Event Type</span><p style={{ margin: 0, fontWeight: 600 }}>{inquiry.eventType}</p></div>
                <div><span>Event Date</span><p style={{ margin: 0, fontWeight: 600 }}>{dateLabel(inquiry.eventDate)}</p></div>
                <div><span>City / Venue</span><p style={{ margin: 0, fontWeight: 600 }}>{inquiry.city} {inquiry.venueName ? `(${inquiry.venueName})` : ''}</p></div>
                <div><span>Guest Count</span><p style={{ margin: 0, fontWeight: 600 }}>{inquiry.guestCount || inquiry.totalGuestCount} Guests</p></div>
                <div><span>Food Preference</span><p style={{ margin: 0, fontWeight: 600, color: '#166534' }}>{inquiry.foodPreference || 'Veg'}</p></div>
                <div><span>Budget Per Plate</span><p style={{ margin: 0, fontWeight: 600 }}>{inquiry.budgetPerPlate ? formatPrice(inquiry.budgetPerPlate) : 'N/A'}</p></div>
              </div>

              {inquiry.cuisines?.length > 0 && (
                <p style={{ fontSize: '0.9rem', marginTop: '12px', margin: '12px 0 0', color: '#334155' }}>
                  <strong>Cuisines Requested:</strong> {inquiry.cuisines.join(', ')}
                </p>
              )}

              {inquiry.mealTypes?.length > 0 && (
                <p style={{ fontSize: '0.9rem', marginTop: '4px', margin: '4px 0 0', color: '#334155' }}>
                  <strong>Meal Types:</strong> {inquiry.mealTypes.join(', ')}
                </p>
              )}

              {inquiry.liveCounters?.length > 0 && (
                <p style={{ fontSize: '0.9rem', marginTop: '4px', margin: '4px 0 0', color: '#334155' }}>
                  <strong>Live Counters:</strong> {inquiry.liveCounters.join(', ')}
                </p>
              )}

              {inquiry.selectedPackage && (
                <p style={{ fontSize: '0.9rem', marginTop: '4px', margin: '4px 0 0', color: '#334155' }}>
                  <strong>Selected Package:</strong> {inquiry.selectedPackage}
                </p>
              )}

              {inquiry.message && (
                <blockquote style={{ margin: '12px 0 0', padding: '10px 14px', background: '#fffbe8', borderLeft: '4px solid #f59e0b', borderRadius: '4px', fontSize: '0.9rem', color: '#78350f' }}>
                  "{inquiry.message}"
                </blockquote>
              )}

              {/* VENDOR RESPONSE RECORD */}
              {inquiry.response && (
                <div style={{ marginTop: '16px', padding: '14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px' }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#047857' }}>
                    Response Sent: {inquiry.response.availabilityStatus === 'available' ? 'Available' : 'Unavailable'}
                  </p>
                  {inquiry.response.estimatedPrice > 0 && (
                    <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#065f46' }}>
                      Estimated Quote: {formatPrice(inquiry.response.estimatedPrice)}
                    </p>
                  )}
                  {inquiry.response.message && (
                    <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#047857' }}>
                      "{inquiry.response.message}"
                    </p>
                  )}
                </div>
              )}

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="primary-button"
                  disabled={working === inquiry._id}
                  onClick={() => openRespondModal(inquiry)}
                >
                  {inquiry.response ? 'Update Quotation' : 'Respond / Send Quotation'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* RESPOND MODAL */}
      {respondingInquiry && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Respond to Catering Enquiry</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Enquiry from <strong>{respondingInquiry.userName || 'Customer'}</strong> for {respondingInquiry.eventType} on {dateLabel(respondingInquiry.eventDate)}.
            </p>

            <form onSubmit={handleSendResponse} style={{ display: 'grid', gap: '14px', marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>
                Availability Status
                <select
                  style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  value={responseForm.availabilityStatus}
                  onChange={(e) => setResponseForm((prev) => ({ ...prev, availabilityStatus: e.target.value }))}
                  required
                >
                  <option value="available">Available for dates</option>
                  <option value="not_available">Not available / Fully Booked</option>
                  <option value="need_more_details">Need more details</option>
                </select>
              </label>

              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>
                Estimated Total Quotation Amount (₹)
                <input
                  type="number"
                  style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="e.g. 125000"
                  value={responseForm.estimatedPrice}
                  onChange={(e) => setResponseForm((prev) => ({ ...prev, estimatedPrice: e.target.value }))}
                />
              </label>

              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>
                Message to Customer
                <textarea
                  rows="3"
                  style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="Include menu suggestions, per plate details, or questions..."
                  value={responseForm.message}
                  onChange={(e) => setResponseForm((prev) => ({ ...prev, message: e.target.value }))}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="secondary-button" onClick={() => setRespondingInquiry(null)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={working === respondingInquiry._id}>
                  {working === respondingInquiry._id ? 'Sending…' : 'Send Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
