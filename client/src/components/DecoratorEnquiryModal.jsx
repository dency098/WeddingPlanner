import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { createDecoratorEnquiry } from '../services/decoratorEnquiryService';
import '../styles/DecoratorEnquiries.css';

const DECORATION_OPTIONS = [
  'Mandap',
  'Stage',
  'Entrance',
  'Floral Decoration',
  'Lighting',
  'Ceiling',
  'Table Decoration',
  'Backdrop',
  'Welcome Area',
  'Photo Booth',
];

const STYLES = ['Traditional', 'Modern', 'Luxury', 'Minimal', 'Royal', 'Floral', 'Pastel', 'Theme Based'];

const BUDGET_OPTIONS = [
  'Under ₹25,000',
  '₹25,000 – ₹50,000',
  '₹50,000 – ₹1,00,000',
  '₹1,00,000 – ₹2,00,000',
  '₹2,00,000+',
  'Custom Budget',
];

const todayInputValue = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export default function DecoratorEnquiryModal({ decorator, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [form, setForm] = useState({
    eventSchedule: [{
      eventType: 'Wedding',
      eventDate: '',
      guestCount: '200',
      startTime: '',
      endTime: '',
      notes: '',
    }],
    city: decorator.city || '',
    venueName: '',
    venueType: 'Banquet Hall',
    decorationsRequired: ['Mandap', 'Stage', 'Floral Decoration'],
    style: 'Luxury',
    budget: '₹50,000 – ₹1,00,000',
    customBudget: '',
    message: '',
  });

  const updateEvent = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      eventSchedule: previous.eventSchedule.map((event, eventIndex) => (
        eventIndex === index ? { ...event, [field]: value } : event
      )),
    }));
  };

  const addEvent = () => {
    setForm((previous) => ({
      ...previous,
      eventSchedule: [
        ...previous.eventSchedule,
        {
          eventType: 'Wedding',
          eventDate: '',
          guestCount: '200',
          startTime: '',
          endTime: '',
          notes: '',
        },
      ],
    }));
  };

  const removeEvent = (index) => {
    setForm((previous) => ({
      ...previous,
      eventSchedule: previous.eventSchedule.filter((_, eventIndex) => eventIndex !== index),
    }));
  };

  const toggleDecor = (item) => {
    setForm((prev) => {
      const current = prev.decorationsRequired;
      const updated = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];
      return { ...prev, decorationsRequired: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userName = user?.name || user?.fullName || user?.username || '';
      const userEmail = user?.email || '';
      const userPhone = user?.phone || '';

      if (!userName || !userEmail) {
        setError('Please log in to send an enquiry.');
        setLoading(false);
        return;
      }

      const eventSchedule = form.eventSchedule.map((event) => ({
        ...event,
        guestCount: Number(event.guestCount),
        decorationsRequired: form.decorationsRequired,
        style: form.style,
        budget: form.budget === 'Custom Budget' ? `Custom: ₹${form.customBudget}` : form.budget,
      }));
      const primaryEvent = eventSchedule[0];
      const payload = {
        decorator: decorator._id,
        decoratorId: decorator._id,
        userName,
        userEmail,
        userPhone,
        eventType: primaryEvent.eventType,
        eventDate: primaryEvent.eventDate,
        eventSchedule,
        city: form.city,
        venueName: form.venueName,
        venueType: form.venueType,
        guestCount: primaryEvent.guestCount,
        decorationsRequired: form.decorationsRequired,
        decorationRequirements: form.decorationsRequired,
        style: form.style,
        decorationStyle: form.style,
        budget: form.budget === 'Custom Budget' ? `Custom: ₹${form.customBudget}` : form.budget,
        customBudget: form.customBudget ? Number(form.customBudget) : undefined,
        message: form.message,
      };

      await createDecoratorEnquiry(payload);
      setIsSuccess(true);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to send enquiry. Please check required fields.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="modal-overlay" style={overlayStyle}>
        <div className="modal-content decoration-enquiry-modal" style={{ ...modalStyle, textAlign: 'center', padding: '40px 30px' }}>
          <div style={{ fontSize: '3.5rem', color: '#10b981', marginBottom: '15px' }}>✓</div>
          <h2 style={{ fontSize: '1.6rem', color: '#0f172a', margin: '0 0 10px' }}>Enquiry Sent</h2>
          <p style={{ color: '#475569', fontSize: '1rem', marginBottom: '25px', lineHeight: '1.5' }}>
            Your decoration requirement has been sent to <strong>{decorator.businessName}</strong>.<br />
            The vendor can review your requirements and respond to you.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('/user/decorator-enquiries')}
            >
              View My Enquiries
            </button>
            <button type="button" className="secondary-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content decoration-enquiry-modal" style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>Send Decoration Enquiry</h2>
            <small style={{ color: '#64748b' }}>To {decorator.businessName} ({decorator.city})</small>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        {error && <div className="venue-alert error" style={{ marginBottom: '15px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* STEP 1: EVENT DETAILS */}
          {step === 1 && (
            <div>
              <h3 style={stepHeadingStyle}>Step 1 — Event Details</h3>
              <div className="venue-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <label>
                  City *
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Venue Type
                  <select value={form.venueType} onChange={(e) => setForm({ ...form, venueType: e.target.value })}>
                    <option value="Banquet Hall">Banquet Hall</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Resort">Resort</option>
                    <option value="Farmhouse">Farmhouse</option>
                    <option value="Lawn">Lawn</option>
                    <option value="Home">Home</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="form-full">
                  Venue Name / Location
                  <input
                    placeholder="e.g. Royal Palace Banquet, Vesu"
                    value={form.venueName}
                    onChange={(e) => setForm({ ...form, venueName: e.target.value })}
                  />
                </label>
              </div>

              <section className="decoration-schedule-editor mt-3" aria-label="Decoration event schedule">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <div>
                    <h4 className="h6 fw-bold mb-1">Event dates</h4>
                    <p className="small text-muted mb-0">Add a separate date and guest count for each wedding function.</p>
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-primary" disabled={form.eventSchedule.length >= 20} onClick={addEvent}>
                    + Add event
                  </button>
                </div>
                {form.eventSchedule.map((event, index) => (
                  <div className="decoration-schedule-event card border-0 p-3 mb-2" key={index}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong className="small">Function {index + 1}</strong>
                      {form.eventSchedule.length > 1 && (
                        <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => removeEvent(index)}>
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="row g-2">
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Event type *</label>
                        <select className="form-select form-select-sm" value={event.eventType} onChange={(e) => updateEvent(index, 'eventType', e.target.value)} required>
                          <option value="Wedding">Wedding</option>
                          <option value="Reception">Reception</option>
                          <option value="Engagement">Engagement</option>
                          <option value="Mehendi">Mehendi</option>
                          <option value="Haldi">Haldi</option>
                          <option value="Sangeet">Sangeet</option>
                          <option value="Cocktail">Cocktail</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Event date *</label>
                        <input className="form-control form-control-sm" type="date" min={todayInputValue()} value={event.eventDate} onChange={(e) => updateEvent(index, 'eventDate', e.target.value)} required />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Guests *</label>
                        <input className="form-control form-control-sm" type="number" min="1" step="1" value={event.guestCount} onChange={(e) => updateEvent(index, 'guestCount', e.target.value)} required />
                      </div>
                      <div className="col-6 col-md-3">
                        <label className="form-label small fw-semibold">Start time</label>
                        <input className="form-control form-control-sm" type="time" value={event.startTime} onChange={(e) => updateEvent(index, 'startTime', e.target.value)} />
                      </div>
                      <div className="col-6 col-md-3">
                        <label className="form-label small fw-semibold">End time</label>
                        <input className="form-control form-control-sm" type="time" value={event.endTime} onChange={(e) => updateEvent(index, 'endTime', e.target.value)} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Function notes</label>
                        <input className="form-control form-control-sm" value={event.notes} onChange={(e) => updateEvent(index, 'notes', e.target.value)} placeholder="Optional setup details for this function" />
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <div style={footerStyle}>
                <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
                <button type="button" className="primary-button" onClick={() => {
                  if (!form.city.trim()) {
                    setError('Please enter the event city.');
                    return;
                  }
                  const today = todayInputValue();
                  if (form.eventSchedule.some((event) => (
                    !event.eventDate
                    || event.eventDate < today
                    || !Number.isInteger(Number(event.guestCount))
                    || Number(event.guestCount) < 1
                  ))) {
                    setError('Add a valid future date and guest count for every function.');
                    return;
                  }
                  setError('');
                  setStep(2);
                }}>Next: Requirements →</button>
              </div>
            </div>
          )}

          {/* STEP 2: GUEST / DECOR REQUIREMENTS */}
          {step === 2 && (
            <div>
              <h3 style={stepHeadingStyle}>Step 2 — Guest & Decor Requirements</h3>
              <div style={{ marginBottom: '15px' }}>
                <p className="small text-muted mb-3">Guest counts are recorded separately for each event date in your schedule.</p>
              </div>

              <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Decoration Required (Select all that apply):</label>
              <div className="facility-checkbox-grid" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {DECORATION_OPTIONS.map((item) => {
                  const isChecked = form.decorationsRequired.includes(item);
                  return (
                    <label key={item} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleDecor(item)} />
                      <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                      {item}
                    </label>
                  );
                })}
              </div>

              <div style={footerStyle}>
                <button type="button" className="secondary-button" onClick={() => setStep(1)}>← Back</button>
                <button type="button" className="primary-button" onClick={() => setStep(3)}>Next: Style & Budget →</button>
              </div>
            </div>
          )}

          {/* STEP 3 & 4: STYLE & BUDGET */}
          {step === 3 && (
            <div>
              <h3 style={stepHeadingStyle}>Step 3 & 4 — Preferred Style & Budget</h3>
              <div className="venue-form-grid">
                <label>
                  Decoration Style
                  <select value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })}>
                    {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>

                <label>
                  Budget Range
                  <select value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}>
                    {BUDGET_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </label>

                {form.budget === 'Custom Budget' && (
                  <label className="form-full">
                    Custom Budget Amount (₹)
                    <input
                      type="number"
                      min="0"
                      value={form.customBudget}
                      onChange={(e) => setForm({ ...form, customBudget: e.target.value })}
                      placeholder="e.g. 75000"
                    />
                  </label>
                )}
              </div>

              <div style={footerStyle}>
                <button type="button" className="secondary-button" onClick={() => setStep(2)}>← Back</button>
                <button type="button" className="primary-button" onClick={() => setStep(4)}>Next: Message & Contact →</button>
              </div>
            </div>
          )}

          {/* STEP 5 & 6: MESSAGE & CONTACT */}
          {step === 4 && (
            <div>
              <h3 style={stepHeadingStyle}>Step 5 & 6 — Message & Contact Information</h3>
              <div className="venue-form-grid">
                <label className="form-full">
                  Tell the decorator what you need...
                  <textarea
                    rows="3"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="I need floral mandap decoration, stage decoration and warm lighting for a 300 guest wedding."
                  />
                </label>

                <div className="form-full" style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '0.9rem' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Contact Details (from your profile):</p>
                  <p style={{ margin: '0 0 2px' }}>Name: {user?.name || 'Guest User'}</p>
                  <p style={{ margin: '0 0 2px' }}>Email: {user?.email || 'N/A'}</p>
                  <p style={{ margin: 0 }}>Phone: {user?.phone || 'Not provided'}</p>
                </div>
              </div>

              <div style={footerStyle}>
                <button type="button" className="secondary-button" onClick={() => setStep(3)}>← Back</button>
                <button type="submit" className="primary-button" disabled={loading} style={{ background: '#7c3aed' }}>
                  {loading ? 'Sending enquiry…' : 'Send Enquiry'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1100,
  padding: '20px',
};

const modalStyle = {
  background: '#fff',
  borderRadius: '12px',
  maxWidth: '820px',
  width: '100%',
  padding: '25px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
};

const stepHeadingStyle = {
  fontSize: '1.1rem',
  color: '#4f46e5',
  marginTop: 0,
  marginBottom: '15px',
};

const footerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '25px',
  paddingTop: '15px',
  borderTop: '1px solid #e2e8f0',
};
