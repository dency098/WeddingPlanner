import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import VenueImage from '../components/VenueImage';
import {
  createVenue,
  deleteVenue,
  getVendorVenue,
  getVendorVenues,
  setVenueActive,
  updateBlockedDates,
  updateVenue,
} from '../services/venueService';
import { uploadVenueImages, validateVenueImages } from '../services/venueImageService';

const facilityOptions = ['AC', 'Parking', 'Rooms', 'Catering', 'Kitchen', 'Decoration Allowed', 'DJ Allowed', 'Bridal Room', 'Groom Room', 'Power Backup'];
const venueTypes = ['Banquet Hall', 'Wedding Lawn', 'Resort', 'Hotel', 'Farmhouse', 'Community Hall'];
const emptyForm = {
  venueName: '', venueType: '', description: '', address: '', city: '', state: '', location: '',
  minimumGuests: '', maximumGuests: '', seatingCapacity: '', parkingCapacity: '0', floatingCapacity: '',
  startingPrice: '', priceType: '', additionalChargeName: '', additionalChargeAmount: '',
  baseRentalFee: '0', decorationPolicy: 'In-house only', cateringPolicy: 'In-house only', alcoholPolicy: '',
  facilities: [], coverImage: '', gallery: [], venueVideo: '', cancellationPolicy: '',
  advancePayment: '0', eventDuration: '8', termsAndConditions: '', blockedDates: [],
  spaces: [],
  amenities: { changingRooms: 0, generatorBackup: false, valetParking: 0, acRooms: 0, wheelchairAccessible: false }
};

const formatPrice = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const getError = (error) => error.response?.data?.message || error.message || 'Something went wrong. Please try again.';

