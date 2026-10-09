const mongoose = require('mongoose');
const Decorator = require('../models/Decorator');
const DecoratorEnquiry = require('../models/DecoratorEnquiry');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { calculateQuotation } = require('../utils/quotationCalculator');

const respondError = (res, status, message) => res.status(status).json({ success: false, message });
const isObjectId = (value) => mongoose.isValidObjectId(value);
const parseEventDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : parsed;
};
const isValidEventTime = (value) => !value || (typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));

const createEnquiry = async (req, res, next) => {
  try {
    const {
      decoratorId,
      decorator: decoratorBody,
      userName,
      userEmail,
      userPhone,
      eventType,
      eventDate,
      eventSchedule,
      city,
      venueName,
      venueType,
      guestCount,
      decorationsRequired,
      decorationRequirements,
      style,
      decorationStyle,
      budget,
      customBudget,
      message,
    } = req.body;

    const targetDecoratorId = decoratorId || decoratorBody;

    if (!targetDecoratorId || !isObjectId(targetDecoratorId)) {
      return respondError(res, 400, 'Valid decorator service is required.');
    }

    const decorator = await Decorator.findOne({ _id: targetDecoratorId, approvalStatus: 'approved', isActive: true });
    if (!decorator) return respondError(res, 404, 'Decorator service not found or not available.');

    const finalDecorationsRequired = Array.isArray(decorationsRequired)
      ? decorationsRequired
      : Array.isArray(decorationRequirements)
      ? decorationRequirements
      : [];

    const finalStyle = style || decorationStyle || '';

    const submittedSchedule = Array.isArray(eventSchedule) && eventSchedule.length > 0
      ? eventSchedule
      : [{ eventType, eventDate, guestCount, notes: message }];
    if (submittedSchedule.length > 20) {
      return respondError(res, 400, 'An enquiry can include no more than 20 event dates.');
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const processedSchedule = [];
    for (const item of submittedSchedule) {
      const parsedDate = parseEventDate(item?.eventDate || eventDate);
      const guests = Number(item?.guestCount ?? guestCount);
      const startTime = item?.startTime || '';
      const endTime = item?.endTime || '';
      if (!parsedDate) return respondError(res, 400, 'Every decoration event needs a valid date in YYYY-MM-DD format.');
      if (parsedDate < today) return respondError(res, 400, 'Decoration event dates cannot be in the past.');
      if (!Number.isInteger(guests) || guests < 1) {
        return respondError(res, 400, 'Guest count must be a positive whole number for every event.');
      }
      if (!isValidEventTime(startTime) || !isValidEventTime(endTime)) {
        return respondError(res, 400, 'Event times must use a valid 24-hour time.');
      }
      if (startTime && endTime && startTime >= endTime) {
        return respondError(res, 400, 'End time must be later than start time for every event.');
      }
      const normalizedEventType = typeof item?.eventType === 'string' ? item.eventType.trim() : '';
      if (!normalizedEventType) return respondError(res, 400, 'Event type is required for every decoration event.');
      processedSchedule.push({
        eventType: normalizedEventType,
        eventDate: parsedDate,
        startTime,
        endTime,
        guestCount: guests,
        decorationsRequired: Array.isArray(item?.decorationsRequired) ? item.decorationsRequired : finalDecorationsRequired,
        style: item?.style || finalStyle,
        budget: item?.budget || budget || '',
        notes: typeof item?.notes === 'string' ? item.notes : '',
      });
    }
    if (typeof city !== 'string' || !city.trim()) {
      return respondError(res, 400, 'Event city is required.');
    }

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
      return respondError(res, 401, 'Please log in to send an enquiry.');
    }

    const primaryEvent = processedSchedule[0];

    const enquiry = await DecoratorEnquiry.create({
      user: req.user.id,
      vendor: decorator.vendor,
      decorator: decorator._id,
      eventType: primaryEvent.eventType,
      eventDate: primaryEvent.eventDate,
      eventSchedule: processedSchedule,
      city: city.trim(),
      venueName: venueName || '',
      venueType: venueType || '',
      guestCount: primaryEvent.guestCount,
      decorationsRequired: primaryEvent.decorationsRequired,
      style: primaryEvent.style,
      budget: budget || '',
      customBudget: customBudget ? Number(customBudget) : undefined,
      message: message || '',
      userName: derivedName,
      userEmail: derivedEmail,
      userPhone: derivedPhone,
      status: 'sent',
    });

    await Notification.create({
      recipient: decorator.vendor,
      recipientRole: 'vendor',
      message: `New wedding decoration enquiry received from ${derivedName} for ${decorator.businessName} (${processedSchedule.length} function${processedSchedule.length > 1 ? 's' : ''}).`,
    });

    return res.status(201).json({
      success: true,
      message: 'Your decoration requirement has been sent successfully.',
      data: enquiry,
    });
  } catch (error) {
    return next(error);
  }
};

const getVendorEnquiries = async (req, res, next) => {
  try {
    const enquiries = await DecoratorEnquiry.find({ vendor: req.user.id })
      .populate('decorator', 'businessName city startingPrice coverImage')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: enquiries });
  } catch (error) {
    return next(error);
  }
};

const getUserEnquiries = async (req, res, next) => {
  try {
    const enquiries = await DecoratorEnquiry.find({ user: req.user.id })
      .populate('decorator', 'businessName city startingPrice coverImage contactNumber email')
      .populate('vendor', 'businessName name email phone')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: enquiries });
  } catch (error) {
    return next(error);
  }
};

