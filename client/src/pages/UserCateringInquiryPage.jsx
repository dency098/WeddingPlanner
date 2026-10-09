import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getPublicCatering } from '../services/cateringService';
import { createCateringInquiry } from '../services/cateringInquiryService';
import { useAuth } from '../context/useAuth';

export default function UserCateringInquiryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get('venueId');

  const [caterings, setCaterings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const predefinedCateringId = searchParams.get('cateringId');
  const [selectedCatering, setSelectedCatering] = useState(predefinedCateringId || '');
  const [totalGuestCount, setTotalGuestCount] = useState('');
  const [events, setEvents] = useState([{
    date: '', dayCount: 1, timing: '',
    meals: []
  }]);

  useEffect(() => {
    let active = true;
    
    getPublicCatering()
      .then((data) => {
        if (active) setCaterings(data);
      })
      .catch((apiError) => {
        if (active) setError(apiError.response?.data?.message || 'Could not load catering services.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [venueId]);

  const handleEventChange = (index, field, value) => {
    const newEvents = [...events];
    newEvents[index][field] = value;
    setEvents(newEvents);
  };

  const addEvent = () => {
    setEvents([...events, { date: '', dayCount: 1, timing: '', meals: [] }]);
  };

  const removeEvent = (index) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const toggleMeal = (eventIndex, mealType) => {
    const newEvents = [...events];
    const meals = newEvents[eventIndex].meals;
    const existingIndex = meals.findIndex(m => m.type === mealType);
    if (existingIndex >= 0) {
      meals.splice(existingIndex, 1);
    } else {
      meals.push({ type: mealType, timings: '', menuSelection: '', customizationRequest: '' });
    }
    setEvents(newEvents);
  };

  const handleMealChange = (eventIndex, mealType, field, value) => {
    const newEvents = [...events];
    const meal = newEvents[eventIndex].meals.find(m => m.type === mealType);
    if (meal) {
      meal[field] = value;
      setEvents(newEvents);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (!selectedCatering) throw new Error('Please select a catering service.');
      if (!totalGuestCount || Number(totalGuestCount) < 1) throw new Error('Please provide a valid total guest count.');
      if (events.length === 0) throw new Error('Please add at least one event date.');
      
      for (const evt of events) {
        if (!evt.date) throw new Error('Event date is required for all events.');
        if (evt.meals.length === 0) throw new Error('Please select at least one meal for each event.');
      }

      const payload = {
        cateringId: selectedCatering,
        totalGuestCount: Number(totalGuestCount),
        events
      };
      if (venueId) payload.venueId = venueId;

      await createCateringInquiry(payload);
      navigate('/user/bookings', { state: { notice: 'Catering inquiry sent successfully!' } });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit inquiry.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="venue-state">Loading catering services…</main>;

  return (
    <main className="venue-management-page venue-form-page">
      <header className="venue-management-heading">
        <div><p className="eyebrow">Service Inquiry</p><h1>Request Catering Service</h1><p>Customize your meals and send an inquiry to the vendor.</p></div>
      </header>
      
      {error && <div className="venue-alert error" role="alert">{error}</div>}

      <form className="venue-edit-form" onSubmit={handleSubmit}>
        <section className="venue-form-section">
          <div className="venue-form-section-heading"><span>01</span><div><h2>Basic Details</h2></div></div>
          <div className="venue-form-grid">
            <label>Name<input type="text" value={user?.name || ''} disabled /></label>
            <label>Select Catering Vendor
              <select value={selectedCatering} onChange={(e) => setSelectedCatering(e.target.value)} required>
                <option value="">-- Choose Catering --</option>
                {caterings.map(c => (
                  <option key={c._id} value={c._id}>{c.companyName} (₹{c.pricePerPlate}/plate - {c.dietaryType})</option>
                ))}
              </select>
            </label>
            <label>Total Guest Count<input type="number" min="1" value={totalGuestCount} onChange={e => setTotalGuestCount(e.target.value)} required /></label>
          </div>
        </section>

        <section className="venue-form-section">
          <div className="venue-form-section-heading"><span>02</span><div><h2>Event Details & Meals</h2><p>Supports multi-day functions.</p></div></div>
          
          {events.map((evt, eIdx) => (
            <div key={eIdx} style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Event {eIdx + 1}</h3>
                {events.length > 1 && <button type="button" className="danger-link" onClick={() => removeEvent(eIdx)}>Remove Event</button>}
              </div>
              <div className="venue-form-grid">
                <label>Date<input type="date" value={evt.date} onChange={e => handleEventChange(eIdx, 'date', e.target.value)} required /></label>
                <label>Day Count<input type="number" min="1" value={evt.dayCount} onChange={e => handleEventChange(eIdx, 'dayCount', e.target.value)} required /></label>
                <label>Event Timings<input type="text" placeholder="e.g. 10 AM - 10 PM" value={evt.timing} onChange={e => handleEventChange(eIdx, 'timing', e.target.value)} /></label>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <p><strong>Meals Required:</strong></p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  {['Breakfast', 'Lunch', 'Dinner'].map(mealType => (
                    <label key={mealType} className="facility-checkbox">
                      <input type="checkbox" checked={evt.meals.some(m => m.type === mealType)} onChange={() => toggleMeal(eIdx, mealType)} />
                      {mealType}
                    </label>
                  ))}
                </div>
              </div>

              {evt.meals.map(meal => (
                <div key={meal.type} style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <h4>{meal.type}</h4>
                  <div className="venue-form-grid">
                    <label>Timings<input type="text" placeholder="e.g. 8 AM - 10 AM" value={meal.timings} onChange={e => handleMealChange(eIdx, meal.type, 'timings', e.target.value)} required /></label>
                    <label className="form-full">Menu Selection<textarea placeholder="e.g. 2 Starters, 1 Paneer Sabzi, Dal Makhani..." rows="2" value={meal.menuSelection} onChange={e => handleMealChange(eIdx, meal.type, 'menuSelection', e.target.value)} required /></label>
                    <label className="form-full">Optional Customization<textarea placeholder="Any specific requirements for this meal?" rows="2" value={meal.customizationRequest} onChange={e => handleMealChange(eIdx, meal.type, 'customizationRequest', e.target.value)} /></label>
                  </div>
                </div>
              ))}
            </div>
          ))}

          <button type="button" className="secondary-button" onClick={addEvent}>+ Add Another Event Date</button>
        </section>

        <div className="venue-form-submit-row">
          <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Submitting…' : 'Send Inquiry to Vendor'}</button>
        </div>
      </form>
    </main>
  );
}
