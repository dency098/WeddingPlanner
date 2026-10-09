import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import VenueFields from '../components/VenueFields';
import CateringFields from '../components/CateringFields';
import DecoratorFields from '../components/DecoratorFields';
import VenueImage from '../components/VenueImage';
import {
  createVenue,
  deleteVenue,
  getVendorVenue,
  getVendorVenues,
  setVenueActive,
  updateVenue,
} from '../services/venueService';
import {
  createCatering,
  deleteCatering,
  getVendorCatering,
  setCateringActive,
  updateCatering,
} from '../services/cateringService';
import {
  createDecorator,
  deleteDecorator,
  getVendorDecorator,
  getVendorDecorators,
  setDecoratorActive,
  updateDecorator,
} from '../services/decoratorService';
import { uploadVenueImages, validateVenueImages } from '../services/venueImageService';

const emptyVenueForm = {
  venueName: '',
  venueType: '',
  description: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
  city: '',
  state: 'Gujarat',
  area: '',
  landmark: '',
  location: '',
  minimumGuests: '',
  maximumGuests: '',
  seatingCapacity: '',
  parkingCapacity: '0',
  numberOfRooms: '0',
  floatingCapacity: '',
  startingPrice: '',
  priceType: 'Per Day',
  advancePaymentPercentage: '',
  additionalChargeName: '',
  additionalChargeAmount: '',
  baseRentalFee: '0',
  decorationPolicy: 'In-house only',
  cateringPolicy: 'In-house only',
  alcoholPolicy: '',
  eventTypes: [],
  facilities: [],
  coverImage: '',
  gallery: [],
  venueVideo: '',
  cancellationPolicy: '',
  advancePayment: '0',
  eventDuration: '8',
  termsAndConditions: '',
  blockedDates: [],
  spaces: [],
  amenities: { changingRooms: 0, generatorBackup: false, valetParking: 0, acRooms: 0, wheelchairAccessible: false },
};

const emptyCateringForm = {
  companyName: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  city: '',
  area: '',
  address: '',
  description: '',
  minCapacity: '',
  maxCapacity: '',
  capacityPerDay: '',
  destinationCatering: false,
  dietaryType: 'Veg',
  pricePerPlate: '',
  extraTravelCharge: '0',
  customQuoteAvailable: true,
  termsAndConditions: '',
  cancellationPolicy: '',
  advancePayment: '',
  cateringTypes: [],
  cuisines: [],
  foodPreferences: [],
  mealTypes: [],
  eventTypes: [],
  liveCounters: [],
  serviceInclusions: [],
  additionalServices: [],
  staffingOptions: [],
  packages: [],
  menuItems: [],
  coverImage: '',
  gallery: [],
  menuPdf: '',
  operationalLocations: '',
  yearsOfExperience: '',
  fssaiLicense: '',
  awards: '',
};

const emptyDecoratorForm = {
  businessName: '',
  description: '',
  contactNumber: '',
  email: '',
  city: '',
  area: '',
  yearsOfExperience: '0',
  decorationServices: [],
  decorationStyles: [],
  decorRequirements: { mandapAvailable: false, stageAvailable: false, floralDecoration: false, lighting: false, entrance: false, tablesChairs: false, ceilingDecoration: false, backdrop: false, welcomeArea: false },
  eventTypes: [],
  venueTypes: [],
  startingPrice: '',
  pricingType: 'Custom Quote',
  minBudget: '',
  maxBudget: '',
  customQuoteAvailable: true,
  packages: [],
  addOns: [],
  minGuests: '50',
  maxGuests: '1000',
  serviceAreas: [],
  availableForBooking: true,
  coverImage: '',
  gallery: [],
  cancellationPolicy: '',
  advancePayment: '',
  termsAndConditions: '',
};

const formatPrice = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const getError = (error) => error.response?.data?.message || error.message || 'Something went wrong. Please try again.';

