const mongoose = require('mongoose');
const Venue = require('../models/Venue');
const VenueEnquiry = require('../models/VenueEnquiry');
const VenueBooking = require('../models/VenueBooking');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { calculateQuotation } = require('../utils/quotationCalculator');

const respondError = (res, status, message) => res.status(status).json({ success: false, message });
const isObjectId = (value) => mongoose.isValidObjectId(value);
const normalizeDateOnly = (dateValue) => {
  const date = dateValue instanceof Date ? new Date(dateValue) : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};
const toIsoDate = (dateValue) => {
  const normalized = normalizeDateOnly(dateValue);
  return normalized ? normalized.toISOString().slice(0, 10) : '';
};
const parseTimeMinutes = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d{1,2}:\d{2}$/.test(trimmed)) return null;
  const [hours, minutes] = trimmed.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};
const parseDateOnly = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : parsed;
};
const isValidMoney = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
};
const isValidTime = (value) => parseTimeMinutes(value) !== null;
const isFutureVisit = (date, time) => {
  if (!date || !isValidTime(time)) return false;
  const visit = new Date(`${date}T${time}:00`);
  return visit > new Date();
};

const createEnquiry = async (req, res, next) => {
  try {
    const {
      venueId,
      venue: venueBody,
      eventType,
      eventDate,
      eventSchedule,
      city,
      guestCount,
      venueName,
      preferredVenueType,
      budget,
      cateringRequired,
      decorationRequired,
      djRequired,
      numberOfRooms,
      message,
      userName,
      userEmail,
      userPhone,
    } = req.body;

    const targetVenueId = venueId || venueBody;
    if (!targetVenueId || !isObjectId(targetVenueId)) return respondError(res, 400, 'Valid venue is required.');

    const venueObj = await Venue.findOne({ _id: targetVenueId });
    if (!venueObj) return respondError(res, 404, 'Venue not found or not currently available.');
    if (venueObj.approvalStatus !== 'approved' || !venueObj.isActive) {
      return respondError(res, 409, 'This venue is not currently accepting enquiries.');
    }

    let processedSchedule = [];
    if (Array.isArray(eventSchedule) && eventSchedule.length > 0) {
      processedSchedule = eventSchedule.map((item, index) => {
        const rawDate = item?.eventDate || eventDate;
        const parsedDate = rawDate ? new Date(rawDate) : null;
        const guestValue = Number(item?.guestCount ?? guestCount ?? 100);
        const startMinutes = parseTimeMinutes(item?.startTime || '');
        const endMinutes = parseTimeMinutes(item?.endTime || '');
        return {
          eventType: item?.eventType || eventType || 'Wedding',
          eventDate: parsedDate,
          startTime: item?.startTime || '',
          endTime: item?.endTime || '',
          guestCount: guestValue,
          city: item?.city || city || venueObj.city || '',
          venueName: item?.venueName || venueName || venueObj.venueName,
          requirements: item?.requirements || '',
          notes: item?.notes || '',
          _index: index,
          _startMinutes: startMinutes,
          _endMinutes: endMinutes,
        };
      });
    } else {
      if (!eventType || !eventDate || !city || !guestCount) {
        return respondError(res, 400, 'Event type, event date, city, and guest count are required.');
      }
      processedSchedule = [{
        eventType,
        eventDate: new Date(eventDate),
        startTime: '',
        endTime: '',
        guestCount: Number(guestCount),
        city,
        venueName: venueName || venueObj.venueName,
        requirements: '',
        notes: message || '',
        _index: 0,
        _startMinutes: null,
        _endMinutes: null,
      }];
    }

    if (processedSchedule.length === 0) {
      return respondError(res, 400, 'At least one event is required for a venue enquiry.');
    }

    const seenEvents = new Map();
    const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));

    for (const eventItem of processedSchedule) {
      if (!eventItem.eventType || !String(eventItem.eventType).trim()) {
        return respondError(res, 400, `Event type is required for every event.`);
      }
      if (!eventItem.eventDate || Number.isNaN(eventItem.eventDate.getTime())) {
        return respondError(res, 400, 'Please select a date for every event.');
      }
      const eventDateValue = normalizeDateOnly(eventItem.eventDate);
      if (!eventDateValue) {
        return respondError(res, 400, 'Please select a valid date for every event.');
      }
      if (eventDateValue < today) {
        return respondError(res, 400, `${toIsoDate(eventDateValue)} is in the past. Please select a future date.`);
      }
      if (!Number.isInteger(eventItem.guestCount) || eventItem.guestCount < 1) {
        return respondError(res, 400, `Guest count for ${eventItem.eventType} must be a positive integer.`);
      }
      const maxAllowedGuests = Math.min(venueObj.maximumGuests || Number.MAX_SAFE_INTEGER, venueObj.seatingCapacity || Number.MAX_SAFE_INTEGER);
      if (eventItem.guestCount > maxAllowedGuests) {
        return respondError(res, 400, `Guest count exceeds this venue's maximum capacity.`);
      }
      if (eventItem._startMinutes !== null && eventItem._endMinutes !== null && eventItem._startMinutes >= eventItem._endMinutes) {
        return respondError(res, 400, `End time must be after the start time for ${eventItem.eventType}.`);
      }

      const eventSignature = `${eventItem.eventType.trim()}|${toIsoDate(eventDateValue)}|${eventItem.startTime || ''}|${eventItem.endTime || ''}`;
      if (seenEvents.has(eventSignature)) {
        return respondError(res, 400, `Duplicate event entry detected for ${eventItem.eventType} on ${toIsoDate(eventDateValue)}. Please edit or remove the duplicate.`);
      }
      seenEvents.set(eventSignature, true);

      const isBlocked = (venueObj.blockedDates || []).some((blockedDate) => {
        const normalizedBlocked = normalizeDateOnly(blockedDate);
        return normalizedBlocked && normalizedBlocked.getTime() === eventDateValue.getTime();
      });
      if (isBlocked) {
        return respondError(res, 400, `${toIsoDate(eventDateValue)} is unavailable. Please select another date.`);
      }

      const hasAcceptedBooking = await VenueBooking.exists({
        venue: venueObj._id,
        eventDate: {
          $gte: new Date(Date.UTC(eventDateValue.getUTCFullYear(), eventDateValue.getUTCMonth(), eventDateValue.getUTCDate())),
          $lt: new Date(Date.UTC(eventDateValue.getUTCFullYear(), eventDateValue.getUTCMonth(), eventDateValue.getUTCDate() + 1)),
        },
        status: { $in: ['accepted', 'confirmed'] },
      });
      if (hasAcceptedBooking) {
        return respondError(res, 400, `${toIsoDate(eventDateValue)} is unavailable. Please select another date.`);
      }
    }

    const primaryEvent = processedSchedule[0];

    // Derive user details
    let derivedName = userName;
    let derivedEmail = userEmail;
    let derivedPhone = userPhone || '';

    if (req.user?.id) {
      const dbUser = (await User.findById(req.user.id).lean()) || (await Vendor.findById(req.user.id).lean());
      if (dbUser) {
        derivedName = dbUser.name || dbUser.businessName || derivedName;
        derivedEmail = dbUser.email || derivedEmail;
        derivedPhone = dbUser.phone || derivedPhone;
      }
    }

    if (!derivedName || !derivedEmail) {
      return respondError(res, 401, 'Please log in to send a venue enquiry.');
    }

    const enquiry = await VenueEnquiry.create({
      user: req.user.id,
      vendor: venueObj.vendor,
      venue: venueObj._id,
      eventType: primaryEvent.eventType,
      eventDate: primaryEvent.eventDate,
      eventSchedule: processedSchedule.map(({ _index, _startMinutes, _endMinutes, ...cleanItem }) => cleanItem),
      city: primaryEvent.city || city || venueObj.city,
      guestCount: primaryEvent.guestCount,
      venueName: venueName || venueObj.venueName,
      preferredVenueType: preferredVenueType || venueObj.venueType,
      budget: budget || '',
      cateringRequired: Boolean(cateringRequired),
      decorationRequired: Boolean(decorationRequired),
      djRequired: Boolean(djRequired),
      numberOfRooms: numberOfRooms ? Number(numberOfRooms) : 0,
      message: message || '',
      userName: derivedName,
      userEmail: derivedEmail,
      userPhone: derivedPhone,
      status: 'pending',
    });

    // Notify vendor
    await Notification.create({
      recipient: venueObj.vendor,
      recipientRole: 'vendor',
      message: `New venue enquiry received from ${derivedName} for ${venueObj.venueName} (${processedSchedule.length} function${processedSchedule.length > 1 ? 's' : ''}).`,
    });

    return res.status(201).json({
      success: true,
      message: 'Your venue requirement enquiry has been sent successfully.',
      data: enquiry,
    });
  } catch (error) {
    return next(error);
  }
};

