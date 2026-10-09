import { useState } from 'react';
import VenueImage from './VenueImage';

const VENUE_TYPES_OPTIONS = [
  'Banquet Hall',
  'Wedding Lawn',
  'Resort',
  'Hotel',
  'Farmhouse',
  'Party Plot',
  'Community Hall',
  'Marriage Hall',
  'Beach Venue',
  'Heritage Venue',
];

const PRICING_TYPES_OPTIONS = ['Per Day', 'Per Function', 'Per Plate', 'Package'];

const EVENT_TYPES_OPTIONS = [
  'Wedding',
  'Reception',
  'Engagement',
  'Mehendi',
  'Haldi',
  'Sangeet',
  'Birthday',
  'Corporate Event',
  'Other',
];

const FACILITY_OPTIONS = [
  'AC',
  'Parking',
  'Rooms',
  'Catering Available',
  'Kitchen',
  'Decoration Allowed',
  'DJ Allowed',
  'Bridal Room',
  'Groom Room',
  'Power Backup',
  'Generator',
  'WiFi',
  'Lift',
  'Security',
  'Valet Parking',
  'Changing Room',
  'Outdoor Space',
  'Indoor Space',
];

export default function VenueFields({
  form = {},
  setForm,
  fieldErrors = {},
  selectCover,
  selectGallery,
  coverPreview,
  galleryPreviews = [],
}) {
  const [blockedDateInput, setBlockedDateInput] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleArrayItem = (arrayName, item) => {
    setForm((prev) => {
      const currentList = prev[arrayName] || [];
      const updated = currentList.includes(item)
        ? currentList.filter((i) => i !== item)
        : [...currentList, item];
      return { ...prev, [arrayName]: updated };
    });
  };

  const addBlockedDate = () => {
    if (!blockedDateInput) return;
    const currentBlocked = form.blockedDates || [];
    if (!currentBlocked.includes(blockedDateInput)) {
      setForm((prev) => ({
        ...prev,
        blockedDates: [...(prev.blockedDates || []), blockedDateInput].sort(),
      }));
    }
    setBlockedDateInput('');
  };

  const removeBlockedDate = (date) => {
    setForm((prev) => ({
      ...prev,
      blockedDates: (prev.blockedDates || []).filter((item) => item !== date),
    }));
  };

  return (
    <div className="venue-form-sections">
      {/* SECTION 1 — BASIC INFORMATION */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>01</span>
          <div>
            <h2>Basic Information</h2>
            <p>Introduce your venue and basic details.</p>
          </div>
        </div>
        <div className="venue-form-grid">
          <label>
            Venue Name *
            <input
              name="venueName"
              value={form.venueName || ''}
              onChange={handleChange}
              placeholder="e.g. Royal Palace Banquet & Lawns"
              required
            />
            {fieldErrors.venueName && <small className="field-error">{fieldErrors.venueName}</small>}
          </label>

          <label>
            Venue Type *
            <select name="venueType" value={form.venueType || ''} onChange={handleChange} required>
              <option value="">Choose Venue Type</option>
              {VENUE_TYPES_OPTIONS.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {fieldErrors.venueType && <small className="field-error">{fieldErrors.venueType}</small>}
          </label>

          <label>
            Contact Phone
            <input
              name="contactPhone"
              value={form.contactPhone || ''}
              onChange={handleChange}
              placeholder="e.g. +91 9876543210"
            />
          </label>

          <label>
            Contact Email
            <input
              type="email"
              name="contactEmail"
              value={form.contactEmail || ''}
              onChange={handleChange}
              placeholder="e.g. info@royalpalace.com"
            />
          </label>

          <label className="form-full">
            Description *
            <textarea
              name="description"
              value={form.description || ''}
              onChange={handleChange}
              rows="4"
              placeholder="Describe the setting, architecture, capacity, and experience for wedding couples..."
              required
            />
            {fieldErrors.description && <small className="field-error">{fieldErrors.description}</small>}
          </label>
        </div>
      </section>

      {/* SECTION 2 — LOCATION */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>02</span>
          <div>
            <h2>Location & Address</h2>
            <p>Help couples locate and reach your venue.</p>
          </div>
        </div>
        <div className="venue-form-grid">
          <label>
            City *
            <input name="city" value={form.city || ''} onChange={handleChange} placeholder="e.g. Surat" required />
            {fieldErrors.city && <small className="field-error">{fieldErrors.city}</small>}
          </label>

          <label>
            State *
            <input name="state" value={form.state || ''} onChange={handleChange} placeholder="e.g. Gujarat" required />
            {fieldErrors.state && <small className="field-error">{fieldErrors.state}</small>}
          </label>

          <label>
            Area / Locality
            <input name="area" value={form.area || form.location || ''} onChange={handleChange} placeholder="e.g. Vesu" />
          </label>

          <label>
            Landmark
            <input name="landmark" value={form.landmark || ''} onChange={handleChange} placeholder="e.g. Near University Circle" />
          </label>

          <label className="form-full">
            Full Street Address *
            <input name="address" value={form.address || ''} onChange={handleChange} placeholder="Full address" required />
            {fieldErrors.address && <small className="field-error">{fieldErrors.address}</small>}
          </label>
        </div>
      </section>

      {/* SECTION 3 — CAPACITY */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>03</span>
          <div>
            <h2>Guest & Space Capacity</h2>
            <p>Define seating capacity and guest limits.</p>
          </div>
        </div>
        <div className="venue-form-grid">
          <label>
            Minimum Guests *
            <input type="number" name="minimumGuests" min="1" value={form.minimumGuests || ''} onChange={handleChange} required />
            {fieldErrors.minimumGuests && <small className="field-error">{fieldErrors.minimumGuests}</small>}
          </label>

          <label>
            Maximum Guests *
            <input type="number" name="maximumGuests" min="1" value={form.maximumGuests || ''} onChange={handleChange} required />
            {fieldErrors.maximumGuests && <small className="field-error">{fieldErrors.maximumGuests}</small>}
          </label>

          <label>
            Seating Capacity *
            <input type="number" name="seatingCapacity" min="1" value={form.seatingCapacity || ''} onChange={handleChange} required />
            {fieldErrors.seatingCapacity && <small className="field-error">{fieldErrors.seatingCapacity}</small>}
          </label>

          <label>
            Parking Capacity (vehicles)
            <input type="number" name="parkingCapacity" min="0" value={form.parkingCapacity ?? '0'} onChange={handleChange} />
          </label>

          <label>
            Number of Rooms Available
            <input type="number" name="numberOfRooms" min="0" value={form.numberOfRooms ?? '0'} onChange={handleChange} />
          </label>
        </div>
      </section>

      {/* SECTION 4 — PRICING */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>04</span>
          <div>
            <h2>Pricing & Advance Terms</h2>
            <p>Set rental rates and payment expectations.</p>
          </div>
        </div>
        <div className="venue-form-grid">
          <label>
            Starting Price (₹) *
            <input type="number" name="startingPrice" min="0" value={form.startingPrice || ''} onChange={handleChange} required />
            {fieldErrors.startingPrice && <small className="field-error">{fieldErrors.startingPrice}</small>}
          </label>

          <label>
            Pricing Type *
            <select name="priceType" value={form.priceType || 'Per Day'} onChange={handleChange} required>
              {PRICING_TYPES_OPTIONS.map((pt) => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>
          </label>

          <label>
            Advance Payment (%)
            <input name="advancePaymentPercentage" value={form.advancePaymentPercentage || ''} onChange={handleChange} placeholder="e.g. 25%" />
          </label>

          <label>
            Additional Charges Note
            <input name="additionalChargeName" value={form.additionalChargeName || ''} onChange={handleChange} placeholder="e.g. Cleaning fee" />
          </label>
        </div>
      </section>

      {/* SECTION 5 — EVENT TYPES */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>05</span>
          <div>
            <h2>Supported Event Types</h2>
            <p>Select events suited for this venue.</p>
          </div>
        </div>
        <div className="facility-checkbox-grid">
          {EVENT_TYPES_OPTIONS.map((ev) => {
            const isChecked = form.eventTypes?.includes(ev);
            return (
              <label key={ev} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                <input type="checkbox" checked={Boolean(isChecked)} onChange={() => toggleArrayItem('eventTypes', ev)} />
                <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                {ev}
              </label>
            );
          })}
        </div>
      </section>

      {/* SECTION 6 — FACILITIES */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>06</span>
          <div>
            <h2>Venue Facilities & Amenities</h2>
            <p>Select all features present on site.</p>
          </div>
        </div>
        <div className="facility-checkbox-grid">
          {FACILITY_OPTIONS.map((facility) => {
            const isChecked = form.facilities?.includes(facility);
            return (
              <label key={facility} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                <input type="checkbox" checked={Boolean(isChecked)} onChange={() => toggleArrayItem('facilities', facility)} />
                <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                {facility}
              </label>
            );
          })}
        </div>
      </section>

      {/* SECTION 7 — MEDIA */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>07</span>
          <div>
            <h2>Media & Photos</h2>
            <p>Upload cover and gallery images.</p>
          </div>
        </div>
        <div className="venue-form-grid">
          <label className="form-full">
            Cover Image URL
            <input name="coverImage" type="url" value={form.coverImage || ''} onChange={handleChange} placeholder="https://..." />
            {fieldErrors.coverImage && <small className="field-error">{fieldErrors.coverImage}</small>}
          </label>
          <label>
            Upload Cover Image
            <input type="file" accept="image/*" onChange={selectCover} />
          </label>
          <label>
            Upload Gallery Images
            <input type="file" accept="image/*" multiple onChange={selectGallery} />
          </label>
          <label className="form-full">
            Venue Video URL
            <input name="venueVideo" type="url" value={form.venueVideo || ''} onChange={handleChange} placeholder="https://youtube.com/..." />
          </label>
        </div>

        {(coverPreview || form.coverImage) && (
          <div className="upload-preview" style={{ marginTop: '15px' }}>
            <p>Cover Preview</p>
            <VenueImage src={coverPreview || form.coverImage} alt="Cover preview" />
          </div>
        )}
      </section>

      {/* SECTION 8 — POLICIES & AVAILABILITY */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>08</span>
          <div>
            <h2>Policies & Availability</h2>
            <p>Set venue policies and block unavailable dates.</p>
          </div>
        </div>
        <div className="venue-form-grid">
          <label className="form-full">
            Cancellation Policy
            <textarea name="cancellationPolicy" value={form.cancellationPolicy || ''} onChange={handleChange} rows="3" />
          </label>
          <label className="form-full">
            Terms & Conditions
            <textarea name="termsAndConditions" value={form.termsAndConditions || ''} onChange={handleChange} rows="3" />
          </label>
        </div>

        <div className="blocked-date-editor" style={{ marginTop: '20px' }}>
          <label htmlFor="blocked-date-input">Block Unavailable Date</label>
          <input
            id="blocked-date-input"
            type="date"
            value={blockedDateInput}
            onChange={(e) => setBlockedDateInput(e.target.value)}
          />
          <button type="button" className="secondary-button" onClick={addBlockedDate}>Add Date</button>
        </div>

        <div className="blocked-date-tags" style={{ marginTop: '10px' }}>
          {form.blockedDates && form.blockedDates.length > 0 ? (
            form.blockedDates.map((date) => (
              <button key={date} type="button" onClick={() => removeBlockedDate(date)}>
                {date} ×
              </button>
            ))
          ) : (
            <p className="dashboard-empty">No dates blocked yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