export default function VendorServicesPage() {
  const { serviceTypeParam, id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Route paths matching
  const isAddRoute = location.pathname.includes('/add');
  const isEditRoute = location.pathname.includes('/edit');
  const showForm = isAddRoute || isEditRoute;
  const editing = isEditRoute && Boolean(id);

  // Determine initial serviceType from route URL if provided
  let initialType = 'venue';
  if (location.pathname.includes('/catering') || serviceTypeParam === 'catering') initialType = 'catering';
  else if (location.pathname.includes('/decorator') || serviceTypeParam === 'decorator') initialType = 'decorator';
  else if (location.pathname.includes('/venue') || serviceTypeParam === 'venue') initialType = 'venue';

  const [serviceType, setServiceType] = useState(initialType);
  const [activeTab, setActiveTab] = useState('all');

  // Lists
  const [venues, setVenues] = useState([]);
  const [caterings, setCaterings] = useState([]);
  const [decorators, setDecorators] = useState([]);

  // Forms
  const [venueForm, setVenueForm] = useState(emptyVenueForm);
  const [cateringForm, setCateringForm] = useState(emptyCateringForm);
  const [decoratorForm, setDecoratorForm] = useState(emptyDecoratorForm);

  // Image Upload state
  const [coverFile, setCoverFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [coverPreview, setCoverPreview] = useState('');
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const previewUrls = useRef([]);
  const activeCoverPreview = useRef('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const urlsToRevoke = previewUrls.current;
    return () => {
      urlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Sync serviceType from params on load
  useEffect(() => {
    if (serviceTypeParam) {
      setServiceType(serviceTypeParam);
    } else if (location.pathname.includes('/catering')) {
      setServiceType('catering');
    } else if (location.pathname.includes('/venues')) {
      setServiceType('venue');
    }
  }, [serviceTypeParam, location.pathname]);

  // Load services or single edit service
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (editing) {
          if (serviceType === 'venue') {
            const venue = await getVendorVenue(id);
            if (!active) return;
            setVenueForm({
              ...emptyVenueForm,
              ...venue,
              minimumGuests: String(venue.minimumGuests ?? ''),
              maximumGuests: String(venue.maximumGuests ?? ''),
              floatingCapacity: venue.floatingCapacity ? String(venue.floatingCapacity) : '',
              seatingCapacity: String(venue.seatingCapacity ?? ''),
              parkingCapacity: String(venue.parkingCapacity ?? '0'),
              numberOfRooms: String(venue.numberOfRooms ?? '0'),
              startingPrice: String(venue.startingPrice ?? ''),
              baseRentalFee: String(venue.baseRentalFee ?? '0'),
              advancePayment: String(venue.advancePayment ?? '0'),
              eventDuration: String(venue.eventDuration ?? '8'),
              facilities: venue.facilities || [],
              eventTypes: venue.eventTypes || [],
              gallery: venue.gallery || [],
              spaces: venue.spaces || [],
              amenities: venue.amenities || { changingRooms: 0, generatorBackup: false, valetParking: 0, acRooms: 0, wheelchairAccessible: false },
              blockedDates: (venue.blockedDates || []).map((date) => new Date(date).toISOString().slice(0, 10)),
              additionalChargeName: venue.additionalCharges?.[0]?.name || '',
              additionalChargeAmount: venue.additionalCharges?.[0]?.amount !== undefined ? String(venue.additionalCharges[0].amount) : '',
            });
          } else if (serviceType === 'catering') {
            const caterList = await getVendorCatering();
            const cater = caterList.find((c) => c._id === id);
            if (!active) return;
            if (cater) {
              setCateringForm({
                ...emptyCateringForm,
                ...cater,
                minCapacity: String(cater.minCapacity ?? ''),
                maxCapacity: String(cater.maxCapacity ?? ''),
                capacityPerDay: cater.capacityPerDay ? String(cater.capacityPerDay) : '',
                pricePerPlate: String(cater.pricePerPlate ?? ''),
                staffingOptions: cater.staffingOptions || [],
                cuisines: Array.isArray(cater.cuisines) ? cater.cuisines : (cater.cuisines ? cater.cuisines.split(',').map(s=>s.trim()).filter(Boolean) : []),
                cateringTypes: cater.cateringTypes || [],
                foodPreferences: cater.foodPreferences || [],
                mealTypes: cater.mealTypes || [],
                eventTypes: cater.eventTypes || [],
                liveCounters: cater.liveCounters || [],
                serviceInclusions: cater.serviceInclusions || [],
                additionalServices: cater.additionalServices || [],
                packages: cater.packages || [],
                menuItems: cater.menuItems || [],
                operationalLocations: Array.isArray(cater.operationalLocations) ? cater.operationalLocations.join(', ') : (cater.operationalLocations || ''),
                yearsOfExperience: cater.yearsOfExperience ? String(cater.yearsOfExperience) : '',
                fssaiLicense: cater.fssaiLicense || '',
                awards: Array.isArray(cater.awards) ? cater.awards.join(', ') : (cater.awards || ''),
              });
            }
          } else if (serviceType === 'decorator') {
            const dec = await getVendorDecorator(id);
            if (!active) return;
            setDecoratorForm({
              ...emptyDecoratorForm,
              ...dec,
              yearsOfExperience: String(dec.yearsOfExperience || 0),
              startingPrice: String(dec.startingPrice || ''),
              minBudget: dec.minBudget ? String(dec.minBudget) : '',
              maxBudget: dec.maxBudget ? String(dec.maxBudget) : '',
              minGuests: String(dec.minGuests || 50),
              maxGuests: String(dec.maxGuests || 1000),
              decorationServices: dec.decorationServices || [],
              decorationStyles: dec.decorationStyles || [],
              eventTypes: dec.eventTypes || [],
              venueTypes: dec.venueTypes || [],
              packages: dec.packages || [],
              addOns: dec.addOns || [],
              serviceAreas: dec.serviceAreas || [],
              gallery: dec.gallery || [],
              decorRequirements: dec.decorRequirements || emptyDecoratorForm.decorRequirements,
            });
          }
        } else if (isAddRoute) {
          setMessage('');
          setFieldErrors({});
          setCoverFile(null);
          setGalleryFiles([]);
          setCoverPreview('');
          setGalleryPreviews([]);
        } else {
          // List view — load all vendor services in parallel
          const [venueList, cateringList, decoratorList] = await Promise.all([
            getVendorVenues().catch(() => []),
            getVendorCatering().catch(() => []),
            getVendorDecorators().catch(() => []),
          ]);
          if (active) {
            setVenues(venueList);
            setCaterings(cateringList);
            setDecorators(decoratorList);
          }
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
  }, [editing, isAddRoute, id, serviceType]);

  const refreshAllLists = async () => {
    const [venueList, cateringList, decoratorList] = await Promise.all([
      getVendorVenues().catch(() => []),
      getVendorCatering().catch(() => []),
      getVendorDecorators().catch(() => []),
    ]);
    setVenues(venueList);
    setCaterings(cateringList);
    setDecorators(decoratorList);
  };

  const handleServiceTypeChange = (newType) => {
    setServiceType(newType);
    setFieldErrors({});
    setError('');
  };

  // Image selection
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
      validateVenueImages(files);
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

  // Form Submissions
  const handleVenueSubmit = async () => {
    if (Number(venueForm.maximumGuests) < Number(venueForm.minimumGuests)) {
      setFieldErrors({ maximumGuests: 'Maximum guests must be greater than or equal to minimum guests.' });
      return;
    }
    let coverImage = venueForm.coverImage;
    if (coverFile) [coverImage] = await uploadVenueImages([coverFile]);
    if (!coverImage && !editing) {
      setFieldErrors({ coverImage: 'Add a cover image or enter an image URL.' });
      return;
    }
    const uploadedGallery = galleryFiles.length ? await uploadVenueImages(galleryFiles) : [];
    const additionalCharges = venueForm.additionalChargeName
      ? [{ name: venueForm.additionalChargeName, amount: Number(venueForm.additionalChargeAmount || 0) }]
      : [];
    const payload = {
      venueName: venueForm.venueName.trim(),
      venueType: venueForm.venueType,
      description: venueForm.description.trim(),
      contactPhone: venueForm.contactPhone ? venueForm.contactPhone.trim() : '',
      contactEmail: venueForm.contactEmail ? venueForm.contactEmail.trim() : '',
      address: venueForm.address.trim(),
      city: venueForm.city.trim(),
      state: venueForm.state ? venueForm.state.trim() : 'Gujarat',
      area: venueForm.area ? venueForm.area.trim() : '',
      landmark: venueForm.landmark ? venueForm.landmark.trim() : '',
      location: venueForm.location ? venueForm.location.trim() : '',
      minimumGuests: Number(venueForm.minimumGuests),
      maximumGuests: Number(venueForm.maximumGuests),
      seatingCapacity: Number(venueForm.seatingCapacity),
      parkingCapacity: Number(venueForm.parkingCapacity || 0),
      numberOfRooms: Number(venueForm.numberOfRooms || 0),
      startingPrice: Number(venueForm.startingPrice),
      priceType: venueForm.priceType || 'Per Day',
      advancePaymentPercentage: venueForm.advancePaymentPercentage ? venueForm.advancePaymentPercentage.trim() : '',
      additionalCharges,
      eventTypes: venueForm.eventTypes || [],
      facilities: venueForm.facilities || [],
      coverImage: coverImage || '',
      gallery: [...(venueForm.gallery || []), ...uploadedGallery],
      venueVideo: venueForm.venueVideo ? venueForm.venueVideo.trim() : '',
      cancellationPolicy: venueForm.cancellationPolicy ? venueForm.cancellationPolicy.trim() : '',
      advancePayment: Number(venueForm.advancePayment || 0),
      eventDuration: Number(venueForm.eventDuration || 8),
      termsAndConditions: venueForm.termsAndConditions ? venueForm.termsAndConditions.trim() : '',
      blockedDates: venueForm.blockedDates || [],
    };
    const response = editing ? await updateVenue(id, payload) : await createVenue(payload);
    if (editing) {
      setMessage(response.message);
    } else {
      navigate('/vendor/services', { state: { notice: response.message } });
    }
  };

  const handleCateringSubmit = async () => {
    if (Number(cateringForm.maxCapacity) < Number(cateringForm.minCapacity)) {
      setFieldErrors({ maxCapacity: 'Maximum capacity must be greater than or equal to minimum capacity.' });
      return;
    }
    let coverImage = cateringForm.coverImage;
    if (coverFile) [coverImage] = await uploadVenueImages([coverFile]);
    const uploadedGallery = galleryFiles.length ? await uploadVenueImages(galleryFiles) : [];

    const payload = {
      companyName: cateringForm.companyName.trim(),
      contactPerson: cateringForm.contactPerson.trim(),
      contactPhone: cateringForm.contactPhone ? cateringForm.contactPhone.trim() : '',
      contactEmail: cateringForm.contactEmail ? cateringForm.contactEmail.trim() : '',
      city: cateringForm.city ? cateringForm.city.trim() : '',
      area: cateringForm.area ? cateringForm.area.trim() : '',
      address: cateringForm.address ? cateringForm.address.trim() : '',
      description: cateringForm.description.trim(),
      minCapacity: Number(cateringForm.minCapacity),
      maxCapacity: Number(cateringForm.maxCapacity),
      capacityPerDay: cateringForm.capacityPerDay ? Number(cateringForm.capacityPerDay) : undefined,
      destinationCatering: Boolean(cateringForm.destinationCatering),
      dietaryType: cateringForm.dietaryType || 'Veg',
      pricePerPlate: Number(cateringForm.pricePerPlate),
      extraTravelCharge: Number(cateringForm.extraTravelCharge || 0),
      customQuoteAvailable: Boolean(cateringForm.customQuoteAvailable),
      termsAndConditions: cateringForm.termsAndConditions ? cateringForm.termsAndConditions.trim() : '',
      cancellationPolicy: cateringForm.cancellationPolicy ? cateringForm.cancellationPolicy.trim() : '',
      advancePayment: cateringForm.advancePayment ? cateringForm.advancePayment.trim() : '',
      cateringTypes: cateringForm.cateringTypes || [],
      cuisines: Array.isArray(cateringForm.cuisines) ? cateringForm.cuisines : [],
      foodPreferences: cateringForm.foodPreferences || [],
      mealTypes: cateringForm.mealTypes || [],
      eventTypes: cateringForm.eventTypes || [],
      liveCounters: cateringForm.liveCounters || [],
      serviceInclusions: cateringForm.serviceInclusions || [],
      additionalServices: cateringForm.additionalServices || [],
      staffingOptions: cateringForm.staffingOptions || [],
      packages: cateringForm.packages || [],
      menuItems: cateringForm.menuItems || [],
      coverImage: coverImage || '',
      gallery: [...(cateringForm.gallery || []), ...uploadedGallery],
      menuPdf: cateringForm.menuPdf ? cateringForm.menuPdf.trim() : '',
      operationalLocations: cateringForm.operationalLocations
        ? (Array.isArray(cateringForm.operationalLocations) ? cateringForm.operationalLocations : cateringForm.operationalLocations.split(',').map((s) => s.trim()).filter(Boolean))
        : [],
      yearsOfExperience: cateringForm.yearsOfExperience ? Number(cateringForm.yearsOfExperience) : undefined,
      fssaiLicense: cateringForm.fssaiLicense ? cateringForm.fssaiLicense.trim() : '',
      awards: cateringForm.awards
        ? (Array.isArray(cateringForm.awards) ? cateringForm.awards : cateringForm.awards.split(',').map((s) => s.trim()).filter(Boolean))
        : [],
    };
    const response = editing ? await updateCatering(id, payload) : await createCatering(payload);
    if (editing) {
      setMessage(response.message);
    } else {
      navigate('/vendor/services', { state: { notice: response.message } });
    }
  };

  const handleDecoratorSubmit = async () => {
    let coverImage = decoratorForm.coverImage;
    if (coverFile) [coverImage] = await uploadVenueImages([coverFile]);
    const uploadedGallery = galleryFiles.length ? await uploadVenueImages(galleryFiles) : [];

    const payload = {
      businessName: decoratorForm.businessName.trim(),
      description: decoratorForm.description.trim(),
      contactNumber: decoratorForm.contactNumber.trim(),
      email: decoratorForm.email.trim(),
      city: decoratorForm.city.trim(),
      area: decoratorForm.area ? decoratorForm.area.trim() : '',
      yearsOfExperience: Number(decoratorForm.yearsOfExperience || 0),
      decorationServices: decoratorForm.decorationServices,
      decorationStyles: decoratorForm.decorationStyles,
      decorRequirements: decoratorForm.decorRequirements,
      eventTypes: decoratorForm.eventTypes,
      venueTypes: decoratorForm.venueTypes,
      startingPrice: Number(decoratorForm.startingPrice),
      pricingType: decoratorForm.pricingType,
      minBudget: decoratorForm.minBudget ? Number(decoratorForm.minBudget) : undefined,
      maxBudget: decoratorForm.maxBudget ? Number(decoratorForm.maxBudget) : undefined,
      customQuoteAvailable: Boolean(decoratorForm.customQuoteAvailable),
      packages: decoratorForm.packages,
      addOns: decoratorForm.addOns,
      minGuests: Number(decoratorForm.minGuests || 50),
      maxGuests: Number(decoratorForm.maxGuests || 1000),
      serviceAreas: decoratorForm.serviceAreas,
      availableForBooking: Boolean(decoratorForm.availableForBooking),
      coverImage: coverImage || '',
      gallery: [...(decoratorForm.gallery || []), ...uploadedGallery],
      cancellationPolicy: decoratorForm.cancellationPolicy ? decoratorForm.cancellationPolicy.trim() : '',
      advancePayment: decoratorForm.advancePayment ? decoratorForm.advancePayment.trim() : '',
      termsAndConditions: decoratorForm.termsAndConditions ? decoratorForm.termsAndConditions.trim() : '',
    };

    const response = editing ? await updateDecorator(id, payload) : await createDecorator(payload);
    if (editing) {
      setMessage(response.message);
    } else {
      navigate('/vendor/services', { state: { notice: response.message } });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    setFieldErrors({});
    try {
      if (serviceType === 'venue') {
        await handleVenueSubmit();
      } else if (serviceType === 'catering') {
        await handleCateringSubmit();
      } else if (serviceType === 'decorator') {
        await handleDecoratorSubmit();
      }
    } catch (apiError) {
      setError(getError(apiError));
      setFieldErrors(apiError.response?.data?.errors || {});
    } finally {
      setSaving(false);
    }
  };

  // Toggle active status
  const toggleItemActive = async (item, type) => {
    try {
      if (type === 'venue') await setVenueActive(item._id, !item.isActive);
      else if (type === 'catering') await setCateringActive(item._id, !item.isActive);
      else if (type === 'decorator') await setDecoratorActive(item._id, !item.isActive);
      await refreshAllLists();
    } catch (apiError) {
      setError(getError(apiError));
    }
  };

  // Delete item
  const removeItem = async (item, type) => {
    if (!window.confirm(`Delete "${item.venueName || item.companyName || item.businessName}"?`)) return;
    try {
      if (type === 'venue') await deleteVenue(item._id);
      else if (type === 'catering') await deleteCatering(item._id);
      else if (type === 'decorator') await deleteDecorator(item._id);
      await refreshAllLists();
    } catch (apiError) {
      setError(getError(apiError));
    }
  };

  // Render List View if not add/edit form
  if (!showForm) {
    return (
      <main className="venue-management-page">
        <header className="venue-management-heading">
          <div>
            <p className="eyebrow">Vendor workspace</p>
            <h1>My Services</h1>
            <p>Manage your venues, catering options, and wedding decorator services.</p>
          </div>
          <Link className="primary-button" to="/vendor/services/add">
            + Add Service
          </Link>
        </header>

        {location.state?.notice && <div className="venue-alert success" role="status">{location.state.notice}</div>}
        {error && <div className="venue-alert error" role="alert">{error}</div>}

        <div className="admin-filter-tabs" style={{ marginBottom: '25px' }}>
          <button type="button" className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>All Services ({venues.length + caterings.length + decorators.length})</button>
          <button type="button" className={activeTab === 'venue' ? 'active' : ''} onClick={() => setActiveTab('venue')}>Venues ({venues.length})</button>
          <button type="button" className={activeTab === 'catering' ? 'active' : ''} onClick={() => setActiveTab('catering')}>Catering ({caterings.length})</button>
          <button type="button" className={activeTab === 'decorator' ? 'active' : ''} onClick={() => setActiveTab('decorator')}>Wedding Decorators ({decorators.length})</button>
        </div>

        {loading ? (
          <div className="venue-state">Loading your services…</div>
        ) : (
          <div className="vendor-venue-grid">
            {/* VENUES */}
            {(activeTab === 'all' || activeTab === 'venue') &&
              venues.map((venue) => (
                <article className="vendor-venue-card" key={venue._id}>
                  <VenueImage className="vendor-venue-cover" src={venue.coverImage} alt={venue.venueName} />
                  <div className="vendor-venue-card-content">
                    <div className="venue-title-status">
                      <div>
                        <span className="eyebrow" style={{ color: '#d97706', fontWeight: 600 }}>VENUE</span>
                        <h2>{venue.venueName}</h2>
                        <p>{venue.city}, {venue.state}</p>
                      </div>
                      <span className={`moderation-badge ${venue.approvalStatus}`}>{venue.approvalStatus}</span>
                    </div>
                    <p className="vendor-venue-price">{formatPrice(venue.startingPrice)} <span>{venue.priceType}</span></p>
                    <div className="vendor-venue-actions">
                      <Link to={`/vendor/services/edit/venue/${venue._id}`}>Edit</Link>
                      <button type="button" onClick={() => toggleItemActive(venue, 'venue')}>{venue.isActive ? 'Deactivate' : 'Activate'}</button>
                      <button type="button" className="danger-link" onClick={() => removeItem(venue, 'venue')}>Delete</button>
                    </div>
                  </div>
                </article>
              ))}

            {/* CATERING */}
            {(activeTab === 'all' || activeTab === 'catering') &&
              caterings.map((cater) => (
                <article className="vendor-venue-card" key={cater._id}>
                  <div className="vendor-venue-card-content" style={{ paddingTop: '20px' }}>
                    <div className="venue-title-status">
                      <div>
                        <span className="eyebrow" style={{ color: '#059669', fontWeight: 600 }}>CATERING</span>
                        <h2>{cater.companyName}</h2>
                        <p>{cater.dietaryType} Catering</p>
                      </div>
                      <span className={`moderation-badge ${cater.approvalStatus}`}>{cater.approvalStatus}</span>
                    </div>
                    <p className="vendor-venue-price">{formatPrice(cater.pricePerPlate)} <span>Per Plate</span></p>
                    <div className="vendor-venue-actions">
                      <Link to={`/vendor/services/edit/catering/${cater._id}`}>Edit</Link>
                      <button type="button" onClick={() => toggleItemActive(cater, 'catering')}>{cater.isActive ? 'Deactivate' : 'Activate'}</button>
                      <button type="button" className="danger-link" onClick={() => removeItem(cater, 'catering')}>Delete</button>
                    </div>
                  </div>
                </article>
              ))}

            {/* DECORATORS */}
            {(activeTab === 'all' || activeTab === 'decorator') &&
              decorators.map((dec) => (
                <article className="vendor-venue-card" key={dec._id}>
                  {dec.coverImage ? (
                    <VenueImage className="vendor-venue-cover" src={dec.coverImage} alt={dec.businessName} />
                  ) : null}
                  <div className="vendor-venue-card-content" style={{ paddingTop: dec.coverImage ? '12px' : '20px' }}>
                    <div className="venue-title-status">
                      <div>
                        <span className="eyebrow" style={{ color: '#7c3aed', fontWeight: 600 }}>WEDDING DECORATOR</span>
                        <h2>{dec.businessName}</h2>
                        <p>{dec.city}{dec.area ? `, ${dec.area}` : ''}</p>
                      </div>
                      <span className={`moderation-badge ${dec.approvalStatus}`}>{dec.approvalStatus}</span>
                    </div>
                    <p className="vendor-venue-price">{formatPrice(dec.startingPrice)} <span>{dec.pricingType}</span></p>

                    {dec.approvalStatus === 'rejected' && dec.rejectionReason && (
                      <div className="venue-alert error" style={{ margin: '10px 0', fontSize: '0.85rem' }}>
                        <strong>Rejection Reason:</strong> {dec.rejectionReason}
                      </div>
                    )}

                    <div className="vendor-venue-actions">
                      <Link to={`/vendor/services/edit/decorator/${dec._id}`}>Edit</Link>
                      <button type="button" onClick={() => toggleItemActive(dec, 'decorator')}>{dec.isActive ? 'Deactivate' : 'Activate'}</button>
                      <button type="button" className="danger-link" onClick={() => removeItem(dec, 'decorator')}>Delete</button>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        )}
      </main>
    );
  }

  // Common Add / Edit Service Form
  return (
    <main className="venue-management-page venue-form-page">
      <Link className="back-link" to="/vendor/services">← Back to My Services</Link>
      
      <header className="venue-management-heading">
        <div>
          <p className="eyebrow">Service workspace</p>
          <h1>{editing ? 'Edit Service' : 'Add Service'}</h1>
          <p>Select your service type below. The form will adjust automatically.</p>
        </div>
      </header>

      {error && <div className="venue-alert error" role="alert">{error}</div>}
      {message && <div className="venue-alert success" role="status">{message}</div>}

      <form className="venue-edit-form" onSubmit={handleSubmit}>
        {/* ONE COMMON SERVICE TYPE DROPDOWN AT THE TOP */}
        <section className="venue-form-section" style={{ borderLeft: '4px solid #4f46e5', background: '#f8fafc' }}>
          <div className="venue-form-grid">
            <label className="form-full" style={{ fontSize: '1.1rem' }}>
              <strong>Service Type</strong>
              <select
                className="service-type-dropdown"
                value={serviceType}
                onChange={(e) => handleServiceTypeChange(e.target.value)}
                disabled={editing} // lock service type during edit of an existing ID
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginTop: '6px',
                  borderRadius: '6px',
                  border: '2px solid #cbd5e1',
                  background: '#ffffff',
                }}
              >
                <option value="venue">Venue</option>
                <option value="catering">Catering</option>
                <option value="decorator">Wedding Decorator</option>
              </select>
              {editing && <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>Editing existing {serviceType} service</small>}
            </label>
          </div>
        </section>

        {/* CONDITIONAL RENDERING OF SERVICE FIELDS */}
        {serviceType === 'venue' && (
          <VenueFields
            form={venueForm}
            setForm={setVenueForm}
            fieldErrors={fieldErrors}
            selectCover={selectCover}
            selectGallery={selectGallery}
            coverPreview={coverPreview}
            galleryPreviews={galleryPreviews}
          />
        )}

        {serviceType === 'catering' && (
          <CateringFields
            form={cateringForm}
            setForm={setCateringForm}
            fieldErrors={fieldErrors}
            selectCover={selectCover}
            selectGallery={selectGallery}
            coverPreview={coverPreview}
            galleryPreviews={galleryPreviews}
          />
        )}

        {serviceType === 'decorator' && (
          <DecoratorFields
            form={decoratorForm}
            setForm={setDecoratorForm}
            fieldErrors={fieldErrors}
            selectCover={selectCover}
            selectGallery={selectGallery}
            coverPreview={coverPreview}
            galleryPreviews={galleryPreviews}
          />
        )}

        <div className="venue-form-submit-row" style={{ marginTop: '30px' }}>
          <p>New or edited listings will be submitted for admin review.</p>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Saving service…' : editing ? 'Save Service' : 'Save Service'}
          </button>
        </div>
      </form>
    </main>
  );
}
