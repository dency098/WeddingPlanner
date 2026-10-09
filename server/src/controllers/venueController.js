const mongoose = require('mongoose');
const Venue = require('../models/Venue');
const VenueBooking = require('../models/VenueBooking');

const venueTypes = [
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
const facilityOptions = [
  'AC',
  'Parking',
  'Rooms',
  'Catering',
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

const respondError = (res, status, message) =>
  res.status(status).json({ success: false, message });

const isObjectId = (value) => mongoose.isValidObjectId(value);

const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10) === value ? date : null;
};

const normalizeDate = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const validateVenueInput = (body, partial = false) => {
  const errors = {};
  const requiredText = ['venueName', 'description', 'city', 'state', 'address', 'coverImage'];
  for (const key of requiredText) {
    if (!partial || Object.hasOwn(body, key)) {
      if (typeof body[key] !== 'string' || !body[key].trim()) errors[key] = `${key} is required.`;
    }
  }

  if ((!partial || Object.hasOwn(body, 'venueType')) && !venueTypes.includes(body.venueType)) {
    errors.venueType = 'Select a valid venue type.';
  }
  if ((!partial || Object.hasOwn(body, 'priceType')) && !['Per Day', 'Per Function', 'Per Plate', 'Package'].includes(body.priceType)) {
    errors.priceType = 'Select a valid price type.';
  }

  const numericFields = ['minimumGuests', 'maximumGuests', 'seatingCapacity', 'parkingCapacity', 'startingPrice', 'advancePayment', 'eventDuration'];
  for (const field of numericFields) {
    if (!Object.hasOwn(body, field)) {
      if (!partial && ['minimumGuests', 'maximumGuests', 'seatingCapacity', 'startingPrice'].includes(field)) {
        errors[field] = `${field} is required.`;
      }
      continue;
    }
    const value = body[field];
    const number = typeof value === 'number' || (typeof value === 'string' && value.trim() !== '') ? Number(value) : Number.NaN;
    if (!Number.isFinite(number) || number < (field === 'startingPrice' || field === 'parkingCapacity' || field === 'advancePayment' ? 0 : 1)) {
      errors[field] = `${field} must be a valid non-negative number.`;
    } else if (['minimumGuests', 'maximumGuests', 'seatingCapacity', 'parkingCapacity'].includes(field) && !Number.isInteger(number)) {
      errors[field] = `${field} must be a whole number.`;
    }
  }

  const minimumGuests = Number(body.minimumGuests);
  const maximumGuests = Number(body.maximumGuests);
  if (
    (!partial || Object.hasOwn(body, 'minimumGuests') || Object.hasOwn(body, 'maximumGuests')) &&
    Number.isFinite(minimumGuests) && Number.isFinite(maximumGuests) && maximumGuests < minimumGuests
  ) {
    errors.maximumGuests = 'Maximum guests must be greater than or equal to minimum guests.';
  }
  if (
    (!partial || Object.hasOwn(body, 'minimumGuests') || Object.hasOwn(body, 'seatingCapacity')) &&
    Number.isFinite(minimumGuests) && Number.isFinite(Number(body.seatingCapacity)) &&
    Number(body.seatingCapacity) < minimumGuests
  ) {
    errors.seatingCapacity = 'Seating capacity must be at least the minimum guest count.';
  }
  if (Object.hasOwn(body, 'facilities') && (!Array.isArray(body.facilities) || body.facilities.some((item) => !facilityOptions.includes(item)))) {
    errors.facilities = 'One or more facilities are invalid.';
  }

  for (const field of ['coverImage', 'venueVideo']) {
    if (Object.hasOwn(body, field) && typeof body[field] !== 'string') errors[field] = `${field} must be a URL string.`;
    else if (body[field] && !isHttpUrl(body[field])) errors[field] = `${field} must be a valid HTTPS or HTTP URL.`;
  }
  if (Object.hasOwn(body, 'gallery') && (!Array.isArray(body.gallery) || body.gallery.length > 12 || body.gallery.some((url) => !isHttpUrl(url)))) {
    errors.gallery = 'Gallery must contain no more than 12 valid image URLs.';
  }
  if (Object.hasOwn(body, 'additionalCharges') && (!Array.isArray(body.additionalCharges) || body.additionalCharges.length > 20 || body.additionalCharges.some((charge) =>
    !charge || typeof charge.name !== 'string' || !charge.name.trim() ||
    !['number', 'string'].includes(typeof charge.amount) ||
    (typeof charge.amount === 'string' && charge.amount.trim() === '') ||
    !Number.isFinite(Number(charge.amount)) || Number(charge.amount) < 0
  ))) {
    errors.additionalCharges = 'Provide up to 20 additional charges, each with a name and a non-negative amount.';
  }
  for (const field of ['location', 'cancellationPolicy', 'termsAndConditions']) {
    if (Object.hasOwn(body, field) && typeof body[field] !== 'string') errors[field] = `${field} must be text.`;
  }

  return errors;
};

function isHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  const str = value.trim();
  if (str.startsWith('/') || str.startsWith('data:') || str.startsWith('blob:') || str.startsWith('./')) return true;
  try {
    return ['http:', 'https:'].includes(new URL(str).protocol);
  } catch {
    return false;
  }
}

const editableFields = [
  'venueName', 'venueType', 'description', 'location', 'city', 'state', 'address',
  'area', 'landmark', 'contactPhone', 'contactEmail', 'numberOfRooms', 'advancePaymentPercentage', 'eventTypes',
  'minimumGuests', 'maximumGuests', 'floatingCapacity', 'seatingCapacity', 'parkingCapacity', 'spaces',
  'startingPrice', 'priceType', 'additionalCharges', 'facilities', 'coverImage', 'gallery', 'venueVideo',
  'cancellationPolicy', 'advancePayment', 'eventDuration', 'termsAndConditions', 'blockedDates',
  'baseRentalFee', 'decorationPolicy', 'cateringPolicy', 'alcoholPolicy', 'amenities'
];

const pickFields = (body, fields) => Object.fromEntries(fields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]]));
const publicVenueFilter = { approvalStatus: 'approved', isActive: true };

const listPublicVenues = async (req, res, next) => {
  try {
    const filter = { ...publicVenueFilter };
    const { city, venueType, guests, minGuests, maxGuests, minPrice, maxPrice, facilities, date } = req.query;
    if (city !== undefined) {
      if (typeof city !== 'string' || !city.trim() || city.length > 100) return respondError(res, 400, 'City must be a single non-empty value of 100 characters or fewer.');
      filter.city = new RegExp(`^${escapeRegex(city.trim())}$`, 'i');
    }
    if (venueType) {
      if (!venueTypes.includes(venueType)) return respondError(res, 400, 'Invalid venue type filter.');
      filter.venueType = venueType;
    }
    const capacityConditions = [];
    if (guests !== undefined) {
      const guestCount = Number(guests);
      if (!Number.isInteger(guestCount) || guestCount < 1) return respondError(res, 400, 'Guest count must be a positive whole number.');
      capacityConditions.push({
        minimumGuests: { $lte: guestCount },
        maximumGuests: { $gte: guestCount },
        seatingCapacity: { $gte: guestCount },
      });
    }
    if (minGuests !== undefined) {
      const value = Number(minGuests);
      if (!Number.isInteger(value) || value < 1) return respondError(res, 400, 'Minimum guest count must be a positive whole number.');
      capacityConditions.push({ maximumGuests: { $gte: value }, seatingCapacity: { $gte: value } });
    }
    if (maxGuests !== undefined) {
      const value = Number(maxGuests);
      if (!Number.isInteger(value) || value < 1) return respondError(res, 400, 'Maximum guest count must be a positive whole number.');
      capacityConditions.push({ minimumGuests: { $lte: value } });
    }
    if (minGuests !== undefined && maxGuests !== undefined && Number(minGuests) > Number(maxGuests)) {
      return respondError(res, 400, 'Minimum guest count cannot exceed maximum guest count.');
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter = {};
      if (minPrice !== undefined) {
        const value = Number(minPrice);
        if (!Number.isFinite(value) || value < 0) return respondError(res, 400, 'Minimum price must be non-negative.');
        priceFilter.$gte = value;
      }
      if (maxPrice !== undefined) {
        const value = Number(maxPrice);
        if (!Number.isFinite(value) || value < 0) return respondError(res, 400, 'Maximum price must be non-negative.');
        priceFilter.$lte = value;
      }
      filter.startingPrice = priceFilter;
    }
    if (minPrice !== undefined && maxPrice !== undefined && Number(minPrice) > Number(maxPrice)) {
      return respondError(res, 400, 'Minimum price cannot exceed maximum price.');
    }
    if (capacityConditions.length) filter.$and = capacityConditions;
    if (facilities) {
      const selectedFacilities = Array.isArray(facilities) ? facilities : String(facilities).split(',');
      if (selectedFacilities.some((item) => !facilityOptions.includes(item))) return respondError(res, 400, 'Invalid facilities filter.');
      filter.facilities = { $all: selectedFacilities };
    }

    let venues = await Venue.find(filter).populate('vendor', 'name businessName').sort({ createdAt: -1 }).limit(100).lean();
    if (date) {
      const eventDate = validDate(date);
      if (!eventDate) return respondError(res, 400, 'Date must use YYYY-MM-DD format.');
      const bookings = await VenueBooking.find({ venue: { $in: venues.map((venue) => venue._id) }, eventDate, status: { $in: ['accepted', 'confirmed'] } }).select('venue').lean();
      const bookedIds = new Set(bookings.map((booking) => booking.venue.toString()));
      venues = venues.filter((venue) => !venue.blockedDates.some((blockedDate) => normalizeDate(new Date(blockedDate)).getTime() === eventDate.getTime()) && !bookedIds.has(venue._id.toString()));
    }
    return res.json({ success: true, data: venues });
  } catch (error) {
    return next(error);
  }
};

