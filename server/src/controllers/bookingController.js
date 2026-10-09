const mongoose = require('mongoose');
const Venue = require('../models/Venue');
const VenueBooking = require('../models/VenueBooking');
const Notification = require('../models/Notification');
const {
  appendLifecycleEvent,
  calculateQuotation,
  canTransitionBookingStatus,
} = require('../utils/bookingLifecycle');

const eventTypes = ['Wedding', 'Reception', 'Engagement', 'Sangeet', 'Mehndi', 'Other'];
const isObjectId = (value) => mongoose.isValidObjectId(value);
const errorResponse = (res, status, message) => res.status(status).json({ success: false, message });

const parseDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10) === value ? date : null;
};

const dayStart = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const populateBooking = (query, { includeUserEmail = false, includeVendorEmail = false } = {}) =>
  query
    .populate('venue', 'venueName coverImage city state address venueType startingPrice priceType cancellationPolicy')
    .populate('user', includeUserEmail ? 'name email' : 'name')
    .populate('vendor', includeVendorEmail ? 'name businessName email' : 'name businessName');

const checkBookable = async (venueId, eventDate, guestCount) => {
  const venue = await Venue.findById(venueId);
  if (!venue) return { reason: 'Venue not found.' };
  if (venue.approvalStatus !== 'approved' || !venue.isActive) return { reason: 'This venue is not accepting booking requests.' };
  if (guestCount < venue.minimumGuests || guestCount > venue.maximumGuests || guestCount > venue.seatingCapacity) {
    return { reason: `Guest count must be between ${venue.minimumGuests} and ${Math.min(venue.maximumGuests, venue.seatingCapacity)}.` };
  }
  if (venue.blockedDates.some((date) => dayStart(date).getTime() === eventDate.getTime())) return { reason: 'The venue is blocked for this date.' };
  if (await VenueBooking.exists({ venue: venue._id, eventDate, status: { $in: ['accepted', 'confirmed'] } })) return { reason: 'An accepted booking already exists for this date.' };
  return { venue };
};

const createBooking = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return errorResponse(res, 400, 'Booking details must be a JSON object.');
    const { venueId, eventDate: dateInput, guestCount, eventType, message = '' } = req.body;
    if (!isObjectId(venueId)) return errorResponse(res, 400, 'A valid venue ID is required.');
    const eventDate = parseDate(dateInput);
    if (!eventDate || eventDate < dayStart(new Date())) return errorResponse(res, 400, 'Choose a valid event date that is not in the past.');
    const guests = typeof guestCount === 'number' || (typeof guestCount === 'string' && guestCount.trim() !== '')
      ? Number(guestCount)
      : Number.NaN;
    if (!Number.isInteger(guests) || guests < 1) return errorResponse(res, 400, 'Guest count must be a positive whole number.');
    if (!eventTypes.includes(eventType)) return errorResponse(res, 400, 'Choose a valid event type.');
    if (typeof message !== 'string' || message.length > 2000) return errorResponse(res, 400, 'Message must be 2,000 characters or fewer.');

    const result = await checkBookable(venueId, eventDate, guests);
    if (!result.venue) return errorResponse(res, result.reason === 'Venue not found.' ? 404 : 409, result.reason);
    const { venue } = result;
    const estimatedPrice = venue.priceType === 'Per Plate' ? venue.startingPrice * guests : venue.startingPrice;
    const booking = await VenueBooking.create({
      user: req.user.id,
      vendor: venue.vendor,
      venue: venue._id,
      eventDate,
      guestCount: guests,
      eventType,
      message: message.trim(),
      estimatedPrice,
    });
    appendLifecycleEvent(booking, {
      type: 'booking_requested',
      actorRole: 'user',
      actorId: req.user.id,
    });
    await booking.save();
    const populated = await populateBooking(VenueBooking.findById(booking._id));
    return res.status(201).json({ success: true, message: 'Booking request sent successfully.', data: populated });
  } catch (error) {
    if (error.code === 11000) return errorResponse(res, 409, 'This date has already been accepted by another booking.');
    return next(error);
  }
};

const listUserBookings = async (req, res, next) => {
  try {
    const bookings = await populateBooking(VenueBooking.find({ user: req.user.id }).sort({ eventDate: 1 })).lean();
    return res.json({ success: true, data: bookings });
  } catch (error) {
    return next(error);
  }
};