const createTestEnquiry = async (req, res, next) => {
  try {
    const { venueId } = req.body;
    let venueObj;
    if (venueId && isObjectId(venueId)) {
      venueObj = await Venue.findOne({ _id: venueId, vendor: req.user.id });
    }
    if (!venueObj) {
      venueObj = await Venue.findOne({ vendor: req.user.id });
    }
    if (!venueObj) return respondError(res, 404, 'No venue listing found for your account. Please create a venue first.');

    const dbUser = (await User.findById(req.user.id).lean()) || (await Vendor.findById(req.user.id).lean());

    const date1 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const date2 = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const testSchedule = [
      {
        eventType: 'Sangeet & Mehendi',
        eventDate: date1,
        guestCount: 200,
        city: venueObj.city || 'Surat',
        venueName: venueObj.venueName,
        requirements: 'Evening Sangeet Stage & Catering',
        notes: 'Test Sangeet function',
      },
      {
        eventType: 'Wedding Ceremony',
        eventDate: date2,
        guestCount: 400,
        city: venueObj.city || 'Surat',
        venueName: venueObj.venueName,
        requirements: 'Morning Wedding Mandap & Lunch Buffet',
        notes: 'Test Main Wedding Ceremony',
      },
    ];

    const testEnquiry = await VenueEnquiry.create({
      user: req.user.id,
      vendor: venueObj.vendor,
      venue: venueObj._id,
      eventType: 'Multi-Day Wedding',
      eventDate: date1,
      eventSchedule: testSchedule,
      city: venueObj.city || 'Surat',
      guestCount: 400,
      venueName: venueObj.venueName,
      preferredVenueType: venueObj.venueType,
      budget: '₹2,50,000 – ₹5,00,000',
      cateringRequired: true,
      decorationRequired: true,
      djRequired: true,
      numberOfRooms: 10,
      message: 'This is a test multi-date wedding enquiry.',
      userName: dbUser?.name || dbUser?.businessName || 'Test Customer',
      userEmail: dbUser?.email || 'testcustomer@example.com',
      userPhone: dbUser?.phone || '9876543210',
      isTest: true,
      status: 'pending',
    });

    return res.status(201).json({ success: true, message: 'Test venue enquiry created.', data: testEnquiry });
  } catch (error) {
    return next(error);
  }
};

