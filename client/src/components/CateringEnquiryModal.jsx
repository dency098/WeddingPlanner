import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { createCateringInquiry } from '../services/cateringInquiryService';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'High Tea', 'Snacks', 'Welcome Drinks'];
const FOOD_PREFS = ['Vegetarian', 'Jain', 'Swaminarayan', 'Vegan', 'Non-Vegetarian', 'Custom'];
const CUISINES = ['Gujarati', 'Punjabi', 'North Indian', 'South Indian', 'Rajasthani', 'Jain', 'Chinese', 'Continental', 'Italian', 'Mexican', 'Mughlai'];
const LIVE_COUNTERS = ['Dosa Counter', 'Chaat Counter', 'Pasta Counter', 'Pizza Counter', 'Jalebi Counter', 'Pani Puri Counter', 'Live Tandoor'];

export default function CateringEnquiryModal({ catering, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [form, setForm] = useState({
    eventType: 'Wedding',
    eventDate: '',
    city: catering.city || '',
    venueName: '',
    venueType: 'Banquet Hall',
    guestCount: '250',
    mealTypes: ['Lunch', 'Dinner'],
    foodPreference: catering.dietaryType || 'Vegetarian',
    cuisines: catering.cuisines?.length ? [catering.cuisines[0]] : ['Gujarati', 'Punjabi'],
    selectedPackage: 'Premium Package',
    liveCounters: ['Dosa Counter', 'Chaat Counter'],
    specialFoodRequirements: '',
    budgetPerPlate: String(catering.pricePerPlate || 500),
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleArrayItem = (arrayName, item) => {
    setForm((prev) => {
      const current = prev[arrayName] || [];
      const updated = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];
      return { ...prev, [arrayName]: updated };
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
      const payload = {
        cateringId: catering._id,
        eventType: form.eventType,
        eventDate: form.eventDate,
        city: form.city,
        venueName: form.venueName,
        venueType: form.venueType,
        guestCount: Number(form.guestCount),
        mealTypes: form.mealTypes,
        foodPreference: form.foodPreference,
        cuisines: form.cuisines,
        selectedPackage: form.selectedPackage,
        liveCounters: form.liveCounters,
        specialFoodRequirements: form.specialFoodRequirements,
        budgetPerPlate: Number(form.budgetPerPlate || 0),
        totalBudget: Number(form.budgetPerPlate || 0) * Number(form.guestCount || 1),
        message: form.message,
        userName: user?.name || user?.fullName || '',
        userEmail: user?.email || '',
        userPhone: user?.phone || '',
      };

      await createCateringInquiry(payload);
      setIsSuccess(true);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to send catering enquiry.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="modal-overlay" style={overlayStyle}>
        <div className="modal-content" style={{ ...modalStyle, textAlign: 'center', padding: '40px 30px' }}>
          <div style={{ fontSize: '3.5rem', color: '#10b981', marginBottom: '15px' }}>✓</div>
          <h2 style={{ fontSize: '1.6rem', color: '#0f172a', margin: '0 0 10px' }}>Catering Enquiry Sent</h2>
          <p style={{ color: '#475569', fontSize: '1rem', marginBottom: '25px' }}>
            Your food and catering enquiry has been sent to <strong>{catering.companyName}</strong>.<br />
            The caterer will review your menu requirements and send a quotation.
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
      <div className="modal-content" style={{ ...modalStyle, maxWidth: '650px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>Send Catering Enquiry</h2>
            <small style={{ color: '#64748b' }}>To {catering.companyName}</small>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        {error && <div className="venue-alert error" style={{ marginBottom: '15px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '5px' }}>
          <div className="venue-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label>
              Event Type *
              <select name="eventType" value={form.eventType} onChange={handleChange} required>
                {['Wedding', 'Reception', 'Engagement', 'Mehendi', 'Haldi', 'Sangeet', 'Birthday', 'Corporate Event'].map((ev) => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
            </label>

            <label>
              Event Date *
              <input type="date" name="eventDate" value={form.eventDate} onChange={handleChange} required />
            </label>

            <label>
              City *
              <input name="city" value={form.city} onChange={handleChange} required />
            </label>

            <label>
              Guest Count *
              <input type="number" name="guestCount" min="1" value={form.guestCount} onChange={handleChange} required />
            </label>

            <label>
              Food Preference
              <select name="foodPreference" value={form.foodPreference} onChange={handleChange}>
                {FOOD_PREFS.map((fp) => <option key={fp} value={fp}>{fp}</option>)}
              </select>
            </label>

            <label>
              Budget Per Plate (₹)
              <input type="number" name="budgetPerPlate" min="0" value={form.budgetPerPlate} onChange={handleChange} />
            </label>

            {/* MEAL TYPES */}
            <div className="form-full">
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Meal Types Required:</label>
              <div className="facility-checkbox-grid">
                {MEAL_TYPES.map((mt) => {
                  const isChecked = form.mealTypes.includes(mt);
                  return (
                    <label key={mt} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleArrayItem('mealTypes', mt)} />
                      <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                      {mt}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* CUISINES */}
            <div className="form-full">
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Preferred Cuisines:</label>
              <div className="facility-checkbox-grid">
                {CUISINES.map((cuis) => {
                  const isChecked = form.cuisines.includes(cuis);
                  return (
                    <label key={cuis} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleArrayItem('cuisines', cuis)} />
                      <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                      {cuis}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* LIVE COUNTERS */}
            <div className="form-full">
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Live Counter Requirements:</label>
              <div className="facility-checkbox-grid">
                {LIVE_COUNTERS.map((lc) => {
                  const isChecked = form.liveCounters.includes(lc);
                  return (
                    <label key={lc} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleArrayItem('liveCounters', lc)} />
                      <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                      {lc}
                    </label>
                  );
                })}
              </div>
            </div>

            <label className="form-full">
              Special Food / Dietary Requirements
              <input
                name="specialFoodRequirements"
                value={form.specialFoodRequirements}
                onChange={handleChange}
                placeholder="e.g. Pure Jain counter needed, low oil menu"
              />
            </label>

            <label className="form-full">
              Message to Caterer
              <textarea
                name="message"
                rows="3"
                value={form.message}
                onChange={handleChange}
                placeholder="Specify preferred starters, sweets, or specific event timing details..."
              />
            </label>

            <div className="form-full" style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '0.9rem' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Logged-in Customer Contact:</p>
              <p style={{ margin: '0 0 2px' }}>Name: {user?.name || 'User'}</p>
              <p style={{ margin: '0 0 2px' }}>Email: {user?.email || 'N/A'}</p>
              <p style={{ margin: 0 }}>Phone: {user?.phone || 'Not provided'}</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={loading} style={{ background: '#059669' }}>
              {loading ? 'Sending enquiry…' : 'Send Catering Enquiry'}
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
  maxWidth: '650px',
  width: '100%',
  padding: '25px',
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
};

