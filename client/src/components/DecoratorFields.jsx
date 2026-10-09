import { useState } from 'react';
import VenueImage from './VenueImage';

const DECORATION_SERVICES_OPTIONS = [
  'Wedding Decoration',
  'Engagement Decoration',
  'Reception Decoration',
  'Mehendi Decoration',
  'Haldi Decoration',
  'Sangeet Decoration',
  'Mandap Decoration',
  'Stage Decoration',
  'Entrance Decoration',
  'Table Decoration',
  'Ceiling Decoration',
  'Floral Decoration',
  'Lighting Decoration',
  'Car Decoration',
  'Room Decoration',
  'Outdoor Decoration',
  'Indoor Decoration',
  'Tent Decoration',
];

const DECORATION_STYLES_OPTIONS = [
  'Traditional',
  'Modern',
  'Luxury',
  'Minimal',
  'Royal',
  'Floral',
  'Bohemian',
  'Rustic',
  'Elegant',
  'Pastel',
  'Bollywood',
  'Theme Based',
];

const EVENT_TYPES_OPTIONS = [
  'Wedding',
  'Reception',
  'Engagement',
  'Mehendi',
  'Haldi',
  'Sangeet',
  'Cocktail',
  'Birthday / Other Events',
];

const VENUE_TYPES_OPTIONS = [
  'Banquet Hall',
  'Hotel',
  'Resort',
  'Farmhouse',
  'Lawn',
  'Outdoor',
  'Indoor',
  'Temple',
  'Home',
];

const ADD_ON_OPTIONS = [
  'Photo Booth',
  'LED Wall',
  'Cold Pyro',
  'Entry Gate',
  'Welcome Board',
  'Artificial Flowers',
  'Fresh Flowers',
  'Fairy Lights',
  'Chandeliers',
  'Smoke Effect',
  'Stage Props',
  'Sofa Seating',
  'Carpet',
  'Umbrella Decoration',
];

