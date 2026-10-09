import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VenueImage from '../components/VenueImage';
import { useAuth } from '../context/useAuth';
import { searchVenues } from '../services/venueService';

const navItems = [
  { label: 'Home', to: '#home' },
  { label: 'Venues', to: '/venues' },
  { label: 'Catering', to: '/catering' },
  { label: 'Decorators', to: '/decorators' },
  { label: 'Services', to: '#services' },
  { label: 'Ideas', to: '#ideas' },
  { label: 'How It Works', to: '#how-it-works' },
];

const venueTypes = ['Banquet Hall', 'Wedding Lawn', 'Resort', 'Hotel', 'Farmhouse', 'Community Hall'];

const serviceItems = [
  {
    title: 'Venues',
    description: 'From palace backdrops to intimate garden settings.',
    image:
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Photography',
    description: 'Document your day through cinematic, candid storytelling.',
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Catering',
    description: 'Curated menus that delight every guest at the table.',
    image:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Decor',
    description: 'Floral styling and event design for every mood.',
    image:
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Makeup & Beauty',
    description: 'Soft glam looks and bridal styling that feel personal.',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Mehndi',
    description: 'Intricate designs and artistry that tell your story.',
    image:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Music & Entertainment',
    description: 'Live sounds and unforgettable moments for the dance floor.',
    image:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Wedding Invitations',
    description: 'Paper goods and digital suites that set the tone.',
    image:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
  },
];

const inspirationItems = [
  {
    title: 'Wedding Decor',
    image:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Bridal Looks',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Wedding Photography',
    image:
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Reception Ideas',
    image:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  },
];