export default function VendorVenuesPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const adding = location.pathname === '/vendor/venues/add';
  const showForm = adding || editing;
  const [venues, setVenues] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [coverFile, setCoverFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [blockedDateInput, setBlockedDateInput] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const previewUrls = useRef([]);
  const activeCoverPreview = useRef('');

  useEffect(() => {
    const urlsToRevoke = previewUrls.current;
    return () => {
      urlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (editing) {
          const venue = await getVendorVenue(id);
          if (!active) return;
          setForm({
            ...emptyForm,
            ...venue,
            minimumGuests: String(venue.minimumGuests),
            maximumGuests: String(venue.maximumGuests),
            floatingCapacity: venue.floatingCapacity ? String(venue.floatingCapacity) : '',
            seatingCapacity: String(venue.seatingCapacity),
            parkingCapacity: String(venue.parkingCapacity || 0),
            startingPrice: String(venue.startingPrice),
            baseRentalFee: String(venue.baseRentalFee || 0),
            advancePayment: String(venue.advancePayment || 0),
            eventDuration: String(venue.eventDuration || 8),
            facilities: venue.facilities || [],
            gallery: venue.gallery || [],
            spaces: venue.spaces || [],
            amenities: venue.amenities || { changingRooms: 0, generatorBackup: false, valetParking: 0, acRooms: 0, wheelchairAccessible: false },
            blockedDates: (venue.blockedDates || []).map((date) => new Date(date).toISOString().slice(0, 10)),
            additionalChargeName: venue.additionalCharges?.[0]?.name || '',
            additionalChargeAmount: venue.additionalCharges?.[0]?.amount !== undefined ? String(venue.additionalCharges[0].amount) : '',
          });
        } else if (adding) {
          setForm(emptyForm);
          setMessage('');
          setFieldErrors({});
          setCoverFile(null);
          setGalleryFiles([]);
          setBlockedDateInput('');
          setCoverPreview('');
          setGalleryPreviews([]);
        } else {
          const result = await getVendorVenues();
          if (active) setVenues(result);
        }
      } catch (apiError) {
        if (active) setError(getError(apiError));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [adding, editing, id]);

  const refreshList = async () => setVenues(await getVendorVenues());
  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
    setError('');
  };

  const changeFacilities = (facility) => {
    setForm((current) => ({
      ...current,
      facilities: current.facilities.includes(facility)
        ? current.facilities.filter((item) => item !== facility)
        : [...current.facilities, facility],
    }));
  };

  const selectCover = (event) => {
    const file = event.target.files?.[0] || null;
    try {
      if (file) validateVenueImages([file]);
      setCoverFile(file);
      if (activeCoverPreview.current) URL.revokeObjectURL(activeCoverPreview.current);
      const preview = file ? URL.createObjectURL(file) : '';
      activeCoverPreview.current = preview;
      if (preview) previewUrls.current.push(preview);
      setCoverPreview(preview);
      setError('');
    } catch (validationError) {
      setError(validationError.message);
      event.target.value = '';
    }
  };

  const selectGallery = (event) => {
    const files = [...(event.target.files || [])];
    try {
      validateVenueImages([...form.gallery, ...galleryFiles, ...files].filter((item) => typeof item !== 'string'));
      if (form.gallery.length + galleryFiles.length + files.length > 12) throw new Error('A venue can have up to 12 gallery images.');
      setGalleryFiles((current) => [...current, ...files]);
      const previewsForFiles = files.map((file) => URL.createObjectURL(file));
      previewUrls.current.push(...previewsForFiles);
      setGalleryPreviews((current) => [...current, ...previewsForFiles]);
      setError('');
    } catch (validationError) {
      setError(validationError.message);
      event.target.value = '';
    }
  };

  const addBlockedDate = () => {
    if (!blockedDateInput) return;
    if (!form.blockedDates.includes(blockedDateInput)) {
      setForm((current) => ({ ...current, blockedDates: [...current.blockedDates, blockedDateInput].sort() }));
    }
    setBlockedDateInput('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    setFieldErrors({});
    try {
      if (Number(form.maximumGuests) < Number(form.minimumGuests)) {
        setFieldErrors({ maximumGuests: 'Maximum guests must be greater than or equal to minimum guests.' });
        return;
      }
      let coverImage = form.coverImage;
      if (coverFile) [coverImage] = await uploadVenueImages([coverFile]);
      if (!coverImage) {
        setFieldErrors({ coverImage: 'Add a cover image or enter an image URL.' });
        return;
      }
      const uploadedGallery = galleryFiles.length ? await uploadVenueImages(galleryFiles) : [];
      const additionalCharges = form.additionalChargeName
        ? [{ name: form.additionalChargeName, amount: Number(form.additionalChargeAmount || 0) }]
        : [];
      const payload = {
        venueName: form.venueName.trim(),
        venueType: form.venueType,
        description: form.description.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        location: form.location.trim(),
        minimumGuests: Number(form.minimumGuests),
        maximumGuests: Number(form.maximumGuests),
        seatingCapacity: Number(form.seatingCapacity),
        parkingCapacity: Number(form.parkingCapacity || 0),
        startingPrice: Number(form.startingPrice),
        priceType: form.priceType,
        additionalCharges,
        facilities: form.facilities,
        coverImage,
        gallery: [...form.gallery, ...uploadedGallery],
        venueVideo: form.venueVideo.trim(),
        cancellationPolicy: form.cancellationPolicy.trim(),
        advancePayment: Number(form.advancePayment || 0),
        eventDuration: Number(form.eventDuration || 8),
        termsAndConditions: form.termsAndConditions.trim(),
        blockedDates: form.blockedDates,
      };
      const response = editing ? await updateVenue(id, payload) : await createVenue(payload);
      if (editing) {
        setMessage(response.message);
        setCoverFile(null);
        setGalleryFiles([]);
        setForm((current) => ({ ...current, coverImage, gallery: payload.gallery }));
      } else {
        navigate('/vendor/venues', { state: { notice: response.message } });
      }
    } catch (apiError) {
      setError(getError(apiError));
      setFieldErrors(apiError.response?.data?.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (venue) => {
    try {
      await setVenueActive(venue._id, !venue.isActive);
      await refreshList();
    } catch (apiError) {
      setError(getError(apiError));
    }
  };

  const removeVenue = async (venue) => {
    if (!window.confirm(`Delete "${venue.venueName}"? Venues with booking records must be deactivated instead.`)) return;
    try {
      await deleteVenue(venue._id);
      await refreshList();
    } catch (apiError) {
      setError(getError(apiError));
    }
  };

  // Interactive Availability Modal State
  const [managingAvailabilityVenue, setManagingAvailabilityVenue] = useState(null);
  const [blockedDetails, setBlockedDetails] = useState([]);
  const [addDateInput, setAddDateInput] = useState('');
  const [addReasonInput, setAddReasonInput] = useState('Manually blocked');

  const openAvailabilityModal = (venue) => {
    const details = (venue.blockedDateDetails && venue.blockedDateDetails.length > 0)
      ? venue.blockedDateDetails.map((d) => ({
          date: new Date(d.date).toISOString().slice(0, 10),
          reason: d.reason || 'Manually blocked',
        }))
      : (venue.blockedDates || []).map((date) => ({
          date: new Date(date).toISOString().slice(0, 10),
          reason: 'Manually blocked',
        }));

    setManagingAvailabilityVenue(venue);
    setBlockedDetails(details);
    setAddDateInput(new Date().toISOString().slice(0, 10));
    setAddReasonInput('Manually blocked');
  };

  const handleAddBlockedDate = () => {
    if (!addDateInput) return;
    if (blockedDetails.some((item) => item.date === addDateInput)) {
      alert('This date is already blocked.');
      return;
    }
    setBlockedDetails((prev) => [...prev, { date: addDateInput, reason: addReasonInput || 'Manually blocked' }]);
  };

  const handleRemoveBlockedDate = (targetDate) => {
    setBlockedDetails((prev) => prev.filter((item) => item.date !== targetDate));
  };

  const handleSaveAvailability = async () => {
    if (!managingAvailabilityVenue) return;
    try {
      const datesArray = blockedDetails.map((item) => item.date);
      await updateBlockedDates(managingAvailabilityVenue._id, datesArray, blockedDetails);
      setManagingAvailabilityVenue(null);
      await refreshList();
    } catch (apiError) {
      setError(getError(apiError));
    }
  };

  if (loading && !adding) return <main className="venue-state">Loading your venues…</main>;

  if (!showForm) {
    return (
      <main className="venue-management-page">
        <header className="venue-management-heading">
          <div><p className="eyebrow">Vendor workspace</p><h1>Wedding Venues</h1><p>Present your space beautifully and keep its availability up to date.</p></div>
          <Link className="primary-button" to="/vendor/venues/add">Add a venue</Link>
        </header>
        {error && <div className="venue-alert error" role="alert">{error}</div>}
        {loading ? <div className="venue-state">Loading venues…</div> : venues.length === 0 ? (
          <div className="venue-state"><h2>Your venue story starts here.</h2><p>Add your first wedding venue to submit it for platform review.</p><Link className="primary-button" to="/vendor/venues/add">Create a venue listing</Link></div>
        ) : (
          <div className="vendor-venue-grid">
            {venues.map((venue) => (
              <article className="vendor-venue-card" key={venue._id}>
                <VenueImage className="vendor-venue-cover" src={venue.coverImage} alt={`${venue.venueName} cover`} />
                <div className="vendor-venue-card-content">
                  <div className="venue-title-status"><div><h2>{venue.venueName}</h2><p>{venue.city}, {venue.state} · {venue.venueType}</p></div><span className={`moderation-badge ${venue.approvalStatus}`}>{venue.approvalStatus}</span></div>
                  <p className="vendor-venue-price">{formatPrice(venue.startingPrice)} <span>{venue.priceType}</span></p>
                  <p className="venue-capacity">{venue.minimumGuests}–{Math.min(venue.maximumGuests, venue.seatingCapacity)} guests · {venue.isActive ? 'Active listing' : 'Inactive listing'}</p>
                  <div className="vendor-venue-actions">
                    <Link to={`/vendor/venues/edit/${venue._id}`}>Edit</Link>
                    <Link to={`/vendor/venues/${venue._id}/bookings`}>Booking requests</Link>
                    <button type="button" onClick={() => toggleActive(venue)}>{venue.isActive ? 'Deactivate' : 'Activate'}</button>
                    <button type="button" onClick={() => openAvailabilityModal(venue)}>📅 Manage Availability & Blocked Dates ({venue.blockedDates?.length || 0})</button>
                    <button type="button" className="danger-link" onClick={() => removeVenue(venue)}>Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* INTERACTIVE DATE AVAILABILITY MODAL */}
        {managingAvailabilityVenue && (
          <div className="modal-overlay position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050 }}>
            <div className="card shadow-lg border-0 rounded-3 p-4 bg-white" style={{ maxWidth: '580px', width: '95%' }}>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <h3 className="h5 fw-bold text-dark mb-0">📅 Manage Available & Blocked Dates</h3>
                <button type="button" className="btn-close" onClick={() => setManagingAvailabilityVenue(null)}></button>
              </div>

              <p className="text-muted small mb-3">
                Venue: <strong>{managingAvailabilityVenue.venueName}</strong> ({managingAvailabilityVenue.city})
              </p>

              {/* ADD NEW BLOCKED DATE */}
              <div className="p-3 bg-light rounded border mb-3">
                <h4 className="h6 fw-bold text-dark mb-2">Block a Date</h4>
                <div className="row g-2">
                  <div className="col-12 col-md-5">
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={addDateInput}
                      onChange={(e) => setAddDateInput(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-5">
                    <select
                      className="form-select form-select-sm"
                      value={addReasonInput}
                      onChange={(e) => setAddReasonInput(e.target.value)}
                    >
                      <option value="Manually blocked">Manually Blocked</option>
                      <option value="Private Event">Private Event</option>
                      <option value="Maintenance">Maintenance & Renovation</option>
                      <option value="Already Confirmed Wedding">Already Confirmed Wedding</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary w-100 fw-bold"
                      onClick={handleAddBlockedDate}
                    >
                      + Block
                    </button>
                  </div>
                </div>
              </div>

              {/* CURRENTLY BLOCKED DATES LIST */}
              <div className="mb-3">
                <h4 className="h6 fw-bold text-dark mb-2">Currently Blocked Dates ({blockedDetails.length})</h4>
                {blockedDetails.length === 0 ? (
                  <p className="text-muted small mb-0">No dates are currently blocked for this venue.</p>
                ) : (
                  <div className="list-group list-group-flush border rounded overflow-auto" style={{ maxHeight: '180px' }}>
                    {blockedDetails.map((item, idx) => (
                      <div className="list-group-item d-flex justify-content-between align-items-center py-2 px-3 small" key={idx}>
                        <div>
                          <strong className="text-danger">📆 {item.date}</strong> — <span className="text-muted">{item.reason}</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success py-0 px-2"
                          onClick={() => handleRemoveBlockedDate(item.date)}
                        >
                          ✓ Unblock / Make Available
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button type="button" className="btn btn-secondary" onClick={() => setManagingAvailabilityVenue(null)}>Cancel</button>
                <button type="button" className="btn btn-success fw-bold" onClick={handleSaveAvailability}>
                  💾 Save Availability Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="venue-management-page venue-form-page">
      <Link className="back-link" to="/vendor/venues">← Back to Wedding Venues</Link>
      <header className="venue-management-heading"><div><p className="eyebrow">Venue listing</p><h1>{editing ? 'Edit your venue' : 'Add a wedding venue'}</h1><p>Complete the details couples need to plan with confidence.</p><p>New or edited listings are reviewed before appearing publicly.</p></div></header>
      {error && <div className="venue-alert error" role="alert">{error}</div>}
      {message && <div className="venue-alert success" role="status">{message}</div>}

      <form className="venue-edit-form" onSubmit={handleSubmit}>
        <section className="venue-form-section">
          <div className="venue-form-section-heading"><span>01</span><div><h2>Basic information</h2><p>Introduce your venue and what makes it special.</p></div></div>
          <div className="venue-form-grid">
            <label>Venue name<input name="venueName" value={form.venueName} onChange={change} maxLength="120" required /><FieldError value={fieldErrors.venueName} /></label>
            <label>Venue type<select name="venueType" value={form.venueType} onChange={change} required><option value="">Choose a type</option>{venueTypes.map((type) => <option key={type}>{type}</option>)}</select><FieldError value={fieldErrors.venueType} /></label>
            <label className="form-full">Description<textarea name="description" value={form.description} onChange={change} rows="5" maxLength="5000" required placeholder="Tell couples about the setting, atmosphere and experience." /><FieldError value={fieldErrors.description} /></label>
          </div>
        </section>

        <section className="venue-form-section">
          <div className="venue-form-section-heading"><span>02</span><div><h2>Location</h2><p>Help couples find and reach your venue.</p></div></div>
          <div className="venue-form-grid">
            <label className="form-full">Street address<input name="address" value={form.address} onChange={change} maxLength="500" required /><FieldError value={fieldErrors.address} /></label>
            <label>City<input name="city" value={form.city} onChange={change} required /><FieldError value={fieldErrors.city} /></label>
            <label>State<input name="state" value={form.state} onChange={change} required /><FieldError value={fieldErrors.state} /></label>
            <label>Area or locality<input name="location" value={form.location} onChange={change} placeholder="Optional" /></label>
          </div>
        </section>

        <section className="venue-form-section">
          <div className="venue-form-section-heading"><span>03</span><div><h2>Capacity</h2><p>Set clear guest limits and on-site facilities.</p></div></div>
          <div className="venue-form-grid">
            <label>Minimum guests<input type="number" name="minimumGuests" min="1" value={form.minimumGuests} onChange={change} required /><FieldError value={fieldErrors.minimumGuests} /></label>
            <label>Maximum guests<input type="number" name="maximumGuests" min="1" value={form.maximumGuests} onChange={change} required /><FieldError value={fieldErrors.maximumGuests} /></label>
            <label>Seating capacity<input type="number" name="seatingCapacity" min="1" value={form.seatingCapacity} onChange={change} required /><FieldError value={fieldErrors.seatingCapacity} /></label>
            <label>Floating capacity<input type="number" name="floatingCapacity" min="0" value={form.floatingCapacity} onChange={change} /><FieldError value={fieldErrors.floatingCapacity} /></label>
            <label>Parking capacity<input type="number" name="parkingCapacity" min="0" value={form.parkingCapacity} onChange={change} /><FieldError value={fieldErrors.parkingCapacity} /></label>
          </div>
        </section>

        <section className="venue-form-section">
          <div className="venue-form-section-heading"><span>04</span><div><h2>Pricing</h2><p>Share a starting point and any additional charges.</p></div></div>
          <div className="venue-form-grid">
            <label>Starting price (₹)<input type="number" name="startingPrice" min="0" step="1" value={form.startingPrice} onChange={change} required /><FieldError value={fieldErrors.startingPrice} /></label>
            <label>Base rental fee (₹)<input type="number" name="baseRentalFee" min="0" step="1" value={form.baseRentalFee} onChange={change} /><FieldError value={fieldErrors.baseRentalFee} /></label>
            <label>Price type<select name="priceType" value={form.priceType} onChange={change} required><option value="">Choose pricing</option><option>Per Day</option><option>Per Plate</option><option>Package</option></select><FieldError value={fieldErrors.priceType} /></label>
            <label>Additional charge<input name="additionalChargeName" value={form.additionalChargeName} onChange={change} placeholder="e.g. Cleaning fee" /></label>
            <label>Charge amount (₹)<input type="number" name="additionalChargeAmount" min="0" value={form.additionalChargeAmount} onChange={change} /></label>
          </div>
        </section>

        <section className="venue-form-section">
          <div className="venue-form-section-heading"><span>05</span><div><h2>Facilities</h2><p>Select everything your venue currently offers.</p></div></div>
          <div className="facility-checkbox-grid">
            {facilityOptions.map((facility) => (
              <label className={`facility-checkbox ${form.facilities.includes(facility) ? 'checked' : ''}`} key={facility}>
                <input type="checkbox" checked={form.facilities.includes(facility)} onChange={() => changeFacilities(facility)} />
                <span className="custom-check" aria-hidden="true">{form.facilities.includes(facility) ? '✓' : ''}</span>{facility}
              </label>
            ))}
          </div>
        </section>

        <section className="venue-form-section">
          <div className="venue-form-section-heading"><span>06</span><div><h2>Photography</h2><p>Upload JPG, PNG or WebP images (up to 8 MB each).</p></div></div>
          <div className="venue-form-grid">
            <label className="form-full">Cover image URL<input name="coverImage" type="url" value={form.coverImage} onChange={change} placeholder="Or choose a cover image file below" /><FieldError value={fieldErrors.coverImage} /></label>
            <label>Upload cover image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectCover} /></label>
            <label>Upload gallery images<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectGallery} /><small>Up to 12 gallery images total.</small></label>
            {form.venueVideo !== undefined && <label className="form-full">Venue video URL<input name="venueVideo" type="url" value={form.venueVideo} onChange={change} placeholder="Optional" /></label>}
          </div>
          {(coverPreview || form.coverImage) && <div className="upload-preview"><p>Cover preview</p><VenueImage src={coverPreview || form.coverImage} alt="Venue cover preview" /></div>}
          {(form.gallery.length > 0 || galleryPreviews.length > 0) && <div className="upload-gallery-preview"><p>Gallery preview</p><div>{form.gallery.map((image) => <VenueImage key={image} src={image} alt="Existing venue gallery image" />)}{galleryPreviews.map((image) => <VenueImage key={image} src={image} alt="New venue gallery image preview" />)}</div></div>}
          <FieldError value={fieldErrors.gallery} />
        </section>

        <section className="venue-form-section">
          <div className="venue-form-section-heading"><span>07</span><div><h2>Policies</h2><p>Set expectations before a couple sends a request.</p></div></div>
          <div className="venue-form-grid">
            <label>Advance payment (₹)<input type="number" name="advancePayment" min="0" value={form.advancePayment} onChange={change} /></label>
            <label>Event duration (hours)<input type="number" name="eventDuration" min="1" value={form.eventDuration} onChange={change} /></label>
            <label>Decoration policy<select name="decorationPolicy" value={form.decorationPolicy} onChange={change}><option>In-house only</option><option>Outside allowed</option><option>Not allowed</option></select></label>
            <label>Catering policy<select name="cateringPolicy" value={form.cateringPolicy} onChange={change}><option>In-house only</option><option>Outside allowed</option><option>Not allowed</option></select></label>
            <label>Alcohol policy<select name="alcoholPolicy" value={form.alcoholPolicy} onChange={change}><option value="">Select policy</option><option>In-house only</option><option>Outside allowed</option><option>Not allowed</option></select></label>
            <label className="form-full">Cancellation policy<textarea name="cancellationPolicy" value={form.cancellationPolicy} onChange={change} rows="3" maxLength="3000" /></label>
            <label className="form-full">Terms and conditions<textarea name="termsAndConditions" value={form.termsAndConditions} onChange={change} rows="3" maxLength="5000" /></label>
          </div>
        </section>

        <section className="venue-form-section">
          <div className="venue-form-section-heading"><span>08</span><div><h2>Availability</h2><p>Dates marked unavailable won’t accept new booking requests.</p></div></div>
          <div className="blocked-date-editor">
            <label htmlFor="blocked-date">Block a date</label>
            <input id="blocked-date" type="date" value={blockedDateInput} onChange={(event) => setBlockedDateInput(event.target.value)} />
            <button type="button" className="secondary-button" onClick={addBlockedDate}>Add date</button>
          </div>
          <div className="blocked-date-tags">
            {form.blockedDates.length === 0 && <p>No dates blocked yet.</p>}
            {form.blockedDates.map((date) => <button type="button" key={date} onClick={() => setForm((current) => ({ ...current, blockedDates: current.blockedDates.filter((item) => item !== date) }))}>{date} ×</button>)}
          </div>
        </section>

        {error && <div className="venue-alert error" role="alert">{error}</div>}
        {message && <div className="venue-alert success" role="status">{message}</div>}
        <div className="venue-form-submit-row"><p>New or edited listings are reviewed before appearing publicly.</p><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving venue…' : editing ? 'Save and submit for review' : 'Submit venue for review'}</button></div>
      </form>
    </main>
  );
}

function FieldError({ value }) {
  return value ? <small className="field-error">{value}</small> : null;
}
