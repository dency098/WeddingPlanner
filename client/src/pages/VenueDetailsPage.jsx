import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EventScheduleForm from '../components/EventScheduleForm';
import { CompareButton } from '../components/ComparisonControls';
import VenueImage from '../components/VenueImage';
import { useAuth } from '../context/useAuth';
import { createVenueEnquiry } from '../services/venueEnquiryService';
import { checkVenueAvailability, getVenue } from '../services/venueService';

const formatPrice = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

export default function VenueDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Multi-Date Event Schedule State
  const [schedule, setSchedule] = useState([
    {
      eventType: 'Wedding Ceremony',
      eventDate: '',
      guestCount: 200,
      notes: '',
    },
  ]);

  // Venue Enquiry Form State
  const [enquiry, setEnquiry] = useState({
    city: '',
    budget: '₹3,00,000 – ₹5,00,000',
    cateringRequired: true,
    decorationRequired: true,
    djRequired: false,
    numberOfRooms: '10',
    message: '',
  });

  // Availability validation state
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [availabilityByEvent, setAvailabilityByEvent] = useState([]);
  const [availabilityRetry, setAvailabilityRetry] = useState(0);

  useEffect(() => {
    let active = true;
    getVenue(id)
      .then((result) => {
        if (active) {
          setVenue(result);
          setEnquiry((prev) => ({
            ...prev,
            city: result.city || '',
            numberOfRooms: String(result.numberOfRooms || 0),
          }));

          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + 30);

          setSchedule([
            {
              eventType: 'Wedding Ceremony',
              eventDate: nextDate.toISOString().slice(0, 10),
              guestCount: result.minimumGuests || 200,
              startTime: '',
              endTime: '',
              requirements: '',
              notes: '',
            },
          ]);
        }
      })
      .catch((apiError) => {
        if (active) setError(apiError.response?.data?.message || 'We could not find this venue.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // Check every event independently; enquiries do not reserve dates.
  useEffect(() => {
    if (!venue) return undefined;
    let active = true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checks = schedule.map((event, index) => {
      const guestCount = Number(event.guestCount);
      if (!event.eventDate) return { index, status: 'incomplete', reason: 'Select an event date.' };
      const eventDate = new Date(`${event.eventDate}T00:00:00`);
      if (Number.isNaN(eventDate.getTime())) return { index, status: 'unavailable', reason: 'Select a valid event date.' };
      if (eventDate < today) return { index, status: 'unavailable', reason: 'Past event dates are not allowed.' };
      if (!Number.isInteger(guestCount) || guestCount < 1) {
        return { index, status: 'unavailable', reason: 'Guest count must be a positive whole number.' };
      }
      if (guestCount < venue.minimumGuests || guestCount > Math.min(venue.maximumGuests, venue.seatingCapacity)) {
        return { index, status: 'unavailable', reason: `Guest count must be between ${venue.minimumGuests} and ${Math.min(venue.maximumGuests, venue.seatingCapacity)}.` };
      }
      return { index, status: 'checking', reason: '' };
    });
    setAvailabilityByEvent(checks);
    setAvailabilityError('');

    const validEvents = schedule
      .map((event, index) => ({ ...event, index, guestCount: Number(event.guestCount) }))
      .filter((event) => checks[event.index].status === 'checking')
      .map(({ eventType, eventDate, guestCount, index }) => ({ eventType, eventDate, guestCount, index }));

    if (validEvents.length === 0) {
      setCheckingAvailability(false);
      return () => { active = false; };
    }

    setCheckingAvailability(true);
    checkVenueAvailability(venue._id, validEvents)
      .then((result) => {
        if (!active) return;
        const resultByIndex = new Map((result.eventAvailability || []).map((item) => [item.index, item]));
        setAvailabilityByEvent((current) => current.map((item) => {
          const apiResult = resultByIndex.get(item.index);
          return item.status !== 'checking' ? item : apiResult
            ? { ...item, status: apiResult.status, reason: apiResult.reason || '' }
            : { ...item, status: 'unknown', reason: 'Availability was not returned for this event.' };
        }));
      })
      .catch((apiError) => {
        if (!active) return;
        const message = apiError.response?.data?.message || 'Could not verify event availability. Please retry.';
        setAvailabilityError(message);
        setAvailabilityByEvent((current) => current.map((item) =>
          item.status === 'checking' ? { ...item, status: 'unknown', reason: message } : item
        ));
      })
      .finally(() => {
        if (active) setCheckingAvailability(false);
      });
    return () => { active = false; };
  }, [venue, schedule, availabilityRetry]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEnquiry((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSendEnquiry = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || user?.role !== 'user') {
      navigate('/login');
      return;
    }

    if (
      checkingAvailability ||
      availabilityError ||
      availabilityByEvent.length !== schedule.length ||
      availabilityByEvent.some((item) => item.status !== 'available')
    ) {
      return;
    }

    setSubmitting(true);
    setNotice('');
    setError('');

    try {
      const primary = schedule[0];
      const payload = {
        venueId: venue._id,
        eventType: primary.eventType,
        eventDate: primary.eventDate,
        eventSchedule: schedule,
        city: enquiry.city || venue.city,
        guestCount: Number(primary.guestCount),
        venueName: venue.venueName,
        preferredVenueType: venue.venueType,
        budget: enquiry.budget,
        cateringRequired: enquiry.cateringRequired,
        decorationRequired: enquiry.decorationRequired,
        djRequired: enquiry.djRequired,
        numberOfRooms: Number(enquiry.numberOfRooms || 0),
        message: enquiry.message,
        userName: user?.name || user?.fullName || '',
        userEmail: user?.email || '',
        userPhone: user?.phone || '',
      };

      await createVenueEnquiry(payload);
      setNotice('✓ Venue enquiry sent successfully! Redirecting to your enquiries dashboard...');
      setTimeout(() => {
        navigate('/user/bookings');
      }, 1500);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to send venue enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <main className="container py-5 text-center">Loading venue details…</main>;
  if (error || !venue) return <main className="container py-5 text-center text-danger" role="alert">{error || 'Venue not found.'}<p className="mt-3"><Link to="/venues" className="btn btn-outline-secondary">Back to venues</Link></p></main>;

  const images = [...new Set([venue.coverImage, ...(venue.gallery || [])].filter(Boolean))];

  return (
    <main className="venue-detail-page py-4">
      <header className="venue-public-header mb-4">
        <Link to="/" className="brand-mark"><span className="brand-icon">W</span><span>Wedding Planner</span></Link>
        <nav aria-label="Venue navigation"><Link to="/venues">Wedding Venues</Link><Link to="/">Home</Link></nav>
        <Link className="venue-header-cta" to="/user/bookings">My Venue Enquiries</Link>
      </header>

      <div className="venue-detail-breadcrumb mb-3"><Link to="/venues">Venues</Link><span>/</span><span>{venue.city}</span></div>

      <section className="venue-gallery mb-4" aria-label="Venue photos">
        <div className="venue-gallery-main"><VenueImage src={images[0]} alt={`${venue.venueName} venue`} /></div>
        <div className="venue-gallery-side">
          {images.slice(1, 3).map((image, index) => <VenueImage key={image} src={image} alt={`${venue.venueName} photo ${index + 2}`} />)}
          {images.length < 2 && <div className="gallery-empty-note">More photographs coming soon</div>}
        </div>
      </section>

      <div className="venue-details-layout">
        {/* LEFT COLUMN - VENUE DETAILS */}
        <article className="venue-detail-content">
          <span className="badge bg-primary text-uppercase mb-2" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            {venue.venueType}
          </span>
          <p className="eyebrow" style={{ marginTop: '6px' }}>{venue.city}, {venue.state}</p>
          <h1 className="h2 fw-bold text-dark">{venue.venueName}</h1>
          <p className="venue-address text-muted">
            📍 {venue.address}
            {venue.landmark && <span> (Landmark: {venue.landmark})</span>}
            {venue.area && <span> · {venue.area}</span>}
          </p>
          
          {(venue.contactPhone || venue.contactEmail) && (
            <p className="text-secondary small">
              <strong>Direct Contact:</strong> {venue.contactPhone && <span>📞 {venue.contactPhone} </span>} {venue.contactEmail && <span>✉️ {venue.contactEmail}</span>}
            </p>
          )}

          <div className="my-3">
            <CompareButton venueId={venue._id} />
          </div>

          <div className="venue-price-summary p-3 bg-light rounded border mb-4">
            <strong className="fs-3 text-primary">{formatPrice(venue.startingPrice)}</strong>
            <span className="ms-2 text-muted fw-semibold">({venue.priceType})</span>
            {venue.baseRentalFee > 0 && <span className="ms-3 text-secondary small">Base Rental: {formatPrice(venue.baseRentalFee)}/day</span>}
          </div>

          <p className="venue-description lead text-secondary fs-6">{venue.description}</p>

          {venue.eventTypes?.length > 0 && (
            <section className="venue-detail-section my-4">
              <h2 className="h5 fw-bold mb-3">Event Types Hosted</h2>
              <div className="d-flex flex-wrap gap-2">
                {venue.eventTypes.map((et) => <span key={et} className="badge bg-secondary-subtle text-dark border px-3 py-2">{et}</span>)}
              </div>
            </section>
          )}

          <section className="venue-detail-section my-4">
            <h2 className="h5 fw-bold mb-3">Capacity & Settings</h2>
            <div className="venue-facts-grid p-3 bg-white border rounded">
              <div><span>Guest range</span><strong>{venue.minimumGuests}–{Math.min(venue.maximumGuests, venue.seatingCapacity)} guests</strong></div>
              <div><span>Seating capacity</span><strong>{venue.seatingCapacity} guests</strong></div>
              {venue.floatingCapacity && <div><span>Floating capacity</span><strong>{venue.floatingCapacity} guests</strong></div>}
              <div><span>Parking capacity</span><strong>{venue.parkingCapacity ? `${venue.parkingCapacity} vehicles` : 'Not listed'}</strong></div>
              <div><span>Number of rooms</span><strong>{venue.numberOfRooms || 'Not listed'}</strong></div>
              <div><span>Event duration</span><strong>{venue.eventDuration || '—'} hours</strong></div>
            </div>
          </section>

          <section className="venue-detail-section my-4">
            <h2 className="h5 fw-bold mb-3">Facilities & Amenities</h2>
            {venue.facilities?.length ? (
              <div className="d-flex flex-wrap gap-2">
                {venue.facilities.map((facility) => <span key={facility} className="badge bg-light text-dark border px-3 py-2">{facility}</span>)}
              </div>
            ) : <p className="text-muted">Facilities have not been listed.</p>}
          </section>

          <section className="venue-detail-section my-4">
            <h2 className="h5 fw-bold mb-3">Policies & Pricing Details</h2>
            <div className="policy-list p-3 bg-white border rounded">
              <div><strong>Decoration Policy</strong><p>{venue.decorationPolicy || 'In-house only'}</p></div>
              <div><strong>Catering Policy</strong><p>{venue.cateringPolicy || 'In-house only'}</p></div>
              {venue.alcoholPolicy && <div><strong>Alcohol Policy</strong><p>{venue.alcoholPolicy}</p></div>}
              <div><strong>Cancellation policy</strong><p>{venue.cancellationPolicy || 'Please contact the venue for cancellation details.'}</p></div>
              <div>
                <strong>Advance payment</strong>
                <p>
                  {venue.advancePaymentPercentage ? `${venue.advancePaymentPercentage}% advance required` : venue.advancePayment ? formatPrice(venue.advancePayment) : 'To be discussed with the venue'}
                </p>
              </div>
              {venue.additionalCharges?.length > 0 && (
                <div>
                  <strong>Additional Charges</strong>
                  <ul className="mb-0">
                    {venue.additionalCharges.map((ch, idx) => (
                      <li key={idx}>{ch.name}: {formatPrice(ch.amount)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <section className="venue-detail-section my-4">
            <h2 className="h5 fw-bold mb-3">About the Vendor Partner</h2>
            <div className="venue-vendor-summary p-3 bg-white border rounded d-flex gap-3 align-items-center">
              {venue.vendor?.profileImage && <img src={venue.vendor.profileImage} alt="" className="rounded-circle" style={{ width: '64px', height: '64px', objectFit: 'cover' }} />}
              <div>
                <h3 className="h6 fw-bold mb-1">{venue.vendor?.businessName || venue.vendor?.name || 'Wedding venue partner'}</h3>
                {venue.vendor?.businessLocation && <p className="text-muted small mb-1">{venue.vendor.businessLocation}</p>}
                {venue.vendor?.yearsOfExperience !== null && venue.vendor?.yearsOfExperience !== undefined && (
                  <p className="text-muted small mb-1">{venue.vendor.yearsOfExperience} {venue.vendor.yearsOfExperience === 1 ? 'year' : 'years'} of experience</p>
                )}
                {venue.vendor?._id && <Link className="btn btn-sm btn-outline-primary mt-2" to={`/vendors/${venue.vendor._id}`}>View Vendor Profile</Link>}
              </div>
            </div>
          </section>
        </article>

        {/* RIGHT COLUMN - ENQUIRY FORM PANEL */}
        <aside className="booking-request-panel card shadow-sm border-0 p-4" id="enquiry">
          <div className="card-body p-0">
            <span className="badge bg-success-subtle text-success border border-success mb-2 px-3 py-1">ENQUIRY PROCESS ONLY</span>
            <h2 className="h4 fw-bold text-dark mb-1">Send Venue Enquiry</h2>
            <p className="text-muted small mb-4">Request date availability, custom pricing, and package options from <strong>{venue.venueName}</strong>.</p>

            {notice && <div className="alert alert-success small mb-3" role="status">{notice}</div>}
            {error && <div className="alert alert-danger small mb-3" role="alert">{error}</div>}

            <form onSubmit={handleSendEnquiry} className="needs-validation">
              {/* REPEATABLE MULTI-DATE WEDDING EVENT SCHEDULE FORM */}
              <EventScheduleForm
                schedule={schedule}
                onChange={setSchedule}
                minGuests={venue.minimumGuests}
                maxGuests={venue.maximumGuests}
              />

              <section className="event-availability-list mb-3" aria-live="polite">
                <h3 className="h6 fw-bold mb-2">Availability by event date</h3>
                {schedule.map((event, index) => {
                  const check = availabilityByEvent[index];
                  const status = checkingAvailability && check?.status === 'checking'
                    ? 'checking'
                    : check?.status || 'unknown';
                  return (
                    <div className={`event-availability-row event-availability-${status}`} key={`availability-${index}`}>
                      <div>
                        <strong>{event.eventType || 'Wedding function'}</strong>
                        <span>{event.eventDate ? new Date(`${event.eventDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date not selected'}</span>
                        <span>{Number(event.guestCount) || 0} guests</span>
                      </div>
                      <div>
                        <strong>{status === 'checking' ? 'Checking…' : status === 'available' ? 'Available' : status === 'incomplete' ? 'Needs date' : status === 'unavailable' ? 'Unavailable' : 'Not verified'}</strong>
                        {check?.reason && <small>{check.reason}</small>}
                      </div>
                    </div>
                  );
                })}
              </section>
              {availabilityError && (
                <div className="alert alert-danger small py-2 mb-3 d-flex justify-content-between align-items-center gap-2" role="alert">
                  <span>{availabilityError}</span>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setAvailabilityRetry((retry) => retry + 1)} disabled={checkingAvailability}>
                    {checkingAvailability ? 'Checking…' : 'Retry'}
                  </button>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label small fw-bold">City / Location *</label>
                <input
                  type="text"
                  name="city"
                  className="form-control"
                  value={enquiry.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Budget Range</label>
                <select name="budget" className="form-select" value={enquiry.budget} onChange={handleChange}>
                  <option value="Under ₹1,00,000">Under ₹1,00,000</option>
                  <option value="₹1,00,000 – ₹3,00,000">₹1,00,000 – ₹3,00,000</option>
                  <option value="₹3,00,000 – ₹5,00,000">₹3,00,000 – ₹5,00,000</option>
                  <option value="₹5,00,000 – ₹10,00,000">₹5,00,000 – ₹10,00,000</option>
                  <option value="Above ₹10,00,000">Above ₹10,00,000</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Rooms Required</label>
                <input
                  type="number"
                  name="numberOfRooms"
                  className="form-control"
                  min="0"
                  value={enquiry.numberOfRooms}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold d-block mb-2">Additional Services Needed</label>
                <div className="form-check form-check-inline">
                  <input
                    type="checkbox"
                    id="catCheck"
                    name="cateringRequired"
                    className="form-check-input"
                    checked={enquiry.cateringRequired}
                    onChange={handleChange}
                  />
                  <label htmlFor="catCheck" className="form-check-label small">Catering</label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    type="checkbox"
                    id="decCheck"
                    name="decorationRequired"
                    className="form-check-input"
                    checked={enquiry.decorationRequired}
                    onChange={handleChange}
                  />
                  <label htmlFor="decCheck" className="form-check-label small">Decoration</label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    type="checkbox"
                    id="djCheck"
                    name="djRequired"
                    className="form-check-input"
                    checked={enquiry.djRequired}
                    onChange={handleChange}
                  />
                  <label htmlFor="djCheck" className="form-check-label small">DJ / Music</label>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Message to Venue</label>
                <textarea
                  name="message"
                  className="form-control"
                  rows="3"
                  maxLength="2000"
                  placeholder="Mention any special requirements, timings, or questions..."
                  value={enquiry.message}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-bold"
                disabled={submitting || checkingAvailability || Boolean(availabilityError) || availabilityByEvent.length !== schedule.length || availabilityByEvent.some((item) => item.status !== 'available')}
                style={{ borderRadius: '6px' }}
              >
                {submitting ? 'Sending Enquiry…' : '📩 Send Venue Enquiry'}
              </button>
              <p className="text-muted text-center extra-small mt-2" style={{ fontSize: '0.78rem' }}>
                The venue owner will contact you with availability and formal pricing.
              </p>
            </form>
          </div>
        </aside>
      </div>
    </main>
  );
}