const mapVenueItem = (item) => {
  const isBooking = Boolean(item.isBookingRecord || item.estimatedPrice !== undefined && !item.eventSchedule);
  
  let schedule = Array.isArray(item.eventSchedule) ? item.eventSchedule : [];
  if (!schedule || schedule.length === 0) {
    schedule = [
      {
        eventType: item.eventType || 'Wedding',
        eventDate: item.eventDate,
        startTime: item.startTime || '',
        endTime: item.endTime || '',
        guestCount: item.guestCount || 0,
        city: item.city || item.venue?.city || '',
        venueName: item.venueName || item.venue?.venueName || '',
        requirements: item.requirements || '',
        notes: item.message || '',
      },
    ];
  } else {
    schedule = schedule.map((entry) => ({
      ...entry,
      startTime: entry.startTime || '',
      endTime: entry.endTime || '',
      requirements: entry.requirements || '',
      notes: entry.notes || '',
    }));
  }

  return {
    _id: item._id,
    isBookingRecord: isBooking,
    user: item.user,
    vendor: item.vendor,
    venue: item.venue,
    venueName: item.venueName || item.venue?.venueName || 'Venue Listing',
    city: item.city || item.venue?.city || '',
    eventType: item.eventType || 'Wedding',
    eventDate: item.eventDate,
    eventSchedule: schedule,
    guestCount: item.guestCount || 0,
    budget: item.budget || (item.estimatedPrice ? `₹${item.estimatedPrice}` : ''),
    numberOfRooms: item.numberOfRooms || 0,
    cateringRequired: Boolean(item.cateringRequired),
    decorationRequired: Boolean(item.decorationRequired),
    djRequired: Boolean(item.djRequired),
    message: item.message || '',
    userName: item.userName || item.user?.name || (item.user?.firstName ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() : 'Customer'),
    userEmail: item.userEmail || item.user?.email || '',
    userPhone: item.userPhone || item.user?.phone || item.user?.phoneNumber || '',
    status: item.status,
    quotation: item.quotation || (item.response?.estimatedPrice ? {
      baseVenuePrice: item.response.estimatedPrice,
      totalEstimatedAmount: item.response.estimatedPrice,
      advanceAmount: Math.round(item.response.estimatedPrice * 0.3),
      remainingAmount: Math.round(item.response.estimatedPrice * 0.7),
      advancePercentage: 30,
      vendorNotes: item.response.vendorMessage || '',
      quotationStatus: item.status === 'responded' || item.status === 'quotation_sent' ? 'sent' : item.status,
      sentAt: item.response.respondedAt || item.updatedAt,
    } : undefined),
    response: item.response,
    visit: item.visit,
    isTest: Boolean(item.isTest),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

const getVendorEnquiries = async (req, res, next) => {
  try {
    const vendorVenues = await Venue.find({ vendor: req.user.id }).select('_id').lean();
    const venueIds = vendorVenues.map((v) => v._id);

    const [enquiries, legacyBookings] = await Promise.all([
      VenueEnquiry.find({
        $or: [{ vendor: req.user.id }, { venue: { $in: venueIds } }],
      })
        .populate('venue', 'venueName city startingPrice coverImage')
        .populate('user', 'name email phone firstName lastName phoneNumber')
        .sort({ createdAt: -1 })
        .lean(),

      VenueBooking.find({
        $or: [{ vendor: req.user.id }, { venue: { $in: venueIds } }],
      })
        .populate('venue', 'venueName city startingPrice coverImage')
        .populate('user', 'name email phone firstName lastName phoneNumber')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const mappedEnquiries = enquiries.map(mapVenueItem);
    const mappedBookings = legacyBookings.map((b) => mapVenueItem({ ...b, isBookingRecord: true }));

    const mergedMap = new Map();
    [...mappedEnquiries, ...mappedBookings].forEach((item) => {
      mergedMap.set(item._id.toString(), item);
    });

    const combinedList = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.json({ success: true, data: combinedList });
  } catch (error) {
    return next(error);
  }
};

const getUserEnquiries = async (req, res, next) => {
  try {
    const [enquiries, legacyBookings] = await Promise.all([
      VenueEnquiry.find({ user: req.user.id })
        .populate('venue', 'venueName city startingPrice coverImage')
        .populate('vendor', 'businessName name email phone')
        .sort({ createdAt: -1 })
        .lean(),

      VenueBooking.find({ user: req.user.id })
        .populate('venue', 'venueName city startingPrice coverImage')
        .populate('vendor', 'businessName name email phone')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const mappedEnquiries = enquiries.map(mapVenueItem);
    const mappedBookings = legacyBookings.map((b) => mapVenueItem({ ...b, isBookingRecord: true }));

    const mergedMap = new Map();
    [...mappedEnquiries, ...mappedBookings].forEach((item) => {
      mergedMap.set(item._id.toString(), item);
    });

    const combinedList = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.json({ success: true, data: combinedList });
  } catch (error) {
    return next(error);
  }
};

const createOrUpdateQuotation = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid enquiry ID.');
    const body = req.body || {};
    const {
      baseVenuePrice,
      eventsBreakdown,
      additionalServiceCharges = 0,
      cateringCharges = 0,
      decorationCharges = 0,
      tax = 0,
      discount = 0,
      advancePercentage = 30,
      validUntil,
      paymentTerms,
      vendorNotes,
      termsAndConditions,
      revise = false,
    } = body;
    const enquiry = await VenueEnquiry.findOne({ _id: req.params.id, vendor: req.user.id })
      .populate('venue', 'venueName');

    if (enquiry) {
      if (!enquiry.response?.eventAvailabilities?.length) {
        return respondError(res, 409, 'Submit the event-by-event availability response before sending a quotation.');
      }
      if (enquiry.quotation && (revise !== true || enquiry.quotation.quotationStatus === 'accepted')) {
        return respondError(res, 409, enquiry.quotation.quotationStatus === 'accepted'
          ? 'An accepted quotation cannot be replaced.'
          : 'A quotation has already been sent. Use the explicit revise action to send an updated quotation.');
      }
      if (!isValidMoney(baseVenuePrice)) return respondError(res, 400, 'Base venue price must be a valid non-negative amount.');
      for (const [field, value] of Object.entries({
        additionalServiceCharges,
        cateringCharges,
        decorationCharges,
        tax,
        discount,
      })) {
        if (!isValidMoney(value)) return respondError(res, 400, `${field} must be a valid non-negative amount.`);
      }
      if (!Number.isFinite(Number(advancePercentage)) || Number(advancePercentage) < 0 || Number(advancePercentage) > 100) {
        return respondError(res, 400, 'Advance percentage must be between 0 and 100.');
      }
      const schedule = Array.isArray(enquiry.eventSchedule) && enquiry.eventSchedule.length
        ? enquiry.eventSchedule
        : [{ eventType: enquiry.eventType, eventDate: enquiry.eventDate, guestCount: enquiry.guestCount }];
      if (!Array.isArray(eventsBreakdown) || eventsBreakdown.length !== schedule.length) {
        return respondError(res, 400, 'Provide one price breakdown entry for every event in the enquiry.');
      }
      const checkedBreakdown = [];
      for (let index = 0; index < schedule.length; index += 1) {
        const event = eventsBreakdown[index];
        const scheduled = schedule[index];
        if (!event || !isValidMoney(event.charge)) {
          return respondError(res, 400, `Provide a valid non-negative price for ${scheduled.eventType}.`);
        }
        const breakdownDate = parseDateOnly(typeof event.eventDate === 'string' ? event.eventDate.slice(0, 10) : '');
        const scheduledDate = normalizeDateOnly(scheduled.eventDate);
        if (!breakdownDate || breakdownDate.getTime() !== scheduledDate.getTime()) {
          return respondError(res, 400, `Quotation date does not match the ${scheduled.eventType} event date.`);
        }
        checkedBreakdown.push({
          ...event,
          eventType: scheduled.eventType,
          eventDate: scheduled.eventDate,
          guestCount: scheduled.guestCount,
        });
      }
      let parsedValidUntil;
      if (validUntil) {
        parsedValidUntil = parseDateOnly(String(validUntil).slice(0, 10));
        if (!parsedValidUntil || parsedValidUntil < normalizeDateOnly(new Date())) {
          return respondError(res, 400, 'Quotation validity must be a valid date that is not in the past.');
        }
      }

      const calculated = calculateQuotation({
        baseVenuePrice,
        eventsBreakdown: checkedBreakdown,
        additionalServiceCharges,
        cateringCharges,
        decorationCharges,
        tax,
        discount,
        advancePercentage,
      });
      const nextRevision = (enquiry.quotation?.revisionNumber || 0) + 1;
      enquiry.quotation = {
        ...calculated,
        validUntil: parsedValidUntil,
        paymentTerms: paymentTerms || '30% Advance to confirm booking, balance before event date.',
        vendorNotes: vendorNotes || '',
        termsAndConditions: termsAndConditions || '',
        quotationStatus: 'sent',
        revisionNumber: nextRevision,
        sentAt: new Date(),
      };
      enquiry.status = 'quotation_sent';
      await enquiry.save();

      await Notification.create({
        recipient: enquiry.user,
        recipientRole: 'user',
        message: `Vendor sent ${nextRevision > 1 ? 'a revised ' : 'a '}quotation for ${enquiry.venue?.venueName || 'Venue'} (Total: ₹${calculated.totalEstimatedAmount.toLocaleString('en-IN')}).`,
      });

      return res.json({ success: true, message: 'Venue quotation sent successfully.', data: enquiry });
    }

    const booking = await VenueBooking.findOne({ _id: req.params.id, vendor: req.user.id })
      .populate('venue', 'venueName');
    if (!booking) return respondError(res, 404, 'Venue enquiry or booking not found.');
    if (!isValidMoney(baseVenuePrice) || !Array.isArray(eventsBreakdown || [])) {
      return respondError(res, 400, 'Provide valid quotation details.');
    }
    const calculated = calculateQuotation({
      baseVenuePrice,
      eventsBreakdown,
      additionalServiceCharges,
      cateringCharges,
      decorationCharges,
      tax,
      discount,
      advancePercentage,
    });
    booking.quotation = {
      ...calculated,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      paymentTerms: paymentTerms || '30% Advance to confirm booking, balance before event date.',
      vendorNotes: vendorNotes || '',
      termsAndConditions: termsAndConditions || '',
      quotationStatus: 'sent',
      sentAt: new Date(),
    };
    booking.estimatedPrice = calculated.totalEstimatedAmount;
    booking.status = 'quotation_sent';
    booking.quotationStatus = 'sent';
    booking.vendorResponse = vendorNotes || '';
    await booking.save();

    await Notification.create({
      recipient: booking.user,
      recipientRole: 'user',
      message: `Vendor sent a formal quotation for ${booking.venue?.venueName || 'Venue'} (Total: ₹${calculated.totalEstimatedAmount.toLocaleString('en-IN')}).`,
    });

    return res.json({ success: true, message: 'Venue quotation sent successfully.', data: booking });
  } catch (error) {
    return next(error);
  }
};

const respondToQuotationUser = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid enquiry ID.');
    const { action, revisionNotes } = req.body; // 'accept', 'request_revision', 'reject'
    if (!['accept', 'request_revision', 'reject'].includes(action)) {
      return respondError(res, 400, 'Invalid action. Choose accept, request_revision, or reject.');
    }

    let enquiry = await VenueEnquiry.findOne({ _id: req.params.id, user: req.user.id }).populate('venue', 'venueName');
    if (enquiry && enquiry.quotation) {
      const answerableStatuses = ['sent', 'revision_requested'];
      if (!answerableStatuses.includes(enquiry.quotation.quotationStatus)) {
        return respondError(res, 409, 'This quotation has already been answered.');
      }
      if (action === 'request_revision' && (typeof revisionNotes !== 'string' || !revisionNotes.trim())) {
        return respondError(res, 400, 'Revision notes are required when requesting a change.');
      }
      const newStatus = action === 'accept' ? 'accepted' : action === 'request_revision' ? 'revision_requested' : 'rejected';
      const respondedAt = new Date();
      const updated = await VenueEnquiry.findOneAndUpdate(
        {
          _id: enquiry._id,
          user: req.user.id,
          'quotation.quotationStatus': { $in: answerableStatuses },
        },
        {
          $set: {
            'quotation.quotationStatus': newStatus,
            'quotation.respondedAt': respondedAt,
            status: newStatus,
            ...(action === 'request_revision' ? { 'quotation.userRevisionNotes': revisionNotes.trim() } : {}),
          },
        },
        { returnDocument: 'after', runValidators: true }
      ).populate('venue', 'venueName');
      if (!updated) return respondError(res, 409, 'This quotation has already been answered.');

      await Notification.create({
        recipient: updated.vendor,
        recipientRole: 'vendor',
        message:
          action === 'accept'
            ? `Customer accepted your quotation for ${updated.venue?.venueName || 'Venue'}.`
            : action === 'request_revision'
            ? `Customer requested a revision on your quotation for ${updated.venue?.venueName || 'Venue'}.`
            : `Customer declined your quotation for ${updated.venue?.venueName || 'Venue'}.`,
      });

      return res.json({ success: true, message: `Quotation ${newStatus.replace('_', ' ')}.`, data: updated });
    }

    let booking = await VenueBooking.findOne({ _id: req.params.id, user: req.user.id }).populate('venue', 'venueName');
    if (booking && booking.quotation) {
      const newStatus = action === 'accept' ? 'accepted' : action === 'request_revision' ? 'revision_requested' : 'rejected';
      const bookingNextStatus = action === 'accept' ? 'confirmed' : action === 'request_revision' ? 'revision_requested' : 'rejected';
      
      booking.quotation.quotationStatus = newStatus;
      booking.quotation.respondedAt = new Date();
      if (action === 'request_revision') booking.quotation.userRevisionNotes = revisionNotes || '';
      booking.status = bookingNextStatus;
      booking.quotationStatus = newStatus;
      await booking.save();

      await Notification.create({
        recipient: booking.vendor,
        recipientRole: 'vendor',
        message:
          action === 'accept'
            ? `Customer accepted quotation & confirmed booking for ${booking.venue?.venueName || 'Venue'}.`
            : action === 'request_revision'
            ? `Customer requested quotation revision for ${booking.venue?.venueName || 'Venue'}.`
            : `Customer declined quotation for ${booking.venue?.venueName || 'Venue'}.`,
      });

      return res.json({ success: true, message: `Quotation ${newStatus.replace('_', ' ')}.`, data: booking });
    }

    return respondError(res, 404, 'Enquiry or quotation record not found.');
  } catch (error) {
    return next(error);
  }
};

const respondEnquiry = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid enquiry ID.');
    const { eventAvailabilities, estimatedPrice, vendorMessage = '', edit = false } = req.body || {};
    let enquiry = await VenueEnquiry.findOne({ _id: req.params.id, vendor: req.user.id })
      .populate('venue', 'venueName');
    if (enquiry) {
      if (typeof vendorMessage !== 'string' || vendorMessage.length > 2000) {
        return respondError(res, 400, 'Vendor message must be 2,000 characters or fewer.');
      }
      if (estimatedPrice !== undefined && !isValidMoney(estimatedPrice)) {
        return respondError(res, 400, 'Estimated price must be a valid non-negative amount.');
      }
      const schedule = Array.isArray(enquiry.eventSchedule) && enquiry.eventSchedule.length
        ? enquiry.eventSchedule
        : [{ eventType: enquiry.eventType, eventDate: enquiry.eventDate, guestCount: enquiry.guestCount }];
      if (!Array.isArray(eventAvailabilities) || eventAvailabilities.length !== schedule.length) {
        return respondError(res, 400, 'Select an availability status for every event date.');
      }
      const seenIndices = new Set();
      const normalizedAvailabilities = [];
      for (const item of eventAvailabilities) {
        const eventIndex = Number(item?.eventIndex);
        if (!Number.isInteger(eventIndex) || eventIndex < 0 || eventIndex >= schedule.length || seenIndices.has(eventIndex)) {
          return respondError(res, 400, 'Availability details must contain one entry per event.');
        }
        const scheduledEvent = schedule[eventIndex];
        const eventDate = parseDateOnly(typeof item.eventDate === 'string' ? item.eventDate.slice(0, 10) : '');
        if (!eventDate || eventDate.getTime() !== normalizeDateOnly(scheduledEvent.eventDate).getTime()) {
          return respondError(res, 400, `Availability date does not match ${scheduledEvent.eventType}.`);
        }
        if (!['available', 'not_available', 'need_more_details'].includes(item.status)) {
          return respondError(res, 400, `Select an availability status for ${scheduledEvent.eventType}.`);
        }
        if (typeof (item.reason || '') !== 'string' || (item.reason || '').length > 500) {
          return respondError(res, 400, 'Availability notes must be 500 characters or fewer.');
        }
        let alternativeDate;
        if (item.alternativeDate) {
          alternativeDate = parseDateOnly(item.alternativeDate);
          if (!alternativeDate || alternativeDate < normalizeDateOnly(new Date())) {
            return respondError(res, 400, 'Alternative dates must be valid dates that are not in the past.');
          }
        }
        if (item.status !== 'not_available' && alternativeDate) {
          return respondError(res, 400, 'Alternative dates may only be provided for unavailable events.');
        }
        seenIndices.add(eventIndex);
        normalizedAvailabilities.push({
          eventIndex,
          eventType: scheduledEvent.eventType,
          eventDate: scheduledEvent.eventDate,
          status: item.status,
          reason: item.reason || '',
          alternativeDate,
        });
      }
      normalizedAvailabilities.sort((left, right) => left.eventIndex - right.eventIndex);
      const overallAvailability = normalizedAvailabilities.some((item) => item.status === 'not_available')
        ? 'not_available'
        : normalizedAvailabilities.some((item) => item.status === 'need_more_details')
          ? 'need_more_details'
          : 'available';
      const savedResponse = {
        availabilityStatus: overallAvailability,
        estimatedPrice: estimatedPrice === undefined ? 0 : Number(estimatedPrice),
        vendorMessage: vendorMessage.trim(),
        eventAvailabilities: normalizedAvailabilities,
        respondedAt: new Date(),
      };
      if (enquiry.response?.eventAvailabilities?.length && edit !== true) {
        return respondError(res, 409, 'Availability response was already submitted. Choose Edit Response to change it.');
      }
      if (edit !== true) {
        const updated = await VenueEnquiry.findOneAndUpdate(
          { _id: enquiry._id, vendor: req.user.id, 'response.eventAvailabilities.0': { $exists: false } },
          {
            $set: {
              response: savedResponse,
              ...(enquiry.status === 'pending' ? { status: 'responded' } : {}),
            },
          },
          { returnDocument: 'after', runValidators: true }
        );
        if (!updated) return respondError(res, 409, 'Availability response was already submitted.');
        enquiry = updated;
      } else {
        enquiry.response = savedResponse;
        if (enquiry.status === 'pending') enquiry.status = 'responded';
        await enquiry.save();
      }

      await Notification.create({
        recipient: enquiry.user,
        recipientRole: 'user',
        message: `Vendor ${edit ? 'updated the availability response for' : 'responded to'} your enquiry for ${enquiry.venue?.venueName || 'Venue'}.`,
      });

      return res.json({ success: true, message: edit ? 'Venue availability response updated.' : 'Venue availability response sent.', data: enquiry });
    }

    let booking = await VenueBooking.findOne({ _id: req.params.id, vendor: req.user.id })
      .populate('venue', 'venueName');

    if (booking) {
      const sentAt = new Date();
      booking.status = 'quotation_sent';
      booking.quotationStatus = 'sent';
      booking.vendorResponse = vendorMessage || '';
      booking.estimatedPrice = estimatedPrice !== undefined ? Number(estimatedPrice) : booking.estimatedPrice;
      booking.quotation = {
        baseVenuePrice: estimatedPrice ? Number(estimatedPrice) : (booking.quotation?.baseVenuePrice || 0),
        extraCharges: 0,
        extraChargeDetails: '',
        estimatedTotal: estimatedPrice ? Number(estimatedPrice) : (booking.estimatedPrice || 0),
        advancePercentage: 30,
        advanceAmount: estimatedPrice ? Math.round(Number(estimatedPrice) * 0.3) : 0,
        remainingAmount: estimatedPrice ? Math.round(Number(estimatedPrice) * 0.7) : 0,
        vendorMessage: vendorMessage || '',
        sentAt,
      };
      await booking.save();

      await Notification.create({
        recipient: booking.user,
        recipientRole: 'user',
        message: `Vendor responded to your venue request for ${booking.venue?.venueName || 'Venue'}.`,
      });

      return res.json({ success: true, message: 'Venue response sent.', data: booking });
    }

    return respondError(res, 404, 'Enquiry or booking request not found.');
  } catch (error) {
    return next(error);
  }
};

