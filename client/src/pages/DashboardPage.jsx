import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getAdminVenueBookings, getUserVenueBookings, getVendorVenueBookings } from '../services/bookingService';
import { getAdminVenues, getVendorVenues } from '../services/venueService';
import NotificationPanel from '../components/NotificationPanel';
import VendorProfileEditor from '../components/VendorProfileEditor';

const navigation = {
  user: [
    ['Overview', '/user/dashboard'],
    ['My Profile', null],
    ['My Favorites', null],
    ['My Venue Enquiries', '/user/bookings'],
    ['My Catering Bookings', '/user/catering-bookings'],
    ['My Service Enquiries', '/user/enquiries'],
    ['Budget & Estimates', '/user/budget'],
    ['My Wedding', null],
    ['Messages', null],
    ['Settings', null],
  ],
  vendor: [
    ['Dashboard', '/vendor/dashboard'],
    ['My Business', null],
    ['Services', '/vendor/services', [
      ['All Services', '/vendor/services'],
      ['Wedding Venues', '/vendor/venues'],
      ['Catering', '/vendor/catering'],
      ['Wedding Decorators', '/vendor/services'],
    ]],
    ['Inquiries & Bookings', null, [
      ['Venue Enquiries', '/vendor/bookings'],
      ['Catering', '/vendor/catering-bookings'],
      ['Decorator Enquiries', '/vendor/decorator-enquiries'],
    ]],
    ['Calendar', null],
    ['Portfolio', '/vendor/portfolio'],
    ['Reviews', null],
    ['Analytics', null],
    ['Messages', null],
    ['Settings', null],
  ],
  admin: [
    ['Overview', '/admin/dashboard'],
    ['Users', null],
    ['Vendors', null],
    ['Services', null, [
      ['Venues', '/admin/venues'],
      ['Catering', '/admin/catering'],
      ['Wedding Decorators', '/admin/decorators'],
    ]],
    ['Bookings', '/admin/bookings'],
    ['Reviews', null],
    ['Reports', null],
    ['Settings', null],
  ],
};

