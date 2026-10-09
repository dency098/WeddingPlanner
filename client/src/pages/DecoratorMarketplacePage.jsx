import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DecoratorEnquiryModal from '../components/DecoratorEnquiryModal';
import VenueImage from '../components/VenueImage';
import { getPublicDecorators } from '../services/decoratorService';

const STYLES = ['Traditional', 'Modern', 'Luxury', 'Minimal', 'Royal', 'Floral', 'Bohemian', 'Rustic', 'Elegant', 'Pastel'];
const EVENT_TYPES = ['Wedding', 'Reception', 'Engagement', 'Mehendi', 'Haldi', 'Sangeet'];

export default function DecoratorMarketplacePage() {
  const [decorators, setDecorators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [city, setCity] = useState('');
  const [style, setStyle] = useState('');
  const [eventType, setEventType] = useState('');
  const [search, setSearch] = useState('');

  // Modal enquiry state
  const [selectedDecoratorForEnquiry, setSelectedDecoratorForEnquiry] = useState(null);

  const fetchDecorators = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPublicDecorators({ city, style, eventType, search });
      setDecorators(data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Could not load wedding decorators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecorators();
  }, [city, style, eventType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDecorators();
  };

  return (
    <div className="venue-marketplace-page">
      <header className="marketplace-header" style={{ padding: '40px 20px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p className="eyebrow" style={{ color: '#e0e7ff', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Wedding Services</p>
          <h1 style={{ fontSize: '2.4rem', margin: '10px 0', color: '#fff' }}>Wedding Decorators</h1>
          <p style={{ color: '#c7d2fe', fontSize: '1.1rem' }}>Find expert decorators to create unforgettable mandaps, stages, and floral themes for your special day.</p>
        </div>
      </header>

      <section className="marketplace-filter-bar" style={{ padding: '20px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flex: '1 1 300px' }}>
            <input
              type="text"
              placeholder="Search by business name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
            <button type="submit" className="primary-button" style={{ padding: '10px 20px' }}>Search</button>
          </form>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
            >
              <option value="">All Cities</option>
              <option value="Surat">Surat</option>
              <option value="Navsari">Navsari</option>
              <option value="Bharuch">Bharuch</option>
              <option value="Vadodara">Vadodara</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Mumbai">Mumbai</option>
            </select>

            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
            >
              <option value="">All Styles</option>
              {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
            >
              <option value="">All Event Types</option>
              {EVENT_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
      </section>

      <main style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
        {error && <div className="venue-alert error">{error}</div>}
        {loading && <div className="venue-state">Loading wedding decorators…</div>}

        {!loading && decorators.length === 0 && (
          <div className="venue-state">
            <h2>No decorators found.</h2>
            <p>Try clearing your filters to see more decorator listings.</p>
          </div>
        )}

        {!loading && decorators.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '25px' }}>
            {decorators.map((decorator) => (
              <article
                key={decorator._id}
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ height: '200px', position: 'relative', background: '#f1f5f9' }}>
                  <VenueImage
                    src={decorator.coverImage || 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80'}
                    alt={decorator.businessName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '12px',
                      background: 'rgba(0,0,0,0.7)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    ★ 4.8 (24 Reviews)
                  </span>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    WEDDING DECORATOR · {decorator.city}
                  </span>

                  <h2 style={{ fontSize: '1.3rem', margin: '6px 0 8px', color: '#0f172a' }}>{decorator.businessName}</h2>

                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {decorator.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '15px' }}>
                    {(decorator.decorationStyles || []).slice(0, 3).map((s) => (
                      <span key={s} style={{ background: '#f3e8ff', color: '#6b21a8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {s}
                      </span>
                    ))}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <small style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Starting from</small>
                      <strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>₹{Number(decorator.startingPrice).toLocaleString('en-IN')}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        to={`/decorators/${decorator._id}`}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                        }}
                      >
                        View Profile
                      </Link>

                      <button
                        type="button"
                        onClick={() => setSelectedDecoratorForEnquiry(decorator)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '6px',
                          background: '#7c3aed',
                          color: '#fff',
                          border: 'none',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        Send Enquiry
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* ENQUIRY MODAL */}
      {selectedDecoratorForEnquiry && (
        <DecoratorEnquiryModal
          decorator={selectedDecoratorForEnquiry}
          onClose={() => setSelectedDecoratorForEnquiry(null)}
        />
      )}
    </div>
  );
}