const requestEnquiryVisit = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid enquiry ID.');
    const { preferredDate, preferredTime, visitorCount, message = '' } = req.body || {};
    const parsedDate = parseDateOnly(preferredDate);
    const visitors = Number(visitorCount);
    if (!parsedDate || !isFutureVisit(preferredDate, preferredTime)) {
      return respondError(res, 400, 'Choose a valid venue visit date and time in the future.');
    }
    if (!Number.isInteger(visitors) || visitors < 1) {
      return respondError(res, 400, 'Number of visitors must be a positive whole number.');
    }
    if (typeof message !== 'string' || message.length > 2000) {
      return respondError(res, 400, 'Visit message must be 2,000 characters or fewer.');
    }
    const acceptedEnquiry = await VenueEnquiry.findOne({
      _id: req.params.id,
      user: req.user.id,
      'quotation.quotationStatus': 'accepted',
    }).select('quotation.revisionNumber');
    if (!acceptedEnquiry) {
      const ownedEnquiry = await VenueEnquiry.exists({ _id: req.params.id, user: req.user.id });
      return ownedEnquiry
        ? respondError(res, 409, 'Accept the quotation before requesting a venue visit.')
        : respondError(res, 404, 'Venue enquiry not found.');
    }
    const quotationRevision = acceptedEnquiry.quotation?.revisionNumber || 1;
    const enquiry = await VenueEnquiry.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
        'quotation.quotationStatus': 'accepted',
        'quotation.revisionNumber': quotationRevision,
        $or: [{ visit: { $exists: false } }, { 'visit.status': 'rejected' }],
      },
      {
        $set: {
          visit: {
            preferredDate: parsedDate,
            preferredTime,
            visitorCount: visitors,
            message: message.trim(),
            quotationRevision,
            status: 'requested',
            requestedAt: new Date(),
          },
        },
      },
      { returnDocument: 'after', runValidators: true }
    )
      .populate('venue', 'venueName city')
      .populate('vendor', 'businessName name');
    if (!enquiry) {
      const ownedEnquiry = await VenueEnquiry.exists({ _id: req.params.id, user: req.user.id });
      if (!ownedEnquiry) return respondError(res, 404, 'Venue enquiry not found.');
      const current = await VenueEnquiry.findById(req.params.id).select('quotation.quotationStatus visit.status');
      if (current?.quotation?.quotationStatus !== 'accepted') {
        return respondError(res, 409, 'Accept the quotation before requesting a venue visit.');
      }
      return respondError(res, 409, 'A venue visit is already active for this enquiry.');
    }
    await Notification.create({
      recipient: enquiry.vendor,
      recipientRole: 'vendor',
      message: `A venue visit was requested for ${enquiry.venue?.venueName || 'your venue'}.`,
    });
    return res.status(201).json({ success: true, message: 'Venue visit request sent.', data: enquiry });
  } catch (error) {
    return next(error);
  }
};

