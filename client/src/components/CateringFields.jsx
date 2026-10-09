import { useState } from 'react';
import VenueImage from './VenueImage';

const CATERING_TYPES_OPTIONS = [
  'Full Service Catering',
  'Buffet Catering',
  'Traditional Catering',
  'Premium Catering',
  'Outdoor Catering',
  'Corporate Catering',
  'Wedding Catering',
];

const CUISINES_OPTIONS = [
  'Gujarati',
  'Punjabi',
  'North Indian',
  'South Indian',
  'Rajasthani',
  'Jain',
  'Chinese',
  'Continental',
  'Italian',
  'Mexican',
  'Mughlai',
  'Other',
];

const FOOD_PREFERENCES_OPTIONS = [
  'Vegetarian',
  'Jain',
  'Swaminarayan',
  'Vegan',
  'Non-Vegetarian',
  'Custom',
];

const MEAL_TYPES_OPTIONS = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'High Tea',
  'Snacks',
  'Welcome Drinks',
];

const EVENT_TYPES_OPTIONS = [
  'Wedding',
  'Reception',
  'Engagement',
  'Mehendi',
  'Haldi',
  'Sangeet',
  'Birthday',
  'Corporate Event',
];

const LIVE_COUNTERS_OPTIONS = [
  'Dosa Counter',
  'Chaat Counter',
  'Pasta Counter',
  'Pizza Counter',
  'Jalebi Counter',
  'Pani Puri Counter',
  'Chinese Counter',
  'Live Tandoor',
];

const SERVICE_INCLUSIONS_OPTIONS = [
  'Serving Staff',
  'Crockery',
  'Cutlery',
  'Tables',
  'Chairs',
  'Buffet Setup',
  'Food Counter Setup',
  'Kitchen Setup',
  'Cleaning',
];

const ADDITIONAL_SERVICES_OPTIONS = [
  'Welcome Drinks',
  'Wedding Cake',
  'Dessert Counter',
  'Tea/Coffee',
  'Waiter Service',
  'Chef Service',
  'Decoration of Food Counters',
];