const getUserBooking = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return errorResponse(res, 400, 'Invalid booking ID.');
    const booking = await populateBooking(VenueBooking.findOne({ _id: req.params.id, user: req.user.id })).lean();
    if (!booking) return errorResponse(res, 404, 'Booking not found.');
    return res.json({ success: true, data: booking });
  } catch (error) {
    return next(error);
  }
};

const cancelUserBooking = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return errorResponse(res, 400, 'Invalid booking ID.');
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return errorResponse(res, 400, 'Cancellation details must be a JSON object.');
    return cancelBooking(req, res, next, 'user');
  } catch (error) {
    return next(error);
  }
};

const cancelBooking = async (req, res, next, actorRole) => {
  try {
    if (!isObjectId(req.params.id)) return errorResponse(res, 400, 'Invalid booking ID.');
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return errorResponse(res, 400, 'Cancellation details must be a JSON object.');
    }
    const reason = req.body?.reason;
    if (typeof reason !== 'string' || !reason.trim() || reason.length > 1000) {
      return errorResponse(res, 400, 'A cancellation reason of 1,000 characters or fewer is required.');
    }
    const filter = { _id: req.params.id };
    if (actorRole === 'user') filter.user = req.user.id;
    if (actorRole === 'vendor') filter.vendor = req.user.id;
    const booking = await VenueBooking.findOne(filter);
    if (!booking) return errorResponse(res, 404, 'Booking not found.');
    if (!canTransitionBookingStatus(booking.status, 'cancelled')) {
      return errorResponse(res, 409, 'This booking can no longer be cancelled.');
    }

    const cancelledAt = new Date();
    const updated = await VenueBooking.findOneAndUpdate(
      { ...filter, status: booking.status },
      {
        $set: {
          status: 'cancelled',
          cancelledBy: actorRole,
          cancellationReason: reason.trim(),
          cancelledAt,
        },
        $push: {
          lifecycleEvents: {
            type: 'cancelled',
            actorRole,
            actorId: req.user.id,
            message: reason.trim(),
            occurredAt: cancelledAt,
          },
        },
      },
      { returnDocument: 'after', runValidators: true }
    );
    if (!updated) return errorResponse(res, 409, 'This booking has already changed.');
    const venue = await Venue.findById(updated.venue).select('venueName').lean();
    if (actorRole === 'admin') {
      await Notification.create([
        {
          recipient: updated.user,
          recipientRole: 'user',
          booking: updated._id,
          message: `Your ${venue?.venueName || 'venue'} booking has been cancelled by the admin.`,
        },
        {
          recipient: updated.vendor,
          recipientRole: 'vendor',
          booking: updated._id,
          message: `A booking at ${venue?.venueName || 'your venue'} has been cancelled by the admin.`,
        },
      ]);
    } else {
      await Notification.create({
        recipient: actorRole === 'vendor' ? updated.user : updated.vendor,
        recipientRole: actorRole === 'vendor' ? 'user' : 'vendor',
        booking: updated._id,
        message: `Your ${venue?.venueName || 'venue'} booking has been cancelled by the ${actorRole === 'user' ? 'customer' : 'vendor'}.`,
      });
    }
    const populated = await populateBooking(VenueBooking.findById(updated._id));
    return res.json({ success: true, message: 'Booking cancelled.', data: populated });
  } catch (error) {
    return next(error);
  }
};

const cancelVendorBooking = (req, res, next) => cancelBooking(req, res, next, 'vendor');
const cancelAdminBooking = (req, res, next) => cancelBooking(req, res, next, 'admin');

