import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { createVenueEnquiry } from '../services/venueEnquiryService';

export default function VenueEnquiryModal({ venue, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [form, setForm] = useState({
    eventType: 'Wedding',
    eventDate: '',
    city: venue.city || '',
    guestCount: '200',
    venueName: venue.venueName || '',
    preferredVenueType: venue.venueType || 'Banquet Hall',
    budget: '₹1,00,000 – ₹3,00,000',
    cateringRequired: true,
    decorationRequired: true,
    djRequired: false,
    numberOfRooms: '10',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
      const payload = {
        venueId: venue._id,
        eventType: form.eventType,
        eventDate: form.eventDate,
        city: form.city,
        guestCount: Number(form.guestCount),
        venueName: form.venueName,
        preferredVenueType: form.preferredVenueType,
        budget: form.budget,
        cateringRequired: form.cateringRequired,
        decorationRequired: form.decorationRequired,
        djRequired: form.djRequired,
        numberOfRooms: Number(form.numberOfRooms || 0),
        message: form.message,
        userName: user?.name || user?.fullName || '',
        userEmail: user?.email || '',
        userPhone: user?.phone || '',
      };

      await createVenueEnquiry(payload);
      setIsSuccess(true);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to send venue enquiry.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="modal-overlay" style={overlayStyle}>
        <div className="modal-content" style={{ ...modalStyle, textAlign: 'center', padding: '40px 30px' }}>
          <div style={{ fontSize: '3.5rem', color: '#10b981', marginBottom: '15px' }}>✓</div>
          <h2 style={{ fontSize: '1.6rem', color: '#0f172a', margin: '0 0 10px' }}>Venue Enquiry Sent</h2>
          <p style={{ color: '#475569', fontSize: '1rem', marginBottom: '25px' }}>
            Your venue requirement enquiry has been sent to <strong>{venue.venueName}</strong>.<br />
            The venue partner will review your dates and budget requirements.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('/user/enquiries')}
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
      <div className="modal-content" style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>Send Venue Enquiry</h2>
            <small style={{ color: '#64748b' }}>For {venue.venueName} ({venue.city})</small>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        {error && <div className="venue-alert error" style={{ marginBottom: '15px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="venue-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label>
              Event Type *
              <select name="eventType" value={form.eventType} onChange={handleChange} required>
                <option value="Wedding">Wedding</option>
                <option value="Reception">Reception</option>
                <option value="Engagement">Engagement</option>
                <option value="Mehendi">Mehendi</option>
                <option value="Haldi">Haldi</option>
                <option value="Sangeet">Sangeet</option>
                <option value="Birthday">Birthday</option>
                <option value="Corporate Event">Corporate Event</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              Event Date *
              <input
                type="date"
                name="eventDate"
                value={form.eventDate}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              City *
              <input name="city" value={form.city} onChange={handleChange} required />
            </label>

            <label>
              Number of Guests *
              <input
                type="number"
                name="guestCount"
                min="1"
                value={form.guestCount}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Rooms Required
              <input
                type="number"
                name="numberOfRooms"
                min="0"
                value={form.numberOfRooms}
                onChange={handleChange}
              />
            </label>

            <label>
              Approximate Budget
              <input name="budget" value={form.budget} onChange={handleChange} placeholder="e.g. ₹2,00,000" />
            </label>

            <div className="form-full" style={{ display: 'flex', gap: '20px', margin: '10px 0' }}>
              <label style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" name="cateringRequired" checked={form.cateringRequired} onChange={handleChange} />
                Catering Required
              </label>
              <label style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" name="decorationRequired" checked={form.decorationRequired} onChange={handleChange} />
                Decoration Required
              </label>
              <label style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" name="djRequired" checked={form.djRequired} onChange={handleChange} />
                DJ Required
              </label>
            </div>

            <label className="form-full">
              Specific Message or Requirements
              <textarea
                name="message"
                rows="3"
                value={form.message}
                onChange={handleChange}
                placeholder="Specify floating vs seating requirements, catering preferences, timing..."
              />
            </label>

            <div className="form-full" style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '0.9rem' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Logged-in User Profile:</p>
              <p style={{ margin: '0 0 2px' }}>Name: {user?.name || 'User'}</p>
              <p style={{ margin: '0 0 2px' }}>Email: {user?.email || 'N/A'}</p>
              <p style={{ margin: 0 }}>Phone: {user?.phone || 'Not provided'}</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Sending enquiry…' : 'Send Enquiry'}
            </button>
          </div>
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
  maxWidth: '550px',
  width: '100%',
  padding: '25px',
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
};