export default function DecoratorFields({
  form,
  setForm,
  fieldErrors = {},
  selectCover,
  selectGallery,
  coverPreview,
  galleryPreviews = [],
}) {
  const [customAddOnInput, setCustomAddOnInput] = useState('');
  const [serviceAreaInput, setServiceAreaInput] = useState('');
  const [newPackage, setNewPackage] = useState({ packageName: '', price: '', description: '' });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRequirementChange = (reqKey) => {
    setForm((prev) => ({
      ...prev,
      decorRequirements: {
        ...prev.decorRequirements,
        [reqKey]: !prev.decorRequirements?.[reqKey],
      },
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

  const addCustomAddOn = () => {
    if (!customAddOnInput.trim()) return;
    const trimmed = customAddOnInput.trim();
    if (!form.addOns.includes(trimmed)) {
      setForm((prev) => ({ ...prev, addOns: [...prev.addOns, trimmed] }));
    }
    setCustomAddOnInput('');
  };

  const removeAddOn = (item) => {
    setForm((prev) => ({ ...prev, addOns: prev.addOns.filter((i) => i !== item) }));
  };

  const addServiceArea = () => {
    if (!serviceAreaInput.trim()) return;
    const trimmed = serviceAreaInput.trim();
    if (!form.serviceAreas.includes(trimmed)) {
      setForm((prev) => ({ ...prev, serviceAreas: [...prev.serviceAreas, trimmed] }));
    }
    setServiceAreaInput('');
  };

  const removeServiceArea = (area) => {
    setForm((prev) => ({ ...prev, serviceAreas: prev.serviceAreas.filter((a) => a !== area) }));
  };

  const handleAddPackage = () => {
    if (!newPackage.packageName.trim() || !newPackage.price) return;
    setForm((prev) => ({
      ...prev,
      packages: [
        ...prev.packages,
        {
          packageName: newPackage.packageName.trim(),
          price: Number(newPackage.price),
          description: newPackage.description.trim(),
          includes: newPackage.description.split(',').map((s) => s.trim()).filter(Boolean),
        },
      ],
    }));
    setNewPackage({ packageName: '', price: '', description: '' });
  };

  const handleRemovePackage = (index) => {
    setForm((prev) => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="decorator-form-sections">
      {/* SECTION A — BASIC INFORMATION */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>01</span>
          <div>
            <h2>Section A — Basic Information</h2>
            <p>Enter your decorator business details.</p>
          </div>
        </div>
        <div className="venue-form-grid">
          <label>
            Decoration Business Name *
            <input
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              placeholder="e.g. Dream Decor Events"
              required
            />
            {fieldErrors.businessName && <small className="field-error">{fieldErrors.businessName}</small>}
          </label>

          <label>
            Contact Number *
            <input
              name="contactNumber"
              value={form.contactNumber}
              onChange={handleChange}
              placeholder="e.g. +91 9876543210"
              required
            />
            {fieldErrors.contactNumber && <small className="field-error">{fieldErrors.contactNumber}</small>}
          </label>

          <label>
            Email *
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. contact@dreamdecor.com"
              required
            />
            {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
          </label>

          <label>
            City *
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="e.g. Surat"
              required
            />
            {fieldErrors.city && <small className="field-error">{fieldErrors.city}</small>}
          </label>

          <label>
            Area / Location
            <input
              name="area"
              value={form.area}
              onChange={handleChange}
              placeholder="e.g. Vesu"
            />
          </label>

          <label>
            Years of Experience *
            <input
              type="number"
              name="yearsOfExperience"
              min="0"
              value={form.yearsOfExperience}
              onChange={handleChange}
              required
            />
            {fieldErrors.yearsOfExperience && <small className="field-error">{fieldErrors.yearsOfExperience}</small>}
          </label>

          <label className="form-full">
            Description *
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              placeholder="We provide complete wedding decoration services including mandap, stage, floral decoration, lighting and theme decoration."
              required
            />
            {fieldErrors.description && <small className="field-error">{fieldErrors.description}</small>}
          </label>
        </div>
      </section>

      {/* SECTION B — DECORATION SERVICES */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>02</span>
          <div>
            <h2>Section B — Decoration Services</h2>
            <p>Select all services you provide to clients.</p>
          </div>
        </div>
        {fieldErrors.decorationServices && <small className="field-error" style={{ display: 'block', marginBottom: '10px' }}>{fieldErrors.decorationServices}</small>}
        <div className="facility-checkbox-grid">
          {DECORATION_SERVICES_OPTIONS.map((service) => {
            const isChecked = form.decorationServices?.includes(service);
            return (
              <label key={service} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleArrayItem('decorationServices', service)}
                />
                <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                {service}
              </label>
            );
          })}
        </div>
      </section>

      {/* SECTION C — DECORATION STYLE */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>03</span>
          <div>
            <h2>Section C — Decoration Styles</h2>
            <p>Select the decoration themes and styles you specialize in.</p>
          </div>
        </div>
        <div className="facility-checkbox-grid">
          {DECORATION_STYLES_OPTIONS.map((style) => {
            const isChecked = form.decorationStyles?.includes(style);
            return (
              <label key={style} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleArrayItem('decorationStyles', style)}
                />
                <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                {style}
              </label>
            );
          })}
        </div>
      </section>

      {/* SECTION D — WEDDING DECOR REQUIREMENTS */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>04</span>
          <div>
            <h2>Section D — Wedding Decor Requirements</h2>
            <p>Specify which decoration elements you can set up.</p>
          </div>
        </div>
        <div className="facility-checkbox-grid">
          {[
            ['mandapAvailable', 'Mandap Decoration Available'],
            ['stageAvailable', 'Stage Decoration Available'],
            ['floralDecoration', 'Floral Decoration'],
            ['lighting', 'Lighting Decoration'],
            ['entrance', 'Entrance Setup'],
            ['tablesChairs', 'Tables / Chairs Decor'],
            ['ceilingDecoration', 'Ceiling Decoration'],
            ['backdrop', 'Backdrop Setup'],
            ['welcomeArea', 'Welcome Area Decor'],
          ].map(([key, label]) => {
            const isChecked = Boolean(form.decorRequirements?.[key]);
            return (
              <label key={key} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleRequirementChange(key)}
                />
                <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                {label}
              </label>
            );
          })}
        </div>
      </section>

      {/* SECTION E — EVENT TYPES */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>05</span>
          <div>
            <h2>Section E — Event Types</h2>
            <p>Select which event types you cater to.</p>
          </div>
        </div>
        <div className="facility-checkbox-grid">
          {EVENT_TYPES_OPTIONS.map((event) => {
            const isChecked = form.eventTypes?.includes(event);
            return (
              <label key={event} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleArrayItem('eventTypes', event)}
                />
                <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                {event}
              </label>
            );
          })}
        </div>
      </section>

      {/* SECTION F — VENUE TYPE SUPPORT */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>06</span>
          <div>
            <h2>Section F — Venue Type Support</h2>
            <p>Select supported venue environments.</p>
          </div>
        </div>
        <div className="facility-checkbox-grid">
          {VENUE_TYPES_OPTIONS.map((vType) => {
            const isChecked = form.venueTypes?.includes(vType);
            return (
              <label key={vType} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleArrayItem('venueTypes', vType)}
                />
                <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                {vType}
              </label>
            );
          })}
        </div>
      </section>

      {/* SECTION G — PRICING */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>07</span>
          <div>
            <h2>Section G — Pricing</h2>
            <p>Set your starting pricing and budget ranges.</p>
          </div>
        </div>
        <div className="venue-form-grid">
          <label>
            Starting Price (₹) *
            <input
              type="number"
              name="startingPrice"
              min="0"
              value={form.startingPrice}
              onChange={handleChange}
              placeholder="e.g. 25000"
              required
            />
            {fieldErrors.startingPrice && <small className="field-error">{fieldErrors.startingPrice}</small>}
          </label>

          <label>
            Pricing Type *
            <select name="pricingType" value={form.pricingType} onChange={handleChange} required>
              <option value="Per Event">Per Event</option>
              <option value="Decoration Package">Decoration Package</option>
              <option value="Custom Quote">Custom Quote</option>
            </select>
          </label>

          <label>
            Minimum Budget (₹)
            <input
              type="number"
              name="minBudget"
              min="0"
              value={form.minBudget}
              onChange={handleChange}
              placeholder="e.g. 25000"
            />
          </label>

          <label>
            Maximum Budget (₹)
            <input
              type="number"
              name="maxBudget"
              min="0"
              value={form.maxBudget}
              onChange={handleChange}
              placeholder="e.g. 200000"
            />
          </label>

          <label className="facility-checkbox form-full">
            <input
              type="checkbox"
              name="customQuoteAvailable"
              checked={Boolean(form.customQuoteAvailable)}
              onChange={handleChange}
            />
            <span className="custom-check" aria-hidden="true">{form.customQuoteAvailable ? '✓' : ''}</span>
            Custom Quote Available for tailored requirements
          </label>
        </div>
      </section>

      {/* SECTION H — DECORATION PACKAGES */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>08</span>
          <div>
            <h2>Section H — Decoration Packages</h2>
            <p>Add pre-configured decoration packages for couples.</p>
          </div>
        </div>

        <div className="packages-manager">
          {form.packages && form.packages.length > 0 ? (
            <div className="packages-list" style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
              {form.packages.map((pkg, idx) => (
                <div key={idx} className="package-card" style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '1.1rem' }}>{pkg.packageName} — ₹{Number(pkg.price).toLocaleString('en-IN')}</strong>
                    <button type="button" className="danger-link" onClick={() => handleRemovePackage(idx)}>Delete</button>
                  </div>
                  {pkg.description && <p style={{ margin: '8px 0 0', color: '#666' }}>{pkg.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty" style={{ marginBottom: '15px' }}>No packages added yet.</p>
          )}

          <div className="venue-form-grid" style={{ background: '#f5f7fa', padding: '15px', borderRadius: '8px' }}>
            <label>
              Package Name
              <input
                value={newPackage.packageName}
                onChange={(e) => setNewPackage((prev) => ({ ...prev, packageName: e.target.value }))}
                placeholder="e.g. Basic Wedding Decoration"
              />
            </label>
            <label>
              Price (₹)
              <input
                type="number"
                min="0"
                value={newPackage.price}
                onChange={(e) => setNewPackage((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="e.g. 35000"
              />
            </label>
            <label className="form-full">
              Package Inclusions / Details
              <input
                value={newPackage.description}
                onChange={(e) => setNewPackage((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="e.g. Stage, Entrance, Basic Lighting, Mandap"
              />
            </label>
            <div className="form-full">
              <button type="button" className="secondary-button" onClick={handleAddPackage}>+ Add Package</button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION I — ADD-ON SERVICES */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>09</span>
          <div>
            <h2>Section I — Add-on Services</h2>
            <p>Select standard add-ons or enter custom additions.</p>
          </div>
        </div>
        <div className="facility-checkbox-grid">
          {ADD_ON_OPTIONS.map((addon) => {
            const isChecked = form.addOns?.includes(addon);
            return (
              <label key={addon} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleArrayItem('addOns', addon)}
                />
                <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                {addon}
              </label>
            );
          })}
        </div>

        <div className="blocked-date-editor" style={{ marginTop: '20px' }}>
          <label>Add Custom Add-on</label>
          <input
            value={customAddOnInput}
            onChange={(e) => setCustomAddOnInput(e.target.value)}
            placeholder="e.g. Custom Flower Arch"
          />
          <button type="button" className="secondary-button" onClick={addCustomAddOn}>Add</button>
        </div>

        {form.addOns && form.addOns.length > 0 && (
          <div className="blocked-date-tags" style={{ marginTop: '10px' }}>
            {form.addOns.map((item) => (
              <button key={item} type="button" onClick={() => removeAddOn(item)}>
                {item} ×
              </button>
            ))}
          </div>
        )}
      </section>

      {/* SECTION J — GUEST / EVENT CAPACITY */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>10</span>
          <div>
            <h2>Section J — Guest / Event Capacity</h2>
            <p>Define guest capacity ranges you can serve.</p>
          </div>
        </div>
        <div className="venue-form-grid">
          <label>
            Minimum Guests
            <input
              type="number"
              name="minGuests"
              min="1"
              value={form.minGuests}
              onChange={handleChange}
              placeholder="e.g. 50"
            />
          </label>
          <label>
            Maximum Guests
            <input
              type="number"
              name="maxGuests"
              min="1"
              value={form.maxGuests}
              onChange={handleChange}
              placeholder="e.g. 1000"
            />
          </label>
        </div>
      </section>

      {/* SECTION K — SERVICE AREA */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>11</span>
          <div>
            <h2>Section K — Service Area</h2>
            <p>Add cities, nearby cities, or districts where you provide service.</p>
          </div>
        </div>
        <div className="blocked-date-editor">
          <label>Add Service Area</label>
          <input
            value={serviceAreaInput}
            onChange={(e) => setServiceAreaInput(e.target.value)}
            placeholder="e.g. Surat, Navsari, Vadodara"
          />
          <button type="button" className="secondary-button" onClick={addServiceArea}>Add Area</button>
        </div>
        <div className="blocked-date-tags" style={{ marginTop: '10px' }}>
          {form.serviceAreas && form.serviceAreas.length > 0 ? (
            form.serviceAreas.map((area) => (
              <button key={area} type="button" onClick={() => removeServiceArea(area)}>
                {area} ×
              </button>
            ))
          ) : (
            <p className="dashboard-empty">No service areas added yet.</p>
          )}
        </div>
      </section>

      {/* SECTION L — AVAILABILITY */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>12</span>
          <div>
            <h2>Section L — Availability</h2>
            <p>Control whether you are currently taking bookings.</p>
          </div>
        </div>
        <div className="venue-form-grid">
          <label className="facility-checkbox form-full">
            <input
              type="checkbox"
              name="availableForBooking"
              checked={Boolean(form.availableForBooking)}
              onChange={handleChange}
            />
            <span className="custom-check" aria-hidden="true">{form.availableForBooking ? '✓' : ''}</span>
            Available for Booking / Enquiry
          </label>
        </div>
      </section>

      {/* SECTION M — PORTFOLIO */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>13</span>
          <div>
            <h2>Section M — Portfolio</h2>
            <p>Upload cover and gallery images of your decoration work.</p>
          </div>
        </div>
        <div className="venue-form-grid">
          <label className="form-full">
            Cover Image URL
            <input
              name="coverImage"
              type="url"
              value={form.coverImage}
              onChange={handleChange}
              placeholder="https://..."
            />
          </label>
          <label>
            Upload Cover Image File
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectCover} />
          </label>
          <label>
            Upload Gallery Image Files
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectGallery} />
          </label>
        </div>

        {(coverPreview || form.coverImage) && (
          <div className="upload-preview" style={{ marginTop: '15px' }}>
            <p>Cover Preview</p>
            <VenueImage src={coverPreview || form.coverImage} alt="Decorator cover preview" />
          </div>
        )}

        {((form.gallery && form.gallery.length > 0) || (galleryPreviews && galleryPreviews.length > 0)) && (
          <div className="upload-gallery-preview" style={{ marginTop: '15px' }}>
            <p>Gallery Preview</p>
            <div>
              {form.gallery?.map((img) => (
                <VenueImage key={img} src={img} alt="Gallery item" />
              ))}
              {galleryPreviews?.map((img) => (
                <VenueImage key={img} src={img} alt="New preview" />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTION N — POLICIES */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>14</span>
          <div>
            <h2>Section N — Policies</h2>
            <p>State your cancellation, payment, and terms conditions.</p>
          </div>
        </div>
        <div className="venue-form-grid">
          <label>
            Advance Payment (% or amount)
            <input
              name="advancePayment"
              value={form.advancePayment}
              onChange={handleChange}
              placeholder="e.g. 30% advance required on booking"
            />
          </label>

          <label className="form-full">
            Cancellation Policy
            <textarea
              name="cancellationPolicy"
              value={form.cancellationPolicy}
              onChange={handleChange}
              rows="3"
              placeholder="Full refund if cancelled 15 days prior to event..."
            />
          </label>

          <label className="form-full">
            Terms & Conditions
            <textarea
              name="termsAndConditions"
              value={form.termsAndConditions}
              onChange={handleChange}
              rows="3"
              placeholder="Decoration requirements must be finalized at least 7 days before the event."
            />
          </label>
        </div>
      </section>
    </div>
  );
}