const createBookingQuotation = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return errorResponse(res, 400, 'Invalid booking ID.');
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return errorResponse(res, 400, 'Quotation details must be a JSON object.');
    }
    const booking = await VenueBooking.findOne({ _id: req.params.id, vendor: req.user.id });
    if (!booking) return errorResponse(res, 404, 'Booking not found.');
    if (!canTransitionBookingStatus(booking.status, 'quotation_sent')) {
      return errorResponse(res, 409, 'A quotation can only be sent for a pending booking.');
    }

    const {
      baseVenuePrice,
      extraCharges = 0,
      extraChargeDetails = '',
      advancePercentage,
      vendorMessage = '',
    } = req.body;
    const isNumericInput = (value) =>
      typeof value === 'number' || (typeof value === 'string' && value.trim() !== '');
    if (!isNumericInput(baseVenuePrice) || !isNumericInput(extraCharges) || !isNumericInput(advancePercentage)) {
      return errorResponse(res, 400, 'Venue price, extra charges, and advance percentage are required numbers.');
    }
    if (typeof extraChargeDetails !== 'string' || extraChargeDetails.length > 500) {
      return errorResponse(res, 400, 'Extra charge description must be 500 characters or fewer.');
    }
    if (Number(extraCharges) > 0 && !extraChargeDetails.trim()) {
      return errorResponse(res, 400, 'Describe the extra charges.');
    }
    if (typeof vendorMessage !== 'string' || vendorMessage.length > 1000) {
      return errorResponse(res, 400, 'Vendor message must be 1,000 characters or fewer.');
    }

    let amounts;
    try {
      amounts = calculateQuotation({ baseVenuePrice, extraCharges, advancePercentage });
    } catch (error) {
      return errorResponse(res, 400, error.message);
    }
    const sentAt = new Date();
    const quotation = {
      baseVenuePrice: Number(baseVenuePrice),
      extraCharges: Number(extraCharges),
      extraChargeDetails: extraChargeDetails.trim(),
      ...amounts,
      advancePercentage: Number(advancePercentage),
      vendorMessage: vendorMessage.trim(),
      createdAt: sentAt,
      updatedAt: sentAt,
      sentAt,
    };
    const updated = await VenueBooking.findOneAndUpdate(
      { _id: booking._id, vendor: req.user.id, status: 'pending' },
      {
        $set: { status: 'quotation_sent', quotationStatus: 'sent', quotation, estimatedPrice: amounts.estimatedTotal },
        $push: {
          lifecycleEvents: {
            type: 'quotation_sent',
            actorRole: 'vendor',
            actorId: req.user.id,
            occurredAt: sentAt,
          },
        },
      },
      { returnDocument: 'after', runValidators: true }
    );
    if (!updated) return errorResponse(res, 409, 'This booking has already changed.');
    const venue = await Venue.findById(updated.venue).select('venueName').lean();
    await Notification.create({
      recipient: updated.user,
      recipientRole: 'user',
      booking: updated._id,
      message: `${venue?.venueName || 'A venue'} sent you a booking quotation.`,
    });
    const populated = await populateBooking(VenueBooking.findById(updated._id));
    return res.json({ success: true, message: 'Quotation sent to the customer.', data: populated });
  } catch (error) {
    return next(error);
  }
};

const respondToBookingQuotation = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return errorResponse(res, 400, 'Invalid booking ID.');
    if (!req.body || !['accepted', 'rejected'].includes(req.body.status)) {
      return errorResponse(res, 400, 'Response must be accepted or rejected.');
    }
    const booking = await VenueBooking.findOne({ _id: req.params.id, user: req.user.id });
    if (!booking) return errorResponse(res, 404, 'Booking not found.');
    if (booking.status !== 'quotation_sent' || booking.quotationStatus !== 'sent') {
      return errorResponse(res, 409, 'There is no active quotation to respond to.');
    }
    const nextStatus = req.body.status === 'accepted' ? 'confirmed' : 'rejected';
    if (!canTransitionBookingStatus(booking.status, nextStatus)) {
      return errorResponse(res, 409, 'This quotation can no longer be answered.');
    }
    if (nextStatus === 'confirmed') {
      const result = await checkBookable(booking.venue, booking.eventDate, booking.guestCount);
      if (!result.venue) return errorResponse(res, 409, result.reason);
    }

    const respondedAt = new Date();
    const updated = await VenueBooking.findOneAndUpdate(
      { _id: booking._id, user: req.user.id, status: 'quotation_sent', quotationStatus: 'sent' },
      {
        $set: {
          status: nextStatus,
          quotationStatus: req.body.status,
          'quotation.respondedAt': respondedAt,
          'quotation.updatedAt': respondedAt,
        },
        $push: {
          lifecycleEvents: {
            $each: req.body.status === 'accepted'
              ? [
                  { type: 'quotation_accepted', actorRole: 'user', actorId: req.user.id, occurredAt: respondedAt },
                  { type: 'booking_confirmed', actorRole: 'user', actorId: req.user.id, occurredAt: respondedAt },
                ]
              : [{ type: 'quotation_rejected', actorRole: 'user', actorId: req.user.id, occurredAt: respondedAt }],
          },
        },
      },
      { returnDocument: 'after', runValidators: true }
    );
    if (!updated) return errorResponse(res, 409, 'This quotation has already been answered.');

    const venue = await Venue.findById(updated.venue).select('venueName').lean();
    await Notification.create({
      recipient: updated.vendor,
      recipientRole: 'vendor',
      booking: updated._id,
      message: req.body.status === 'accepted'
        ? `Your booking at ${venue?.venueName || 'the venue'} is confirmed.`
        : `The customer rejected your quotation for ${venue?.venueName || 'the venue'}.`,
    });
    const populated = await populateBooking(VenueBooking.findById(updated._id));
    return res.json({
      success: true,
      message: req.body.status === 'accepted' ? 'Quotation accepted; booking confirmed.' : 'Quotation rejected.',
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) return errorResponse(res, 409, 'Another booking was confirmed for this venue and date.');
    return next(error);
  }
};

