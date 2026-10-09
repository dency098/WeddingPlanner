import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CancelBookingDialog from '../components/CancelBookingDialog';
import VenueImage from '../components/VenueImage';
import {
  cancelAdminVenueBooking,
  completeAdminVenueBooking,
  getAdminVenueBookings,
} from '../services/bookingService';

const statuses = ['', 'pending', 'quotation_sent', 'accepted', 'confirmed', 'rejected', 'cancelled', 'completed'];

export default function AdminBookingsPage() {
  const [status, setStatus] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [working, setWorking] = useState('');

  const refresh = async () => setBookings(await getAdminVenueBookings(status));

  useEffect(() => {
    let active = true;
    getAdminVenueBookings(status)
      .then((result) => { if (active) setBookings(result); })
      .catch((apiError) => { if (active) setError(apiError.response?.data?.message || 'Could not load booking records.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status]);

  const changeStatus = (value) => {
    setLoading(true);
    setError('');
    setStatus(value);
  };

  const cancel = async (reason) => {
    setWorking(cancelTarget._id);
    setError('');
    try {
      const result = await cancelAdminVenueBooking(cancelTarget._id, reason);
      setNotice(result.message);
      setCancelTarget(null);
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Booking could not be cancelled.');
    } finally {
      setWorking('');
    }
  };

  const complete = async (booking) => {
    setWorking(booking._id);
    setError('');
    setNotice('');
    try {
      const result = await completeAdminVenueBooking(booking._id);
      setNotice(result.message);
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Booking could not be completed.');
    } finally {
      setWorking('');
    }
  };

  return (
    <main className="venue-management-page">
      <header className="venue-management-heading">
        <div><p className="eyebrow">Platform operations</p><h1>Venue Bookings</h1><p>Monitor booking requests and their current database status.</p></div>
        <Link className="secondary-button" to="/admin/venues">Manage venues</Link>
      </header>
      <label className="booking-status-filter">Booking status
        <select value={status} onChange={(event) => changeStatus(event.target.value)}>{statuses.map((item) => <option key={item} value={item}>{item ? item[0].toUpperCase() + item.slice(1) : 'All statuses'}</option>)}</select>
      </label>
      {error && <div className="venue-alert error" role="alert">{error}</div>}
      {notice && <div className="venue-alert success" role="status">{notice}</div>}
      {loading && <div className="venue-state">Loading venue bookings…</div>}
      {!loading && !error && bookings.length === 0 && <div className="venue-state"><h2>No booking records found.</h2><p>Venue requests will be listed here when couples submit them.</p></div>}
      {!loading && bookings.length > 0 && <div className="admin-booking-list">{bookings.map((booking) => (
        <article className="admin-booking-row" key={booking._id}>
          <VenueImage className="booking-venue-thumb" src={booking.venue?.coverImage} alt={`${booking.venue?.venueName || 'Venue'} cover`} />
          <div className="admin-booking-info">
            <div className="booking-card-topline"><div><p className="venue-location">{booking.eventType} · {new Date(booking.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'UTC' })}</p><h2>{booking.venue?.venueName || 'Venue record unavailable'}</h2></div><span className={`booking-status ${booking.status}`}>{booking.status}</span></div>
            <div className="booking-detail-chips"><span>Couple: {booking.user?.name || 'Unavailable'}</span><span>Vendor: {booking.vendor?.businessName || booking.vendor?.name || 'Unavailable'}</span><span>{booking.guestCount} guests</span><span>Estimate ₹{Number(booking.estimatedPrice).toLocaleString('en-IN')}</span></div>
            {booking.message && <p className="admin-booking-message">{booking.message}</p>}
            {booking.cancelledAt && <p className="admin-booking-message"><strong>Cancelled by:</strong> {booking.cancelledBy} · <strong>Reason:</strong> {booking.cancellationReason}</p>}
            <div className="booking-response-actions admin-booking-actions">
              {['pending', 'quotation_sent', 'accepted', 'confirmed'].includes(booking.status) && (
                <button className="danger-button" type="button" disabled={working === booking._id} onClick={() => setCancelTarget(booking)}>Cancel booking</button>
              )}
              {['accepted', 'confirmed'].includes(booking.status) && new Date(booking.eventDate) <= new Date(new Date().setHours(0, 0, 0, 0)) && (
                <button className="primary-button" type="button" disabled={working === booking._id} onClick={() => complete(booking)}>{working === booking._id ? 'Saving…' : 'Mark completed'}</button>
              )}
            </div>
          </div>
        </article>
      ))}</div>}
      {cancelTarget && <CancelBookingDialog booking={cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={cancel} working={working === cancelTarget._id} requestError={error} />}
    </main>
  );
}