const listVendorVenues = async (req, res, next) => {
  try {
    const venues = await Venue.find({ vendor: req.user.id }).sort({ updatedAt: -1 }).lean();
    return res.json({ success: true, data: venues });
  } catch (error) {
    return next(error);
  }
};

const listAdminVenues = async (req, res, next) => {
  try {
    const { approvalStatus } = req.query;
    const filter = {};
    if (approvalStatus) {
      if (!['pending', 'approved', 'rejected', 'disabled'].includes(approvalStatus)) return respondError(res, 400, 'Invalid approval status.');
      filter.approvalStatus = approvalStatus;
    }
    const [venues, total, pending, approved, rejected, disabled] = await Promise.all([
      Venue.find(filter).populate('vendor', 'name businessName email').sort({ createdAt: -1 }).lean(),
      Venue.countDocuments(),
      Venue.countDocuments({ approvalStatus: 'pending' }),
      Venue.countDocuments({ approvalStatus: 'approved' }),
      Venue.countDocuments({ approvalStatus: 'rejected' }),
      Venue.countDocuments({ approvalStatus: 'disabled' }),
    ]);
    return res.json({ success: true, data: venues, stats: { total, pending, approved, rejected, disabled } });
  } catch (error) {
    return next(error);
  }
};

const getVendorVenue = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid venue ID.');
    const venue = await Venue.findOne({ _id: req.params.id, vendor: req.user.id });
    if (!venue) return respondError(res, 404, 'Venue not found.');
    return res.json({ success: true, data: venue });
  } catch (error) {
    return next(error);
  }
};

const getPublicVenue = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid venue ID.');
    const venue = await Venue.findOne({ _id: req.params.id, ...publicVenueFilter })
      .populate('vendor', 'name businessName businessDescription businessLocation yearsOfExperience profileImage publicContact')
      .lean();
    if (!venue) return respondError(res, 404, 'Venue not found.');
    return res.json({ success: true, data: venue });
  } catch (error) {
    return next(error);
  }
};

const createVenue = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return respondError(res, 400, 'Venue details must be a JSON object.');
    const errors = validateVenueInput(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ success: false, message: 'Please correct the venue details.', errors });
    const data = pickFields(req.body, editableFields);
    data.blockedDates = normalizeBlockedDates(data.blockedDates || []);
    if (!data.blockedDates) return respondError(res, 400, 'Blocked dates must be valid ISO date values.');
    const venue = await Venue.create({ ...data, vendor: req.user.id, approvalStatus: 'pending' });
    return res.status(201).json({ success: true, message: 'Venue submitted for review.', data: venue });
  } catch (error) {
    return next(error);
  }
};

const updateVenue = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid venue ID.');
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return respondError(res, 400, 'Venue changes must be a JSON object.');
    const data = pickFields(req.body, editableFields);
    if (!Object.keys(data).length) return respondError(res, 400, 'No venue changes were provided.');
    const errors = validateVenueInput(data, true);
    if (Object.keys(errors).length) return res.status(400).json({ success: false, message: 'Please correct the venue details.', errors });
    if (Object.hasOwn(data, 'blockedDates')) {
      data.blockedDates = normalizeBlockedDates(data.blockedDates);
      if (!data.blockedDates) return respondError(res, 400, 'Blocked dates must be valid ISO date values.');
    }
    const venue = await Venue.findOne({ _id: req.params.id, vendor: req.user.id });
    if (!venue) return respondError(res, 404, 'Venue not found.');
    Object.assign(venue, data, { approvalStatus: 'pending' });
    await venue.save();
    return res.json({ success: true, message: 'Venue updated and submitted for review.', data: venue });
  } catch (error) {
    return next(error);
  }
};