const listVendorBookings = async (req, res, next) => {
  try {
    const bookings = await populateBooking(VenueBooking.find({ vendor: req.user.id }).sort({ eventDate: 1 }), { includeUserEmail: true }).lean();
    return res.json({ success: true, data: bookings });
  } catch (error) {
    return next(error);
  }
};

const respondToBooking = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return errorResponse(res, 400, 'Invalid booking ID.');
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return errorResponse(res, 400, 'Booking response must be a JSON object.');
    const { status, vendorResponse = '' } = req.body;
    if (!['accepted', 'rejected'].includes(status)) return errorResponse(res, 400, 'Response must be accepted or rejected.');
    if (typeof vendorResponse !== 'string' || vendorResponse.length > 1000) return errorResponse(res, 400, 'Response must be 1,000 characters or fewer.');

    const booking = await VenueBooking.findOne({ _id: req.params.id, vendor: req.user.id, status: 'pending' });
    if (!booking) return errorResponse(res, 404, 'Pending booking request not found.');
    if (!canTransitionBookingStatus(booking.status, status)) return errorResponse(res, 409, 'This booking status transition is not allowed.');

    if (status === 'accepted') {
      const result = await checkBookable(booking.venue, booking.eventDate, booking.guestCount);
      if (!result.venue) return errorResponse(res, 409, result.reason);
    }

    const updated = await VenueBooking.findOneAndUpdate(
      { _id: booking._id, vendor: req.user.id, status: 'pending' },
      {
        $set: { status, vendorResponse: vendorResponse.trim() },
        $push: {
          lifecycleEvents: {
            type: status,
            actorRole: 'vendor',
            actorId: req.user.id,
            message: vendorResponse.trim(),
            occurredAt: new Date(),
          },
        },
      },
      { returnDocument: 'after', runValidators: true }
    );
    if (!updated) return errorResponse(res, 409, 'This booking request has already been handled.');
    const populated = await populateBooking(VenueBooking.findById(updated._id));
    await Notification.create({
      recipient: updated.user,
      recipientRole: 'user',
      booking: updated._id,
      message: `Your venue booking request was ${status}.`,
    });
    return res.json({ success: true, message: `Booking ${status}.`, data: populated });
  } catch (error) {
    if (error.code === 11000) return errorResponse(res, 409, 'Another booking was accepted for this venue and date.');
    return next(error);
  }
};

