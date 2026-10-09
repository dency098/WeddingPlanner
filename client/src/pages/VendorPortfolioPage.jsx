import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { getVendorPortfolio, createPortfolioItem } from '../services/portfolioService';
import VenueImage from '../components/VenueImage';

export default function VendorPortfolioPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    serviceType: 'Venue',
    eventTitle: '',
    eventDate: '',
    description: '',
    images: [],
    taggedVenue: ''
  });

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const data = await getVendorPortfolio(user.id);
      setItems(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load portfolio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadPortfolio();
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const urls = e.target.value.split(',').map(url => url.trim()).filter(Boolean);
    setForm({ ...form, images: urls });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createPortfolioItem(form);
      setForm({
        serviceType: 'Venue',
        eventTitle: '',
        eventDate: '',
        description: '',
        images: [],
        taggedVenue: ''
      });
      await loadPortfolio();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add portfolio item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="venue-management-page">
      <header className="venue-management-heading">
        <div>
          <p className="eyebrow">Vendor workspace</p>
          <h1>My Portfolio</h1>
          <p>Showcase your past events and weddings.</p>
        </div>
      </header>
      
      {error && <div className="venue-alert error" role="alert">{error}</div>}
      
      <section className="panel-grid two-columns">
        <div className="panel panel-large">
          <div className="panel-header"><h2>Portfolio Items</h2></div>
          {loading ? <p className="dashboard-empty">Loading...</p> : items.length === 0 ? (
            <p className="dashboard-empty">No portfolio items added yet.</p>
          ) : (
            <div className="booking-list">
              {items.map(item => (
                <div className="booking-row" key={item._id} style={{ alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                    {item.images && item.images.length > 0 && (
                      <div style={{ width: '120px', height: '80px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
                        <VenueImage src={item.images[0]} alt={item.eventTitle} />
                      </div>
                    )}
                    <div>
                      <strong>{item.eventTitle}</strong>
                      <small>{new Date(item.eventDate).toLocaleDateString()} · {item.serviceType}</small>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="panel">
          <div className="panel-header"><h2>Add New Item</h2></div>
          <form className="venue-edit-form" onSubmit={handleSubmit} style={{ margin: 0, padding: 0, border: 'none', background: 'transparent' }}>
            <div className="venue-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label>Service Type
                <select name="serviceType" value={form.serviceType} onChange={handleChange} required>
                  <option>Venue</option>
                  <option>Catering</option>
                </select>
              </label>
              <label>Event Title
                <input name="eventTitle" value={form.eventTitle} onChange={handleChange} required />
              </label>
              <label>Event Date
                <input type="date" name="eventDate" value={form.eventDate} onChange={handleChange} required />
              </label>
              <label>Description
                <textarea name="description" value={form.description} onChange={handleChange} rows="3" />
              </label>
              <label>Image URLs (comma separated)
                <input name="images" onChange={handleImageChange} required />
              </label>
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add to Portfolio'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