const deleteVenue = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid venue ID.');
    const venue = await Venue.findOne({ _id: req.params.id, vendor: req.user.id });
    if (!venue) return respondError(res, 404, 'Venue not found.');
    if (await VenueBooking.exists({ venue: venue._id })) return respondError(res, 409, 'This venue has booking records and cannot be deleted. Deactivate it instead.');
    await venue.deleteOne();
    return res.json({ success: true, message: 'Venue deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};

const updateVendorStatus = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid venue ID.');
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return respondError(res, 400, 'Status update must be a JSON object.');
    if (typeof req.body.isActive !== 'boolean') return respondError(res, 400, 'isActive must be a boolean.');
    const venue = await Venue.findOne({ _id: req.params.id, vendor: req.user.id });
    if (!venue) return respondError(res, 404, 'Venue not found.');
    if (venue.approvalStatus !== 'approved' && req.body.isActive) return respondError(res, 409, 'Only approved venues can be activated.');
    venue.isActive = req.body.isActive;
    await venue.save();
    return res.json({ success: true, message: 'Venue availability status updated.', data: venue });
  } catch (error) {
    return next(error);
  }
};

const updateAvailability = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid venue ID.');
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return respondError(res, 400, 'Availability update must be a JSON object.');
    if (!Array.isArray(req.body.blockedDates) || req.body.blockedDates.length > 365) return respondError(res, 400, 'Provide up to 365 blocked dates.');
    const blockedDates = normalizeBlockedDates(req.body.blockedDates);
    if (!blockedDates) return respondError(res, 400, 'Blocked dates must be valid ISO date values.');

    let blockedDateDetails = [];
    if (Array.isArray(req.body.blockedDateDetails)) {
      blockedDateDetails = req.body.blockedDateDetails
        .map((item) => {
          const dStr = typeof item.date === 'string' ? item.date.slice(0, 10) : '';
          const pDate = validDate(dStr);
          return pDate ? { date: pDate, reason: item.reason || 'Manually blocked' } : null;
        })
        .filter(Boolean);
    } else {
      blockedDateDetails = blockedDates.map((date) => ({ date, reason: 'Manually blocked' }));
    }

    const venue = await Venue.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user.id },
      { $set: { blockedDates, blockedDateDetails } },
      { returnDocument: 'after', runValidators: true }
    );
    if (!venue) return respondError(res, 404, 'Venue not found.');
    return res.json({ success: true, message: 'Blocked dates updated.', data: venue });
  } catch (error) {
    return next(error);
  }
};

const moderateVenue = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid venue ID.');
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return respondError(res, 400, 'Moderation action must be a JSON object.');
    const { approvalStatus, rejectionReason } = req.body;
    if (!['approved', 'rejected', 'disabled'].includes(approvalStatus)) return respondError(res, 400, 'Choose approved, rejected, or disabled.');
    const update = {
      approvalStatus,
      isActive: approvalStatus === 'approved',
      rejectionReason: approvalStatus === 'rejected' ? (rejectionReason || '') : '',
    };
    const venue = await Venue.findByIdAndUpdate(req.params.id, { $set: update }, { returnDocument: 'after', runValidators: true })
      .populate('vendor', 'name businessName email');
    if (!venue) return respondError(res, 404, 'Venue not found.');
    return res.json({ success: true, message: `Venue ${approvalStatus}.`, data: venue });
  } catch (error) {
    return next(error);
  }
};