const getEnquiryDetails = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid enquiry ID.');
    const enquiry = await DecoratorEnquiry.findById(req.params.id)
      .populate('decorator')
      .populate('user', 'name email phone')
      .populate('vendor', 'businessName name email phone');

    if (!enquiry) return respondError(res, 404, 'Enquiry not found.');

    const userId = req.user.id.toString();
    const isOwnerUser = enquiry.user._id.toString() === userId;
    const isOwnerVendor = enquiry.vendor._id.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwnerUser && !isOwnerVendor && !isAdmin) {
      return respondError(res, 403, 'Access denied.');
    }

    if (isOwnerVendor && enquiry.status === 'sent') {
      enquiry.status = 'viewed';
      await enquiry.save();
    }

    return res.json({ success: true, data: enquiry });
  } catch (error) {
    return next(error);
  }
};

const sendQuotation = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid enquiry ID.');
    const {
      baseDecorationPrice,
      eventsBreakdown,
      additionalServiceCharges,
      tax,
      discount,
      advancePercentage,
      validUntil,
      paymentTerms,
      vendorNotes,
      termsAndConditions,
      availabilityStatus,
    } = req.body;

    const enquiry = await DecoratorEnquiry.findOne({ _id: req.params.id, vendor: req.user.id }).populate('decorator', 'businessName');
    if (!enquiry) return respondError(res, 404, 'Decorator enquiry not found.');

    const calculated = calculateQuotation({
      baseVenuePrice: baseDecorationPrice || 0,
      eventsBreakdown,
      additionalServiceCharges,
      tax,
      discount,
      advancePercentage,
    });

    enquiry.quotation = {
      baseDecorationPrice: calculated.baseVenuePrice,
      eventsBreakdown: calculated.eventsBreakdown,
      perEventTotal: calculated.perEventTotal,
      additionalServiceCharges: calculated.additionalServiceCharges,
      tax: calculated.tax,
      subtotal: calculated.subtotal,
      discount: calculated.discount,
      estimatedTotal: calculated.totalEstimatedAmount,
      advancePercentage: calculated.advancePercentage,
      advanceAmount: calculated.advanceAmount,
      remainingAmount: calculated.remainingAmount,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      paymentTerms: paymentTerms || '30% Advance on booking',
      vendorNotes: vendorNotes || '',
      termsAndConditions: termsAndConditions || '',
      quotationStatus: 'sent',
      sentAt: new Date(),
    };

    enquiry.response = {
      availabilityStatus: availabilityStatus || 'available',
      estimatedPrice: calculated.totalEstimatedAmount,
      vendorMessage: vendorNotes || 'Decoration quotation sent.',
      respondedAt: new Date(),
    };

    enquiry.status = 'quotation_sent';
    await enquiry.save();

    await Notification.create({
      recipient: enquiry.user,
      recipientRole: 'user',
      message: `${enquiry.decorator?.businessName || 'Decorator'} sent a formal quotation (Total: ₹${calculated.totalEstimatedAmount.toLocaleString('en-IN')}).`,
    });

    return res.json({ success: true, message: 'Decoration quotation sent successfully.', data: enquiry });
  } catch (error) {
    return next(error);
  }
};

const respondToQuotationUser = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid enquiry ID.');
    const { action, revisionNotes } = req.body;

    const enquiry = await DecoratorEnquiry.findOne({ _id: req.params.id, user: req.user.id }).populate('decorator', 'businessName');
    if (!enquiry) return respondError(res, 404, 'Decorator enquiry not found.');

    const newStatus = action === 'accept' ? 'accepted' : action === 'request_revision' ? 'revision_requested' : 'rejected';
    if (enquiry.quotation) {
      enquiry.quotation.quotationStatus = newStatus;
      enquiry.quotation.respondedAt = new Date();
      if (action === 'request_revision') enquiry.quotation.userRevisionNotes = revisionNotes || '';
    }
    enquiry.status = newStatus;
    await enquiry.save();

    await Notification.create({
      recipient: enquiry.vendor,
      recipientRole: 'vendor',
      message: `Customer ${newStatus.replace('_', ' ')} your quotation for ${enquiry.decorator?.businessName || 'Decoration'}.`,
    });

    return res.json({ success: true, message: `Quotation ${newStatus.replace('_', ' ')}.`, data: enquiry });
  } catch (error) {
    return next(error);
  }
};

const respondEnquiry = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid enquiry ID.');
    const { availabilityStatus, estimatedPrice, vendorMessage } = req.body;

    if (!['available', 'not_available', 'need_more_details'].includes(availabilityStatus)) {
      return respondError(res, 400, 'Select a valid availability status.');
    }

    const enquiry = await DecoratorEnquiry.findOne({ _id: req.params.id, vendor: req.user.id }).populate('decorator', 'businessName');
    if (!enquiry) return respondError(res, 404, 'Enquiry not found.');

    enquiry.response = {
      availabilityStatus,
      estimatedPrice: estimatedPrice ? Number(estimatedPrice) : 0,
      vendorMessage: vendorMessage || '',
      respondedAt: new Date(),
    };
    enquiry.status = 'responded';
    await enquiry.save();

    await Notification.create({
      recipient: enquiry.user,
      recipientRole: 'user',
      message: `${enquiry.decorator.businessName} responded to your wedding decoration enquiry.`,
    });

    return res.json({ success: true, message: 'Response sent to customer successfully.', data: enquiry });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createEnquiry,
  getVendorEnquiries,
  getUserEnquiries,
  getEnquiryDetails,
  sendQuotation,
  respondToQuotationUser,
  respondEnquiry,
};