const respondToEnquiryVisit = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid enquiry ID.');
    const { action, proposedDate, proposedTime, vendorMessage = '' } = req.body || {};
    if (!['accepted', 'rejected', 'proposed'].includes(action)) {
      return respondError(res, 400, 'Choose accepted, rejected, or proposed for the venue visit response.');
    }
    if (typeof vendorMessage !== 'string' || vendorMessage.length > 2000) {
      return respondError(res, 400, 'Visit response must be 2,000 characters or fewer.');
    }
    let parsedProposedDate;
    if (action === 'proposed') {
      parsedProposedDate = parseDateOnly(proposedDate);
      if (!parsedProposedDate || !isFutureVisit(proposedDate, proposedTime)) {
        return respondError(res, 400, 'Choose a valid proposed visit date and time in the future.');
      }
    }

    const enquiry = await VenueEnquiry.findOneAndUpdate(
      {
        _id: req.params.id,
        vendor: req.user.id,
        'quotation.quotationStatus': 'accepted',
        'visit.status': { $in: ['requested', 'proposed'] },
      },
      {
        $set: {
          'visit.status': action,
          'visit.proposedDate': action === 'proposed' ? parsedProposedDate : null,
          'visit.proposedTime': action === 'proposed' ? proposedTime : '',
          'visit.vendorMessage': vendorMessage.trim(),
          'visit.respondedAt': new Date(),
        },
      },
      { returnDocument: 'after', runValidators: true }
    )
      .populate('venue', 'venueName city')
      .populate('user', 'name email phone')
      .populate('vendor', 'businessName name');
    if (!enquiry) {
      const ownedEnquiry = await VenueEnquiry.exists({ _id: req.params.id, vendor: req.user.id });
      return ownedEnquiry
        ? respondError(res, 409, 'There is no pending venue visit response for this enquiry.')
        : respondError(res, 404, 'Venue enquiry not found.');
    }
    await Notification.create({
      recipient: enquiry.user,
      recipientRole: 'user',
      message: action === 'proposed'
        ? `The venue proposed a new visit time for ${enquiry.venue?.venueName || 'your venue request'}.`
        : `Your venue visit request was ${action}.`,
    });
    return res.json({ success: true, message: `Venue visit ${action}.`, data: enquiry });
  } catch (error) {
    return next(error);
  }
};

