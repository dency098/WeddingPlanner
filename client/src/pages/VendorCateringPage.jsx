import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  createCatering,
  deleteCatering,
  getVendorCatering,
  setCateringActive,
  updateCatering,
} from '../services/cateringService';

const dietaryOptions = ['Veg', 'Non-Veg', 'Both'];
const staffingOptionsList = ['Catering Boys', 'Food Warmers', 'Servers', 'Male Staff', 'Female Staff'];
const emptyForm = {
  companyName: '', contactPerson: '', description: '',
  minCapacity: '', maxCapacity: '', capacityPerDay: '',
  destinationCatering: false, dietaryType: '', pricePerPlate: '',
  termsAndConditions: '', staffingOptions: [], menuPdf: '', operationalLocations: '',
  yearsOfExperience: '', fssaiLicense: '', awards: '', cuisines: ''
};

const formatPrice = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const getError = (error) => error.response?.data?.message || error.message || 'Something went wrong. Please try again.';

export default function VendorCateringPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const adding = location.pathname === '/vendor/catering/add';
  const showForm = adding || editing;
  const [caterings, setCaterings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (editing) {
          const caterList = await getVendorCatering();
          const cater = caterList.find(c => c._id === id);
          if (!active) return;
          if (cater) {
            setForm({
              ...emptyForm,
              ...cater,
              minCapacity: String(cater.minCapacity),
              maxCapacity: String(cater.maxCapacity),
              capacityPerDay: cater.capacityPerDay ? String(cater.capacityPerDay) : '',
              pricePerPlate: String(cater.pricePerPlate),
              staffingOptions: cater.staffingOptions || [],
              operationalLocations: cater.operationalLocations ? cater.operationalLocations.join(', ') : '',
              yearsOfExperience: cater.yearsOfExperience ? String(cater.yearsOfExperience) : '',
              fssaiLicense: cater.fssaiLicense || '',
              awards: cater.awards ? cater.awards.join(', ') : '',
              cuisines: cater.cuisines ? cater.cuisines.join(', ') : '',
            });
          } else {
             setError('Catering service not found.');
          }
        } else if (adding) {
          setForm(emptyForm);
          setMessage('');
          setFieldErrors({});
        } else {
          const result = await getVendorCatering();
          if (active) setCaterings(result);
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

  const refreshList = async () => setCaterings(await getVendorCatering());
  
  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
    setError('');
  };

  const changeStaffing = (option) => {
    setForm((current) => ({
      ...current,
      staffingOptions: current.staffingOptions.includes(option)
        ? current.staffingOptions.filter((item) => item !== option)
        : [...current.staffingOptions, option],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    setFieldErrors({});
    try {
      if (Number(form.maxCapacity) < Number(form.minCapacity)) {
        setFieldErrors({ maxCapacity: 'Maximum capacity must be greater than or equal to minimum capacity.' });
        return;
      }
      
      const payload = {
        companyName: form.companyName.trim(),
        contactPerson: form.contactPerson.trim(),
        description: form.description.trim(),
        minCapacity: Number(form.minCapacity),
        maxCapacity: Number(form.maxCapacity),
        capacityPerDay: form.capacityPerDay ? Number(form.capacityPerDay) : undefined,
        destinationCatering: form.destinationCatering,
        dietaryType: form.dietaryType,
        pricePerPlate: Number(form.pricePerPlate),
        termsAndConditions: form.termsAndConditions.trim(),
        staffingOptions: form.staffingOptions,
        menuPdf: form.menuPdf.trim(),
        operationalLocations: form.operationalLocations.split(',').map(s => s.trim()).filter(Boolean),
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
        fssaiLicense: form.fssaiLicense.trim(),
        awards: form.awards.split(',').map(s => s.trim()).filter(Boolean),
        cuisines: form.cuisines.split(',').map(s => s.trim()).filter(Boolean),
      };
      
      const response = editing ? await updateCatering(id, payload) : await createCatering(payload);
      if (editing) {
        setMessage(response.message);
      } else {
        navigate('/vendor/catering', { state: { notice: response.message } });
      }
    } catch (apiError) {
      setError(getError(apiError));
      setFieldErrors(apiError.response?.data?.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (catering) => {
    try {
      await setCateringActive(catering._id, !catering.isActive);
      await refreshList();
    } catch (apiError) {
      setError(getError(apiError));
    }
  };

  const removeCatering = async (catering) => {
    if (!window.confirm(`Delete "${catering.companyName}"?`)) return;
    try {
      await deleteCatering(catering._id);
      await refreshList();
    } catch (apiError) {
      setError(getError(apiError));
    }
  };

  if (loading && !adding) return <main className="venue-state">Loading your catering services…</main>;

  if (!showForm) {
    return (
      <main className="venue-management-page">
        <header className="venue-management-heading">
          <div><p className="eyebrow">Vendor workspace</p><h1>Catering Services</h1><p>Manage your food and catering options.</p></div>
          <Link className="primary-button" to="/vendor/catering/add">Add catering</Link>
        </header>
        {location.state?.notice && <div className="venue-alert success" role="status">{location.state.notice}</div>}
        {error && <div className="venue-alert error" role="alert">{error}</div>}
        {loading ? <div className="venue-state">Loading catering…</div> : caterings.length === 0 ? (
          <div className="venue-state"><h2>No catering services yet.</h2><Link className="primary-button" to="/vendor/catering/add">Create a catering listing</Link></div>
        ) : (
          <div className="vendor-venue-grid">
            {caterings.map((cater) => (
              <article className="vendor-venue-card" key={cater._id}>
                <div className="vendor-venue-card-content">
                  <div className="venue-title-status"><div><h2>{cater.companyName}</h2><p>{cater.dietaryType} Catering</p></div><span className={`moderation-badge ${cater.approvalStatus}`}>{cater.approvalStatus}</span></div>
                  <p className="vendor-venue-price">{formatPrice(cater.pricePerPlate)} <span>Per Plate</span></p>
                  <p className="venue-capacity">{cater.minCapacity}–{cater.maxCapacity} guests · {cater.isActive ? 'Active' : 'Inactive'}</p>
                  <div className="vendor-venue-actions">
                    <Link to={`/vendor/catering/edit/${cater._id}`}>Edit</Link>
                    <button type="button" onClick={() => toggleActive(cater)}>{cater.isActive ? 'Deactivate' : 'Activate'}</button>
                    <button type="button" className="danger-link" onClick={() => removeCatering(cater)}>Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="venue-management-page venue-form-page">
      <Link className="back-link" to="/vendor/catering">← Back to Catering Services</Link>
      <header className="venue-management-heading"><div><p className="eyebrow">Catering listing</p><h1>{editing ? 'Edit catering service' : 'Add a catering service'}</h1><p>Provide details about your food and service offerings.</p></div></header>
      {error && <div className="venue-alert error" role="alert">{error}</div>}
      {message && <div className="venue-alert success" role="status">{message}</div>}

      <form className="venue-edit-form" onSubmit={handleSubmit}>
        <section className="venue-form-section">
          <div className="venue-form-section-heading"><span>01</span><div><h2>Basic information</h2></div></div>
          <div className="venue-form-grid">
            <label>Company name<input name="companyName" value={form.companyName} onChange={change} maxLength="120" required /><FieldError value={fieldErrors.companyName} /></label>
            <label>Contact person<input name="contactPerson" value={form.contactPerson} onChange={change} maxLength="100" required /><FieldError value={fieldErrors.contactPerson} /></label>
            <label>Years of experience<input type="number" name="yearsOfExperience" value={form.yearsOfExperience} onChange={change} min="0" /><FieldError value={fieldErrors.yearsOfExperience} /></label>
            <label>FSSAI License<input name="fssaiLicense" value={form.fssaiLicense} onChange={change} /><FieldError value={fieldErrors.fssaiLicense} /></label>
            <label className="form-full">Awards (comma separated)<input name="awards" value={form.awards} onChange={change} /><FieldError value={fieldErrors.awards} /></label>
            <label>Dietary type<select name="dietaryType" value={form.dietaryType} onChange={change} required><option value="">Choose a type</option>{dietaryOptions.map((type) => <option key={type}>{type}</option>)}</select><FieldError value={fieldErrors.dietaryType} /></label>
            <label className="form-full">Cuisines (comma separated)<input name="cuisines" value={form.cuisines} onChange={change} /><FieldError value={fieldErrors.cuisines} /></label>
            <label className="form-full">Description<textarea name="description" value={form.description} onChange={change} rows="3" maxLength="5000" /><FieldError value={fieldErrors.description} /></label>
          </div>
        </section>

        <section className="venue-form-section">
          <div className="venue-form-section-heading"><span>02</span><div><h2>Capacity & Location</h2></div></div>
          <div className="venue-form-grid">
            <label>Minimum guests<input type="number" name="minCapacity" min="1" value={form.minCapacity} onChange={change} required /><FieldError value={fieldErrors.minCapacity} /></label>
            <label>Maximum guests<input type="number" name="maxCapacity" min="1" value={form.maxCapacity} onChange={change} required /><FieldError value={fieldErrors.maxCapacity} /></label>
            <label>Capacity per day<input type="number" name="capacityPerDay" min="1" value={form.capacityPerDay} onChange={change} /><FieldError value={fieldErrors.capacityPerDay} /></label>
            <label className="form-full">Operational locations (comma separated)<input name="operationalLocations" value={form.operationalLocations} onChange={change} placeholder="e.g. Mumbai, Pune" /></label>
            <label className="facility-checkbox form-full">
              <input type="checkbox" name="destinationCatering" checked={form.destinationCatering} onChange={change} />
              <span className="custom-check" aria-hidden="true">{form.destinationCatering ? '✓' : ''}</span> Destination Catering Available
            </label>
          </div>
        </section>

        <section className="venue-form-section">
          <div className="venue-form-section-heading"><span>03</span><div><h2>Pricing & Menus</h2></div></div>
          <div className="venue-form-grid">
            <label>Price per plate (₹)<input type="number" name="pricePerPlate" min="0" step="1" value={form.pricePerPlate} onChange={change} required /><FieldError value={fieldErrors.pricePerPlate} /></label>
            <label>Menu PDF URL<input type="url" name="menuPdf" value={form.menuPdf} onChange={change} placeholder="https://..." /><FieldError value={fieldErrors.menuPdf} /></label>
          </div>
        </section>

        <section className="venue-form-section">
          <div className="venue-form-section-heading"><span>04</span><div><h2>Staffing Options</h2></div></div>
          <div className="facility-checkbox-grid">
            {staffingOptionsList.map((option) => (
              <label className={`facility-checkbox ${form.staffingOptions.includes(option) ? 'checked' : ''}`} key={option}>
                <input type="checkbox" checked={form.staffingOptions.includes(option)} onChange={() => changeStaffing(option)} />
                <span className="custom-check" aria-hidden="true">{form.staffingOptions.includes(option) ? '✓' : ''}</span>{option}
              </label>
            ))}
          </div>
        </section>

        <section className="venue-form-section">
          <div className="venue-form-section-heading"><span>05</span><div><h2>Policies</h2></div></div>
          <div className="venue-form-grid">
            <label className="form-full">Terms and conditions<textarea name="termsAndConditions" value={form.termsAndConditions} onChange={change} rows="3" maxLength="5000" /></label>
          </div>
        </section>

        {error && <div className="venue-alert error" role="alert">{error}</div>}
        {message && <div className="venue-alert success" role="status">{message}</div>}
        <div className="venue-form-submit-row"><p>Listings are reviewed before appearing publicly.</p><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Submit catering'}</button></div>
      </form>
    </main>
  );
}

function FieldError({ value }) {
  return value ? <small className="field-error">{value}</small> : null;
}