const benefits = [
  'Verified Vendors',
  'Easy Planning',
  'Transparent Information',
  'Personalized Experience',
  'Secure Booking',
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [featuredVenues, setFeaturedVenues] = useState([]);
  const [venueLoading, setVenueLoading] = useState(true);
  const [venueError, setVenueError] = useState('');
  const [venueSearch, setVenueSearch] = useState({ city: '', venueType: '' });

  useEffect(() => {
    let active = true;
    searchVenues()
      .then((venues) => {
        if (active) setFeaturedVenues(venues.slice(0, 4));
      })
      .catch((error) => {
        if (active) setVenueError(error.response?.data?.message || 'Featured venues are temporarily unavailable.');
      })
      .finally(() => {
        if (active) setVenueLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const submitVenueSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams(Object.entries(venueSearch).filter(([, value]) => value));
    navigate(`/venues${params.size ? `?${params}` : ''}`);
  };

  return (
    <div className="home-shell">
      <header className="topbar">
        <div className="brand-mark">
          <div className="brand-icon">W</div>
          <span>Wedding Planner</span>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => <Link to={item.to} key={item.label}>{item.label}</Link>)}
        </nav>

        <div className="topbar-actions">
          {isAuthenticated ? (
            <Link className="nav-button nav-button-subtle" to={`/${user.role}/dashboard`}>
              Dashboard
            </Link>
          ) : (
            <Link className="nav-button nav-button-subtle" to="/login">
              Login
            </Link>
          )}

          <Link className="nav-button nav-button-primary" to={isAuthenticated ? `/${user.role}/dashboard` : '/register'}>
            {isAuthenticated ? 'My Wedding' : 'Get Started'}
          </Link>
        </div>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-content">
            <p className="eyebrow">PLAN YOUR PERFECT DAY</p>
            <h1>Your dream wedding, beautifully planned.</h1>
            <p className="hero-copy">
              Discover trusted wedding vendors, plan every detail, and bring your celebration to life — all in one place.
            </p>

            <div className="hero-actions">
              <Link className="primary-button" to="/venues">
                Explore Vendors
              </Link>
              <Link className="secondary-button" to={isAuthenticated ? `/${user.role}/dashboard` : '/register'}>
                Start Planning
              </Link>
            </div>

            <form className="search-panel" aria-label="Wedding venue search" onSubmit={submitVenueSearch}>
              <div className="search-field search-field--wide">
                <label htmlFor="search-service">Venue style</label>
                <select id="search-service" value={venueSearch.venueType} onChange={(event) => setVenueSearch((current) => ({ ...current, venueType: event.target.value }))}>
                  <option value="">All venue types</option>
                  {venueTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
              <div className="search-field">
                <label htmlFor="search-city">Location</label>
                <input id="search-city" value={venueSearch.city} onChange={(event) => setVenueSearch((current) => ({ ...current, city: event.target.value }))} placeholder="Enter city" />
              </div>
              <button type="submit" className="search-button">Find Venues</button>
            </form>
          </div>

          <div className="hero-visual" aria-label="Wedding planning highlight photo">
            <img
              src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80"
              alt="Couple walking together on their wedding day"
            />
          </div>
        </section>

        <section className="content-section" id="services">
          <div className="section-heading">
            <p className="eyebrow">Everything your wedding needs</p>
            <h2>Explore services designed around your celebration.</h2>
          </div>

          <div className="services-grid">
            {serviceItems.map((service) => (
              <article className="service-card" key={service.title}>
                <img src={service.image} alt={service.title} />
                <div className="service-card__body">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  {service.title === 'Venues' && <Link to="/venues">Explore venues</Link>}
                  {service.title === 'Catering' && <Link to="/catering">Explore catering</Link>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section" id="find-vendors">
          <div className="section-heading inline-heading">
            <div>
              <p className="eyebrow">Approved venue partners</p>
              <h2>Spaces for your celebration.</h2>
            </div>
            <Link className="text-link" to="/venues">
              View all venues
            </Link>
          </div>

          {venueLoading && <div className="venue-state">Loading approved venues…</div>}
          {!venueLoading && venueError && <div className="venue-state venue-state-error" role="alert">{venueError}</div>}
          {!venueLoading && !venueError && featuredVenues.length === 0 && <div className="venue-state"><h3>No approved venues yet.</h3><p>New venues will appear here once they have been reviewed.</p></div>}
          {!venueLoading && !venueError && featuredVenues.length > 0 && (
            <div className="vendor-grid">
              {featuredVenues.map((venue) => (
                <article className="vendor-card" key={venue._id}>
                  <VenueImage src={venue.coverImage} alt={`${venue.venueName} wedding venue`} />
                  <div className="vendor-card__body">
                    <div className="vendor-header"><div><h3>{venue.venueName}</h3><span>{venue.venueType}</span></div><span className="verified-pill">Approved</span></div>
                    <div className="vendor-meta"><span>{venue.city}, {venue.state}</span><span>{venue.minimumGuests}–{Math.min(venue.maximumGuests, venue.seatingCapacity)} guests</span></div>
                    <div className="vendor-footer"><div><small>Starting at</small><strong>₹{Number(venue.startingPrice).toLocaleString('en-IN')} · {venue.priceType}</strong></div><Link className="mini-button" to={`/venues/${venue._id}`}>View Venue</Link></div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="content-section steps-section" id="how-it-works">
          <div className="section-heading">
            <p className="eyebrow">How it works</p>
            <h2>Simple steps from inspiration to celebration.</h2>
          </div>

          <div className="steps-grid">
            {[
              ['01', 'Discover', 'Find wedding vendors and services.'],
              ['02', 'Compare', 'Explore profiles, pricing and reviews.'],
              ['03', 'Plan', 'Save your choices and organize your wedding.'],
              ['04', 'Celebrate', 'Book and enjoy your special day.'],
            ].map(([number, title, copy]) => (
              <div className="step-card" key={number}>
                <span className="step-number">{number}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section" id="ideas">
          <div className="section-heading">
            <p className="eyebrow">Wedding inspiration</p>
            <h2>Ideas for every beautiful chapter of your story.</h2>
          </div>

          <div className="inspiration-grid">
            {inspirationItems.map((item) => (
              <article className="inspiration-card" key={item.title}>
                <img src={item.image} alt={item.title} />
                <div className="inspiration-overlay">
                  <h3>{item.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section benefits-section" id="why-wedding-planner">
          <div className="section-heading">
            <p className="eyebrow">Why Wedding Planner</p>
            <h2>Everything you need to feel prepared and excited.</h2>
          </div>

          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div className="benefit-item" key={benefit}>
                <span className="benefit-icon">0{index + 1}</span>
                <p>{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="final-cta">
          <div>
            <p className="eyebrow">Your wedding story starts here.</p>
            <h2>Start planning your celebration with confidence.</h2>
          </div>
          <Link className="primary-button" to={isAuthenticated ? `/${user.role}/dashboard` : '/register'}>
            Start Planning
          </Link>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-grid">
          <div>
            <div className="brand-mark">
              <div className="brand-icon">W</div>
              <span>Wedding Planner</span>
            </div>
            <p>Beautiful weddings start with thoughtful planning.</p>
          </div>

          <div>
            <h4>Discover</h4>
            <ul>
              <li>Home</li>
              <li>Find Vendors</li>
              <li>Ideas</li>
            </ul>
          </div>

          <div>
            <h4>Services</h4>
            <ul>
              <li>Venues</li>
              <li>Photography</li>
              <li>Catering</li>
            </ul>
          </div>

          <div>
            <h4>For Vendors</h4>
            <ul>
              <li>Join Us</li>
              <li>Business Profile</li>
              <li>Support</li>
            </ul>
          </div>

          <div>
            <h4>Company</h4>
            <ul>
              <li>About</li>
              <li>Contact</li>
              <li>Privacy</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Wedding Planner</span>
          <div className="social-links" aria-label="social media">
            <span>Instagram</span>
            <span>Pinterest</span>
            <span>Facebook</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