const dateLabel = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export default function DashboardPage({ role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [venues, setVenues] = useState([]);
  const [venueStats, setVenueStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, disabled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleDropdown = (label) => {
    setOpenDropdowns(prev => ({ ...prev, [label]: !prev[label] }));
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (role === 'user') {
          const result = await getUserVenueBookings();
          if (active) setBookings(result);
        } else if (role === 'vendor') {
          const [bookingResult, venueResult] = await Promise.all([getVendorVenueBookings(), getVendorVenues()]);
          if (active) {
            setBookings(bookingResult);
            setVenues(venueResult);
          }
        } else {
          const [bookingResult, venueResult] = await Promise.all([getAdminVenueBookings(), getAdminVenues()]);
          if (active) {
            setBookings(bookingResult);
            setVenues(venueResult.data);
            setVenueStats(venueResult.stats);
          }
        }
      } catch (apiError) {
        if (active) setError(apiError.response?.data?.message || 'Dashboard information could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [role]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const pendingBookings = bookings.filter((booking) => booking.status === 'pending');
  const acceptedBookings = bookings.filter((booking) => ['accepted', 'confirmed'].includes(booking.status));
  const activeVenues = venues.filter((venue) => venue.approvalStatus === 'approved' && venue.isActive);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const acceptedEstimateThisMonth = acceptedBookings
    .filter((booking) => new Date(booking.updatedAt) >= monthStart)
    .reduce((total, booking) => total + (booking.estimatedPrice || 0), 0);

  const userDashboard = () => (
    <>
      <section className="stats-grid">
        {[
          ['Wedding date', 'Not set'],
          ['Guest count', 'Not set'],
          ['Venue requests', loading ? 'Loading…' : bookings.length],
          ['Confirmed bookings', loading ? 'Loading…' : acceptedBookings.length],
        ].map(([label, value]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}
      </section>

      <section className="panel-grid two-columns">
        <div className="panel panel-large">
          <div className="panel-header"><h2>My Venue Requests</h2><Link to="/user/bookings">View all</Link></div>
          {loading ? <p className="dashboard-empty">Refreshing booking status…</p> : bookings.length === 0 ? (
            <div className="dashboard-empty"><p>Your venue requests will appear here.</p><Link to="/venues">Explore wedding venues</Link></div>
          ) : (
            <div className="booking-list">{bookings.slice(0, 4).map((booking) => (
              <div className="booking-row" key={booking._id}>
                <div><strong>{booking.venue?.venueName || 'Venue unavailable'}</strong><small>{dateLabel(booking.eventDate)} · {booking.guestCount} guests</small></div>
                <span className={`booking-status ${booking.status}`}>{booking.status}</span>
              </div>
            ))}</div>
          )}
        </div>
        <div className="panel">
          <div className="panel-header"><h2>Saved Vendors</h2></div>
          <div className="dashboard-empty"><p>Saved vendors will appear here when favorites are available.</p><Link to="/venues">Browse venues</Link></div>
        </div>
      </section>

      <section className="panel-grid two-columns">
        <div className="panel">
          <div className="panel-header"><h2>Upcoming Bookings</h2><Link to="/user/bookings">See all</Link></div>
          {acceptedBookings.length === 0 ? <p className="dashboard-empty">No accepted venue bookings yet.</p> : (
            <div className="booking-list">{acceptedBookings.slice(0, 4).map((booking) => (
              <div className="booking-row" key={booking._id}><div><strong>{booking.venue?.venueName || 'Venue unavailable'}</strong><small>{booking.vendor?.businessName || booking.vendor?.name || 'Venue partner'}</small></div><div className="booking-meta"><span>{dateLabel(booking.eventDate)}</span><em>Accepted</em></div></div>
            ))}</div>
          )}
        </div>
        <div className="panel">
          <div className="panel-header"><h2>Find your venue</h2></div>
          <p className="dashboard-empty">Explore current listings, compare capacity and check a date directly with each venue.</p>
          <Link className="small-button dashboard-action-link" to="/venues">Browse venues</Link>
        </div>
      </section>
    </>
  );

  const vendorDashboard = () => (
    <>
      <section className="stats-grid">
        {[
          ['Total enquiries', loading ? 'Loading…' : bookings.length],
          ['Upcoming bookings', loading ? 'Loading…' : acceptedBookings.filter((booking) => new Date(booking.eventDate) >= new Date()).length],
          ['Confirmed booking estimates', loading ? 'Loading…' : `₹${acceptedEstimateThisMonth.toLocaleString('en-IN')}`],
          ['Approved active venues', loading ? 'Loading…' : activeVenues.length],
        ].map(([label, value]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}
      </section>

      <section className="panel-grid two-columns">
        <div className="panel panel-large">
          <div className="panel-header"><h2>Booking Overview</h2><Link to="/vendor/bookings">View requests</Link></div>
          {loading ? <p className="dashboard-empty">Loading current booking activity…</p> : bookings.length === 0 ? <p className="dashboard-empty">No booking activity yet. Approved venue requests will appear here.</p> : (
            <div className="analytics-stack">
              {['pending', 'quotation_sent', 'accepted', 'confirmed', 'rejected', 'cancelled', 'completed'].map((status) => <div key={status}><span>{status.replace('_', ' ').replace(/^\w/, (letter) => letter.toUpperCase())}</span><strong>{bookings.filter((booking) => booking.status === status).length}</strong></div>)}
            </div>
          )}
        </div>
        <div className="panel">
          <div className="panel-header"><h2>Business Profile</h2><Link to="/vendor/venues">Manage venues</Link></div>
          <div className="profile-card"><strong>{user?.name || 'Vendor account'}</strong><span>Wedding venue partner</span><small>{user?.email}</small><Link to={`/vendors/${user?.id}`}>View public business profile</Link><VendorProfileEditor /></div>
        </div>
      </section>

      <section className="panel-grid two-columns">
        <div className="panel">
          <div className="panel-header"><h2>Recent Booking Requests</h2><Link to="/vendor/bookings">View all</Link></div>
          {loading ? <p className="dashboard-empty">Loading requests…</p> : pendingBookings.length === 0 ? <p className="dashboard-empty">No pending booking requests.</p> : (
            <div className="booking-list">{pendingBookings.slice(0, 4).map((booking) => <div className="booking-row" key={booking._id}><div><strong>{booking.user?.name || 'Customer'}</strong><small>{booking.venue?.venueName || 'Venue'} · {dateLabel(booking.eventDate)}</small></div><span className="booking-status pending">Pending</span></div>)}</div>
          )}
        </div>
        <div className="panel">
          <div className="panel-header"><h2>Quick Actions</h2></div>
          <div className="quick-actions"><Link className="action-button" to="/vendor/venues/add">Add a wedding venue</Link><Link className="action-button neutral" to="/vendor/venues">Manage my venues</Link><Link className="action-button neutral" to="/vendor/bookings">Review booking requests</Link></div>
        </div>
      </section>
    </>
  );

  const adminDashboard = () => (
    <>
      <section className="stats-grid">
        {[
          ['Total venue listings', loading ? 'Loading…' : venueStats.total],
          ['Pending venue reviews', loading ? 'Loading…' : venueStats.pending],
          ['Active approved venues', loading ? 'Loading…' : venueStats.approved],
          ['Venue bookings', loading ? 'Loading…' : bookings.length],
        ].map(([label, value]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}
      </section>

      <section className="panel-grid two-columns">
        <div className="panel">
          <div className="panel-header"><h2>Recently submitted venues</h2><Link to="/admin/venues">Moderate venues</Link></div>
          {loading ? <p className="dashboard-empty">Loading venue listings…</p> : venues.length === 0 ? <p className="dashboard-empty">No venue listings have been submitted yet.</p> : (
            <div className="booking-list">{venues.slice(0, 5).map((venue) => <div className="booking-row" key={venue._id}><div><strong>{venue.venueName}</strong><small>{venue.vendor?.businessName || venue.vendor?.name || 'Vendor'} · {venue.city}</small></div><span className={`moderation-badge ${venue.approvalStatus}`}>{venue.approvalStatus}</span></div>)}</div>
          )}
        </div>
        <div className="panel">
          <div className="panel-header"><h2>Venue Bookings</h2><Link to="/admin/bookings">Monitor all</Link></div>
          {loading ? <p className="dashboard-empty">Loading booking activity…</p> : bookings.length === 0 ? <p className="dashboard-empty">No venue booking records yet.</p> : (
            <div className="booking-list">{bookings.slice(0, 5).map((booking) => <div className="booking-row" key={booking._id}><div><strong>{booking.venue?.venueName || 'Venue unavailable'}</strong><small>{booking.user?.name || 'Customer'} · {dateLabel(booking.eventDate)}</small></div><span className={`booking-status ${booking.status}`}>{booking.status}</span></div>)}</div>
          )}
        </div>
      </section>
    </>
  );

  const pageTitle = role === 'admin' ? 'Platform Overview' : `Good morning, ${user?.name || 'there'}`;
  const subtitle = {
    user: "Let's make your wedding plans come together.",
    vendor: "Here's how your wedding business is performing.",
    admin: 'Monitor venue listings, booking requests and platform activity.',
  }[role];

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand"><div className="brand-icon">W</div><div><strong>Wedding Planner</strong><small>{role} portal</small></div></div>
        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          {navigation[role].map((item) => {
            const [label, href, children] = item;
            if (children) {
              const sectionIsActive = children.some(([, childHref]) => (
                childHref && (location.pathname === childHref || location.pathname.startsWith(`${childHref}/`))
              ));
              return (
                <div key={label} className="nav-dropdown">
                  <button
                    type="button"
                    className={`nav-link dropdown-toggle ${sectionIsActive ? 'active' : ''} ${openDropdowns[label] ? 'open' : ''}`}
                    onClick={() => toggleDropdown(label)}
                    aria-expanded={Boolean(openDropdowns[label])}
                    aria-controls={`dashboard-submenu-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`}
                  >
                    {label}
                  </button>
                  {openDropdowns[label] && (
                    <div
                      id={`dashboard-submenu-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`}
                      className="dashboard-nav-submenu"
                    >
                      {children.map(([childLabel, childHref]) => childHref 
                        ? <Link
                          className={`nav-link nav-child ${location.pathname === childHref || location.pathname.startsWith(`${childHref}/`) ? 'active' : ''}`}
                          key={childLabel}
                          to={childHref}
                        >{childLabel}</Link> 
                        : <button type="button" className="nav-link nav-child" key={childLabel} disabled>{childLabel}</button>
                      )}
                    </div>
                  )}
                </div>
              );
            }
            return href
              ? <Link className={`nav-link ${['Overview', 'Dashboard'].includes(label) ? 'active' : ''}`} key={label} to={href}>{label}</Link>
              : <button type="button" className="nav-link" key={label} disabled>{label}</button>
          })}
        </nav>
        <button type="button" className="logout-button" onClick={handleLogout}>Log out</button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div><p className="eyebrow dashboard-eyebrow">{role} dashboard</p><h1>{pageTitle}</h1><p className="dashboard-subtitle">{subtitle}</p></div>
          <div className="topbar-user-row"><NotificationPanel /><span className="user-badge" aria-label={`Signed in as ${user?.name || 'user'}`}>{user?.name?.charAt(0) || 'U'}</span></div>
        </header>
        {error && <div className="venue-alert error" role="alert">{error}</div>}
        {role === 'user' && userDashboard()}
        {role === 'vendor' && vendorDashboard()}
        {role === 'admin' && adminDashboard()}
      </main>
    </div>
  );
}