const completeAdminBooking = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return errorResponse(res, 400, 'Invalid booking ID.');
    const booking = await VenueBooking.findById(req.params.id);
    if (!booking) return errorResponse(res, 404, 'Booking not found.');
    if (!['confirmed', 'accepted'].includes(booking.status) || !canTransitionBookingStatus(booking.status, 'completed')) {
      return errorResponse(res, 409, 'Only confirmed bookings can be completed.');
    }
    if (booking.eventDate > dayStart(new Date())) {
      return errorResponse(res, 409, 'A booking cannot be completed before its event date.');
    }
    const completedAt = new Date();
    const updated = await VenueBooking.findOneAndUpdate(
      { _id: booking._id, status: booking.status },
      {
        $set: { status: 'completed' },
        $push: {
          lifecycleEvents: {
            type: 'completed',
            actorRole: 'admin',
            actorId: req.user.id,
            occurredAt: completedAt,
          },
        },
      },
      { returnDocument: 'after', runValidators: true }
    );
    if (!updated) return errorResponse(res, 409, 'This booking has already changed.');
    const venue = await Venue.findById(updated.venue).select('venueName').lean();
    const message = `Your ${venue?.venueName || 'venue'} booking is marked as completed.`;
    await Notification.create([
      { recipient: updated.user, recipientRole: 'user', booking: updated._id, message },
      { recipient: updated.vendor, recipientRole: 'vendor', booking: updated._id, message },
    ]);
    const populated = await populateBooking(VenueBooking.findById(updated._id));
    return res.json({ success: true, message: 'Booking marked as completed.', data: populated });
  } catch (error) {
    return next(error);
  }
};

const listAdminBookings = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      if (!['pending', 'accepted', 'quotation_sent', 'confirmed', 'rejected', 'cancelled', 'completed'].includes(req.query.status)) {
        return errorResponse(res, 400, 'Invalid booking status.');
      }
      filter.status = req.query.status;
    }
    const bookings = await populateBooking(VenueBooking.find(filter).sort({ createdAt: -1 }), { includeUserEmail: true, includeVendorEmail: true }).lean();
    return res.json({ success: true, data: bookings });
  } catch (error) {
    return next(error);
  }
};

const requestVisit = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return errorResponse(res, 400, 'Invalid booking ID.');
    const { visitDate } = req.body;
    if (!visitDate) return errorResponse(res, 400, 'Visit date is required.');
    
    const parsedDate = new Date(visitDate);
    if (isNaN(parsedDate)) return errorResponse(res, 400, 'Invalid visit date.');

    const booking = await VenueBooking.findOne({ _id: req.params.id, vendor: req.user.id });
    if (!booking) return errorResponse(res, 404, 'Booking not found.');
    
    const updated = await VenueBooking.findOneAndUpdate(
      { _id: booking._id, vendor: req.user.id },
      {
        $set: { status: 'visit_requested', visitDate: parsedDate, visitStatus: 'pending' },
        $push: {
          lifecycleEvents: {
            type: 'visit_requested',
            actorRole: 'vendor',
            actorId: req.user.id,
            message: `Vendor requested a visit on ${parsedDate.toISOString()}`,
            occurredAt: new Date(),
          },
        },
      },
      { returnDocument: 'after', runValidators: true }
    );
    
    const populated = await populateBooking(VenueBooking.findById(updated._id));
    return res.json({ success: true, message: 'Visit request sent to the customer.', data: populated });
  } catch (error) {
    return next(error);
  }
};

const confirmVisit = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return errorResponse(res, 400, 'Invalid booking ID.');
    
    const booking = await VenueBooking.findOne({ _id: req.params.id, user: req.user.id });
    if (!booking) return errorResponse(res, 404, 'Booking not found.');
    
    const updated = await VenueBooking.findOneAndUpdate(
      { _id: booking._id, user: req.user.id },
      {
        $set: { status: 'visit_scheduled', visitStatus: 'confirmed' },
        $push: {
          lifecycleEvents: {
            type: 'visit_scheduled',
            actorRole: 'user',
            actorId: req.user.id,
            message: `User confirmed the visit.`,
            occurredAt: new Date(),
          },
        },
      },
      { returnDocument: 'after', runValidators: true }
    );
    
    const populated = await populateBooking(VenueBooking.findById(updated._id));
    return res.json({ success: true, message: 'Visit confirmed.', data: populated });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBooking,
  listUserBookings,
  getUserBooking,
  cancelUserBooking,
  cancelVendorBooking,
  cancelAdminBooking,
  createBookingQuotation,
  respondToBookingQuotation,
  listVendorBookings,
  respondToBooking,
  listAdminBookings,
  completeAdminBooking,
  requestVisit,
  confirmVisit,
};