export default function CateringFields({
  form = {},
  setForm,
  fieldErrors = {},
  selectCover,
  selectGallery,
  coverPreview,
  galleryPreviews = [],
}) {
  const [newPackage, setNewPackage] = useState({ packageName: '', description: '', pricePerPlate: '', includedItems: '' });
  const [newItem, setNewItem] = useState({ name: '', category: 'Main Course', description: '', isVeg: true, isJain: false });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleArrayItem = (arrayName, item) => {
    setForm((prev) => {
      const currentList = Array.isArray(prev[arrayName]) ? prev[arrayName] : [];
      const updated = currentList.includes(item)
        ? currentList.filter((i) => i !== item)
        : [...currentList, item];
      return { ...prev, [arrayName]: updated };
    });
  };

  const addPackage = () => {
    if (!newPackage.packageName.trim() || !newPackage.pricePerPlate) return;
    setForm((prev) => ({
      ...prev,
      packages: [
        ...(Array.isArray(prev.packages) ? prev.packages : []),
        {
          packageName: newPackage.packageName.trim(),
          description: newPackage.description.trim(),
          pricePerPlate: Number(newPackage.pricePerPlate),
          includedItems: newPackage.includedItems.split(',').map((s) => s.trim()).filter(Boolean),
        },
      ],
    }));
    setNewPackage({ packageName: '', description: '', pricePerPlate: '', includedItems: '' });
  };

  const removePackage = (idx) => {
    setForm((prev) => ({
      ...prev,
      packages: (Array.isArray(prev.packages) ? prev.packages : []).filter((_, i) => i !== idx),
    }));
  };

  const addMenuItem = () => {
    if (!newItem.name.trim()) return;
    setForm((prev) => ({
      ...prev,
      menuItems: [
        ...(Array.isArray(prev.menuItems) ? prev.menuItems : []),
        {
          name: newItem.name.trim(),
          category: newItem.category,
          description: newItem.description.trim(),
          isVeg: Boolean(newItem.isVeg),
          isJain: Boolean(newItem.isJain),
        },
      ],
    }));
    setNewItem({ name: '', category: 'Main Course', description: '', isVeg: true, isJain: false });
  };

  const removeMenuItem = (idx) => {
    setForm((prev) => ({
      ...prev,
      menuItems: (Array.isArray(prev.menuItems) ? prev.menuItems : []).filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="catering-form-sections">
      {/* 01 BASIC INFORMATION */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>01</span>
          <div>
            <h2>Basic Information</h2>
            <p>Enter your catering business information.</p>
          </div>
        </div>
        <div className="venue-form-grid">
          <label>
            Catering Business Name *
            <input
              name="companyName"
              value={form.companyName || ''}
              onChange={handleChange}
              placeholder="e.g. Royal Feast Caterers"
              required
            />
            {fieldErrors.companyName && <small className="field-error">{fieldErrors.companyName}</small>}
          </label>

          <label>
            Contact Person *
            <input
              name="contactPerson"
              value={form.contactPerson || ''}
              onChange={handleChange}
              placeholder="e.g. Rajesh Shah"
              required
            />
            {fieldErrors.contactPerson && <small className="field-error">{fieldErrors.contactPerson}</small>}
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
              placeholder="e.g. contact@royalfeast.com"
            />
          </label>

          <label>
            City *
            <input
              name="city"
              value={form.city || ''}
              onChange={handleChange}
              placeholder="e.g. Surat"
              required
            />
          </label>

          <label>
            Area / Location
            <input
              name="area"
              value={form.area || ''}
              onChange={handleChange}
              placeholder="e.g. Adajan"
            />
          </label>

          <label>
            Years of Experience
            <input
              type="number"
              name="yearsOfExperience"
              min="0"
              value={form.yearsOfExperience || ''}
              onChange={handleChange}
            />
          </label>

          <label className="form-full">
            Full Address
            <input
              name="address"
              value={form.address || ''}
              onChange={handleChange}
              placeholder="Full office/kitchen address"
            />
          </label>

          <label className="form-full">
            Description
            <textarea
              name="description"
              value={form.description || ''}
              onChange={handleChange}
              rows="4"
              placeholder="Describe your culinary expertise, specialty dishes, hygiene standards, and catering setup..."
            />
          </label>
        </div>
      </section>

      {/* 02 CATERING TYPES & CUISINES */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>02</span>
          <div>
            <h2>Catering Type & Cuisines</h2>
            <p>Select service types and cuisines offered.</p>
          </div>
        </div>

        <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Catering Types:</label>
        <div className="facility-checkbox-grid" style={{ marginBottom: '20px' }}>
          {CATERING_TYPES_OPTIONS.map((ct) => {
            const isChecked = Array.isArray(form.cateringTypes) && form.cateringTypes.includes(ct);
            return (
              <label key={ct} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                <input type="checkbox" checked={Boolean(isChecked)} onChange={() => toggleArrayItem('cateringTypes', ct)} />
                <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                {ct}
              </label>
            );
          })}
        </div>

        <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Cuisines Offered:</label>
        <div className="facility-checkbox-grid">
          {CUISINES_OPTIONS.map((cuisine) => {
            const isChecked = Array.isArray(form.cuisines) && form.cuisines.includes(cuisine);
            return (
              <label key={cuisine} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                <input type="checkbox" checked={Boolean(isChecked)} onChange={() => toggleArrayItem('cuisines', cuisine)} />
                <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                {cuisine}
              </label>
            );
          })}
        </div>
      </section>

      {/* 03 FOOD PREFERENCE & MEAL TYPES */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>03</span>
          <div>
            <h2>Food Preferences & Meal Types</h2>
            <p>Select dietary options and meal timings supported.</p>
          </div>
        </div>

        <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Food Preferences:</label>
        <div className="facility-checkbox-grid" style={{ marginBottom: '20px' }}>
          {FOOD_PREFERENCES_OPTIONS.map((fp) => {
            const isChecked = Array.isArray(form.foodPreferences) && form.foodPreferences.includes(fp);
            return (
              <label key={fp} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                <input type="checkbox" checked={Boolean(isChecked)} onChange={() => toggleArrayItem('foodPreferences', fp)} />
                <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                {fp}
              </label>
            );
          })}
        </div>

        <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Meal Types Served:</label>
        <div className="facility-checkbox-grid">
          {MEAL_TYPES_OPTIONS.map((mt) => {
            const isChecked = Array.isArray(form.mealTypes) && form.mealTypes.includes(mt);
            return (
              <label key={mt} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                <input type="checkbox" checked={Boolean(isChecked)} onChange={() => toggleArrayItem('mealTypes', mt)} />
                <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                {mt}
              </label>
            );
          })}
        </div>
      </section>

      {/* 04 CAPACITY & PRICING */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>04</span>
          <div>
            <h2>Capacity & Pricing</h2>
            <p>Set price per plate and order limits.</p>
          </div>
        </div>
        <div className="venue-form-grid">
          <label>
            Starting Price Per Plate (₹) *
            <input type="number" name="pricePerPlate" min="0" value={form.pricePerPlate || ''} onChange={handleChange} required />
            {fieldErrors.pricePerPlate && <small className="field-error">{fieldErrors.pricePerPlate}</small>}
          </label>

          <label>
            Minimum Guests *
            <input type="number" name="minCapacity" min="1" value={form.minCapacity || ''} onChange={handleChange} required />
            {fieldErrors.minCapacity && <small className="field-error">{fieldErrors.minCapacity}</small>}
          </label>

          <label>
            Maximum Guests *
            <input type="number" name="maxCapacity" min="1" value={form.maxCapacity || ''} onChange={handleChange} required />
            {fieldErrors.maxCapacity && <small className="field-error">{fieldErrors.maxCapacity}</small>}
          </label>

          <label>
            Extra Travel Charge (₹)
            <input type="number" name="extraTravelCharge" min="0" value={form.extraTravelCharge || '0'} onChange={handleChange} />
          </label>

          <label className="facility-checkbox form-full">
            <input type="checkbox" name="customQuoteAvailable" checked={Boolean(form.customQuoteAvailable)} onChange={handleChange} />
            <span className="custom-check" aria-hidden="true">{form.customQuoteAvailable ? '✓' : ''}</span>
            Custom Menu & Quote Available
          </label>
        </div>
      </section>

      {/* 05 MENU PACKAGES */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>05</span>
          <div>
            <h2>Menu Packages (Basic, Premium, Luxury)</h2>
            <p>Add pre-set menu packages for clients.</p>
          </div>
        </div>

        {Array.isArray(form.packages) && form.packages.length > 0 && (
          <div style={{ display: 'grid', gap: '10px', marginBottom: '15px' }}>
            {form.packages.map((pkg, idx) => (
              <div key={idx} style={{ padding: '12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{pkg.packageName} — ₹{pkg.pricePerPlate} / plate</strong>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>{pkg.description || pkg.includedItems?.join(', ')}</p>
                </div>
                <button type="button" className="danger-link" onClick={() => removePackage(idx)}>Delete</button>
              </div>
            ))}
          </div>
        )}

        <div className="venue-form-grid" style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px' }}>
          <label>
            Package Name
            <input value={newPackage.packageName} onChange={(e) => setNewPackage({ ...newPackage, packageName: e.target.value })} placeholder="e.g. Royal Gujarati Package" />
          </label>
          <label>
            Price Per Plate (₹)
            <input type="number" min="0" value={newPackage.pricePerPlate} onChange={(e) => setNewPackage({ ...newPackage, pricePerPlate: e.target.value })} placeholder="e.g. 750" />
          </label>
          <label className="form-full">
            Inclusions / Items (comma separated)
            <input value={newPackage.includedItems} onChange={(e) => setNewPackage({ ...newPackage, includedItems: e.target.value })} placeholder="e.g. 2 Starters, 4 Mains, 2 Sweets, Live Chaat" />
          </label>
          <div className="form-full">
            <button type="button" className="secondary-button" onClick={addPackage}>+ Add Package</button>
          </div>
        </div>
      </section>

      {/* 06 LIVE COUNTERS & INCLUSIONS */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>06</span>
          <div>
            <h2>Live Counters & Service Inclusions</h2>
            <p>Select live food stalls and included services.</p>
          </div>
        </div>

        <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Live Counters:</label>
        <div className="facility-checkbox-grid" style={{ marginBottom: '20px' }}>
          {LIVE_COUNTERS_OPTIONS.map((lc) => {
            const isChecked = Array.isArray(form.liveCounters) && form.liveCounters.includes(lc);
            return (
              <label key={lc} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                <input type="checkbox" checked={Boolean(isChecked)} onChange={() => toggleArrayItem('liveCounters', lc)} />
                <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                {lc}
              </label>
            );
          })}
        </div>

        <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Service Inclusions:</label>
        <div className="facility-checkbox-grid">
          {SERVICE_INCLUSIONS_OPTIONS.map((si) => {
            const isChecked = Array.isArray(form.serviceInclusions) && form.serviceInclusions.includes(si);
            return (
              <label key={si} className={`facility-checkbox ${isChecked ? 'checked' : ''}`}>
                <input type="checkbox" checked={Boolean(isChecked)} onChange={() => toggleArrayItem('serviceInclusions', si)} />
                <span className="custom-check" aria-hidden="true">{isChecked ? '✓' : ''}</span>
                {si}
              </label>
            );
          })}
        </div>
      </section>

      {/* 07 MEDIA & POLICIES */}
      <section className="venue-form-section">
        <div className="venue-form-section-heading">
          <span>07</span>
          <div>
            <h2>Media & Policies</h2>
            <p>Upload catering photos and state policies.</p>
          </div>
        </div>
        <div className="venue-form-grid">
          <label className="form-full">
            Cover Image URL
            <input name="coverImage" type="url" value={form.coverImage || ''} onChange={handleChange} placeholder="https://..." />
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
            Menu PDF / Link
            <input name="menuPdf" type="url" value={form.menuPdf || ''} onChange={handleChange} placeholder="https://..." />
          </label>
          <label className="form-full">
            Cancellation Policy
            <textarea name="cancellationPolicy" value={form.cancellationPolicy || ''} onChange={handleChange} rows="3" />
          </label>
          <label className="form-full">
            Terms & Conditions
            <textarea name="termsAndConditions" value={form.termsAndConditions || ''} onChange={handleChange} rows="3" />
          </label>
        </div>

        {(coverPreview || form.coverImage) && (
          <div className="upload-preview" style={{ marginTop: '15px' }}>
            <p>Cover Preview</p>
            <VenueImage src={coverPreview || form.coverImage} alt="Catering cover preview" />
          </div>
        )}
      </section>
    </div>
  );
}