const checkAvailability = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid venue ID.');

    let requestedEvents;
    if (req.query.events) {
      try {
        requestedEvents = typeof req.query.events === 'string' ? JSON.parse(req.query.events) : req.query.events;
      } catch {
        return respondError(res, 400, 'Event availability details must be valid JSON.');
      }
      if (!Array.isArray(requestedEvents) || requestedEvents.length < 1 || requestedEvents.length > 50) {
        return respondError(res, 400, 'Provide between 1 and 50 event dates to check.');
      }
    } else {
      const rawDates = req.query.dates || req.query.date;
      if (!rawDates) return respondError(res, 400, 'Select a valid event date in YYYY-MM-DD format.');
      const dateList = Array.isArray(rawDates)
        ? rawDates
        : String(rawDates).split(',').map((date) => date.trim()).filter(Boolean);
      const guests = Number(req.query.guests);
      if (!Number.isInteger(guests) || guests < 1) return respondError(res, 400, 'Guest count must be a positive whole number.');
      requestedEvents = dateList.map((date, index) => ({ index, eventDate: date, guestCount: guests }));
    }

    const events = requestedEvents.map((event, index) => {
      const eventDate = validDate(event?.eventDate);
      const guestCount = Number(event?.guestCount);
      if (!eventDate) return null;
      if (!Number.isInteger(guestCount) || guestCount < 1) return null;
      return {
        index: Number.isInteger(Number(event.index)) ? Number(event.index) : index,
        eventType: typeof event.eventType === 'string' ? event.eventType : '',
        eventDate,
        guestCount,
      };
    });
    if (events.some((event) => !event)) {
      return respondError(res, 400, 'Every event needs a valid date and positive whole-number guest count.');
    }

    const today = normalizeDate(new Date());
    if (events.some((event) => event.eventDate < today)) {
      return respondError(res, 400, 'Event date cannot be in the past.');
    }

    const venue = await Venue.findById(req.params.id)
      .select('approvalStatus isActive minimumGuests maximumGuests seatingCapacity blockedDates blockedDateDetails')
      .lean();
    const venueUnavailableReason = !venue
      ? 'Venue not found.'
      : venue.approvalStatus !== 'approved' || !venue.isActive
        ? 'This venue is not currently accepting requests.'
        : '';
    const eventAvailability = [];

    for (const event of events) {
      let reason = venueUnavailableReason;
      const date = event.eventDate.toISOString().slice(0, 10);
      if (!reason && (
        event.guestCount < venue.minimumGuests ||
        event.guestCount > venue.maximumGuests ||
        event.guestCount > venue.seatingCapacity
      )) {
        reason = `Guest count must be between ${venue.minimumGuests} and ${Math.min(venue.maximumGuests, venue.seatingCapacity)}.`;
      }
      if (!reason) {
        const isBlocked = (venue.blockedDates || []).some(
          (blockedDate) => normalizeDate(new Date(blockedDate)).getTime() === event.eventDate.getTime()
        );
        if (isBlocked) {
          const detail = (venue.blockedDateDetails || []).find(
            (item) => normalizeDate(new Date(item.date)).getTime() === event.eventDate.getTime()
          );
          reason = detail?.reason ? `Date blocked: ${detail.reason}` : 'The venue is not available on this date.';
        }
      }
      if (!reason) {
        const accepted = await VenueBooking.exists({
          venue: venue._id,
          $or: [
            {
              eventDate: {
                $gte: event.eventDate,
                $lt: new Date(event.eventDate.getTime() + 86400000),
              },
            },
            {
              'eventSchedule.eventDate': {
                $gte: event.eventDate,
                $lt: new Date(event.eventDate.getTime() + 86400000),
              },
            },
          ],
          status: { $in: ['accepted', 'confirmed'] },
        });
        if (accepted) reason = 'An accepted booking already exists for this date.';
      }
      eventAvailability.push({
        index: event.index,
        eventType: event.eventType,
        date,
        guestCount: event.guestCount,
        available: !reason,
        status: reason ? 'unavailable' : 'available',
        reason,
      });
    }

    const unavailableDates = eventAvailability
      .filter((event) => !event.available)
      .map(({ date, reason }) => ({ date, reason }));
    const firstUnavailable = unavailableDates[0];
    return res.json({
      success: true,
      data: {
        available: unavailableDates.length === 0,
        reason: firstUnavailable
          ? `${firstUnavailable.date} is unavailable. ${firstUnavailable.reason}`
          : 'The venue is available for your selected date(s).',
        unavailableDates,
        eventAvailability,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const normalizeBlockedDates = (dates) => {
  if (!Array.isArray(dates) || dates.length > 365) return null;
  const normalized = [];
  for (const value of dates) {
    const dateString = typeof value === 'string' ? value.slice(0, 10) : '';
    const parsed = validDate(dateString);
    if (!parsed) return null;
    normalized.push(parsed);
  }
  return [...new Map(normalized.map((date) => [date.toISOString(), date])).values()];
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
  listPublicVenues,
  listVendorVenues,
  listAdminVenues,
  getVendorVenue,
  getPublicVenue,
  createVenue,
  updateVenue,
  deleteVenue,
  updateVendorStatus,
  updateAvailability,
  moderateVenue,
  checkAvailability,
};