const confirmEnquiryVisitProposal = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid enquiry ID.');
    const proposedVisit = await VenueEnquiry.findOne({
      _id: req.params.id,
      user: req.user.id,
      'quotation.quotationStatus': 'accepted',
      'visit.status': 'proposed',
    }).select('visit.proposedDate visit.proposedTime');
    if (!proposedVisit) {
      const ownedEnquiry = await VenueEnquiry.exists({ _id: req.params.id, user: req.user.id });
      return ownedEnquiry
        ? respondError(res, 409, 'There is no proposed venue visit time to confirm.')
        : respondError(res, 404, 'Venue enquiry not found.');
    }
    const enquiry = await VenueEnquiry.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
        'quotation.quotationStatus': 'accepted',
        'visit.status': 'proposed',
        'visit.proposedDate': proposedVisit.visit.proposedDate,
        'visit.proposedTime': proposedVisit.visit.proposedTime,
      },
      {
        $set: {
          'visit.preferredDate': proposedVisit.visit.proposedDate,
          'visit.preferredTime': proposedVisit.visit.proposedTime,
          'visit.status': 'accepted',
          'visit.respondedAt': new Date(),
        },
      },
      { returnDocument: 'after', runValidators: true }
    )
      .populate('venue', 'venueName city')
      .populate('vendor', 'businessName name');
    if (!enquiry) {
      const ownedEnquiry = await VenueEnquiry.exists({ _id: req.params.id, user: req.user.id });
      return ownedEnquiry
        ? respondError(res, 409, 'There is no proposed venue visit time to confirm.')
        : respondError(res, 404, 'Venue enquiry not found.');
    }
    await Notification.create({
      recipient: enquiry.vendor,
      recipientRole: 'vendor',
      message: `Customer confirmed the proposed venue visit for ${enquiry.venue?.venueName || 'your venue'}.`,
    });
    return res.json({ success: true, message: 'Proposed venue visit confirmed.', data: enquiry });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createEnquiry,
  createTestEnquiry,
  getVendorEnquiries,
  getUserEnquiries,
  createOrUpdateQuotation,
  respondToQuotationUser,
  respondEnquiry,
  requestEnquiryVisit,
  respondToEnquiryVisit,
  confirmEnquiryVisitProposal,
};
