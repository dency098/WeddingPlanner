const mongoose = require('mongoose');
const CateringInquiry = require('../models/CateringInquiry');
const Catering = require('../models/Catering');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { calculateQuotation } = require('../utils/quotationCalculator');

const respondError = (res, status, message) => res.status(status).json({ success: false, message });
const isObjectId = (value) => mongoose.isValidObjectId(value);

const createInquiry = async (req, res, next) => {
  try {
    const {
      cateringId,
      venueId,
      eventType,
      eventDate,
      eventSchedule,
      city,
      venueName,
      venueType,
      guestCount,
      totalGuestCount,
      mealTypes,
      foodPreference,
      cuisines,
      selectedPackage,
      liveCounters,
      specialFoodRequirements,
      dietaryRequirements,
      budgetPerPlate,
      totalBudget,
      customQuoteRequired,
      message,
      events,
      userName,
      userEmail,
      userPhone,
    } = req.body;

    if (!cateringId || !isObjectId(cateringId)) {
      return respondError(res, 400, 'Valid Catering ID is required.');
    }

    const catering = await Catering.findById(cateringId);
    if (!catering) return respondError(res, 404, 'Catering service not found.');

    const finalGuestCount = Number(guestCount || totalGuestCount || 100);

    let processedSchedule = [];
    if (Array.isArray(eventSchedule) && eventSchedule.length > 0) {
      processedSchedule = eventSchedule.map((item) => ({
        eventType: item.eventType || eventType || 'Wedding',
        eventDate: new Date(item.eventDate || eventDate),
        startTime: item.startTime || '',
        endTime: item.endTime || '',
        guestCount: Number(item.guestCount || finalGuestCount),
        mealTypes: Array.isArray(item.mealTypes) ? item.mealTypes : Array.isArray(mealTypes) ? mealTypes : [],
        foodPreference: item.foodPreference || foodPreference || '',
        cuisines: Array.isArray(item.cuisines) ? item.cuisines : Array.isArray(cuisines) ? cuisines : [],
        selectedPackage: item.selectedPackage || selectedPackage || '',
        liveCounters: Array.isArray(item.liveCounters) ? item.liveCounters : Array.isArray(liveCounters) ? liveCounters : [],
        notes: item.notes || '',
      }));
    } else {
      processedSchedule = [
        {
          eventType: eventType || 'Wedding',
          eventDate: eventDate ? new Date(eventDate) : new Date(),
          guestCount: finalGuestCount,
          mealTypes: Array.isArray(mealTypes) ? mealTypes : [],
          foodPreference: foodPreference || '',
          cuisines: Array.isArray(cuisines) ? cuisines : [],
          selectedPackage: selectedPackage || '',
          liveCounters: Array.isArray(liveCounters) ? liveCounters : [],
          notes: message || '',
        },
      ];
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
      return respondError(res, 401, 'Please log in to send a catering enquiry.');
    }

    const primaryEvent = processedSchedule[0];

    const inquiry = await CateringInquiry.create({
      user: req.user.id,
      vendor: catering.vendor,
      venue: venueId || undefined,
      catering: cateringId,
      eventType: primaryEvent.eventType,
      eventDate: primaryEvent.eventDate,
      eventSchedule: processedSchedule,
      city: city || '',
      venueName: venueName || '',
      venueType: venueType || '',
      guestCount: primaryEvent.guestCount,
      totalGuestCount: primaryEvent.guestCount,
      mealTypes: primaryEvent.mealTypes,
      foodPreference: primaryEvent.foodPreference,
      cuisines: primaryEvent.cuisines,
      selectedPackage: primaryEvent.selectedPackage,
      liveCounters: primaryEvent.liveCounters,
      specialFoodRequirements: specialFoodRequirements || '',
      dietaryRequirements: dietaryRequirements || '',
      budgetPerPlate: budgetPerPlate ? Number(budgetPerPlate) : undefined,
      totalBudget: totalBudget ? Number(totalBudget) : undefined,
      customQuoteRequired: Boolean(customQuoteRequired),
      message: message || '',
      events: events || [],
      userName: derivedName,
      userEmail: derivedEmail,
      userPhone: derivedPhone,
      status: 'pending',
    });

    await Notification.create({
      recipient: catering.vendor,
      recipientRole: 'vendor',
      message: `New catering enquiry received from ${derivedName} for ${catering.companyName} (${processedSchedule.length} event${processedSchedule.length > 1 ? 's' : ''}).`,
    });

    return res.status(201).json({ success: true, message: 'Catering enquiry submitted successfully.', data: inquiry });
  } catch (error) {
    return next(error);
  }
};

const createTestEnquiry = async (req, res, next) => {
  try {
    const { cateringId } = req.body;
    if (!cateringId || !isObjectId(cateringId)) return respondError(res, 400, 'Valid Catering ID is required.');

    const catering = await Catering.findOne({ _id: cateringId, vendor: req.user.id });
    if (!catering) return respondError(res, 404, 'Catering service not found.');

    const dbUser = (await User.findById(req.user.id).lean()) || (await Vendor.findById(req.user.id).lean());

    const testInquiry = await CateringInquiry.create({
      user: req.user.id,
      vendor: catering.vendor,
      catering: catering._id,
      eventType: 'Test Food Tasting & Multi-Date Enquiry',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      eventSchedule: [
        {
          eventType: 'Sangeet Night',
          eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          guestCount: 200,
          mealTypes: ['Dinner'],
          foodPreference: catering.dietaryType || 'Veg',
          cuisines: ['Gujarati', 'Punjabi'],
          notes: 'High energy live counters',
        },
        {
          eventType: 'Wedding Lunch',
          eventDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          guestCount: 400,
          mealTypes: ['Lunch'],
          foodPreference: catering.dietaryType || 'Veg',
          cuisines: ['Traditional Thali'],
          notes: 'Sit-down traditional service',
        },
      ],
      city: catering.city || 'Surat',
      venueName: 'Test Tasting Venue',
      guestCount: 400,
      totalGuestCount: 400,
      mealTypes: ['Lunch', 'Dinner'],
      foodPreference: catering.dietaryType || 'Veg',
      cuisines: catering.cuisines || ['Gujarati', 'Punjabi'],
      selectedPackage: 'Premium Multi-Day Package Test',
      liveCounters: ['Dosa Counter', 'Chaat Counter'],
      budgetPerPlate: catering.pricePerPlate || 500,
      totalBudget: (catering.pricePerPlate || 500) * 400,
      message: 'This is a test food tasting enquiry generated for development testing.',
      userName: dbUser?.name || 'Test User',
      userEmail: dbUser?.email || 'test@example.com',
      userPhone: dbUser?.phone || '9999999999',
      isTest: true,
      status: 'pending',
    });

    await Notification.create({
      recipient: req.user.id,
      recipientRole: req.user.role,
      message: `[TEST] Test Food Enquiry created for ${catering.companyName}.`,
    });

    return res.status(201).json({
      success: true,
      message: 'Test food enquiry created successfully.',
      data: testInquiry,
    });
  } catch (error) {
    return next(error);
  }
};

const getVendorInquiries = async (req, res, next) => {
  try {
    const inquiries = await CateringInquiry.find({ vendor: req.user.id })
      .populate('user', 'name email phone')
      .populate('venue', 'venueName')
      .populate('catering', 'companyName pricePerPlate coverImage')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: inquiries });
  } catch (error) {
    return next(error);
  }
};

const getUserInquiries = async (req, res, next) => {
  try {
    const inquiries = await CateringInquiry.find({ user: req.user.id })
      .populate('vendor', 'businessName name email phone')
      .populate('venue', 'venueName')
      .populate('catering', 'companyName pricePerPlate coverImage')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: inquiries });
  } catch (error) {
    return next(error);
  }
};

const getAdminInquiries = async (req, res, next) => {
  try {
    const inquiries = await CateringInquiry.find()
      .populate('user', 'name email')
      .populate('vendor', 'businessName')
      .populate('catering', 'companyName')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: inquiries });
  } catch (error) {
    return next(error);
  }
};

const respondEnquiry = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid inquiry ID.');
    const { availabilityStatus, estimatedPrice, pricePerPlate, suggestedPackage, vendorMessage } = req.body;

    const inquiry = await CateringInquiry.findOne({ _id: req.params.id, vendor: req.user.id }).populate('catering', 'companyName');
    if (!inquiry) return respondError(res, 404, 'Catering enquiry not found.');

    inquiry.response = {
      availabilityStatus: availabilityStatus || 'available',
      estimatedPrice: estimatedPrice ? Number(estimatedPrice) : 0,
      pricePerPlate: pricePerPlate ? Number(pricePerPlate) : 0,
      suggestedPackage: suggestedPackage || '',
      vendorMessage: vendorMessage || '',
      respondedAt: new Date(),
    };
    inquiry.status = 'responded';
    await inquiry.save();

    await Notification.create({
      recipient: inquiry.user,
      recipientRole: 'user',
      message: `${inquiry.catering?.companyName || 'Caterer'} responded to your catering enquiry.`,
    });

    return res.json({ success: true, message: 'Catering response sent successfully.', data: inquiry });
  } catch (error) {
    return next(error);
  }
};

const sendQuotation = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid inquiry ID.');
    const {
      basePackagePrice,
      eventsBreakdown,
      customCharges,
      customChargeDetails,
      tax,
      discount,
      advancePercentage,
      validUntil,
      paymentTerms,
      vendorNotes,
      termsAndConditions,
      vendorMessage,
    } = req.body;

    const inquiry = await CateringInquiry.findOne({ _id: req.params.id, vendor: req.user.id }).populate('catering', 'companyName');
    if (!inquiry) return respondError(res, 404, 'Catering enquiry not found.');

    const calculated = calculateQuotation({
      baseVenuePrice: basePackagePrice || 0,
      eventsBreakdown,
      additionalServiceCharges: customCharges || 0,
      tax,
      discount,
      advancePercentage,
    });

    inquiry.quotation = {
      basePackagePrice: calculated.baseVenuePrice,
      eventsBreakdown: calculated.eventsBreakdown,
      perEventTotal: calculated.perEventTotal,
      customCharges: calculated.additionalServiceCharges,
      customChargeDetails: customChargeDetails || '',
      tax: calculated.tax,
      subtotal: calculated.subtotal,
      discount: calculated.discount,
      estimatedTotal: calculated.totalEstimatedAmount,
      advancePercentage: calculated.advancePercentage,
      advanceAmount: calculated.advanceAmount,
      remainingAmount: calculated.remainingAmount,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      paymentTerms: paymentTerms || '30% Advance on confirmation',
      vendorNotes: vendorNotes || vendorMessage || '',
      termsAndConditions: termsAndConditions || '',
      vendorMessage: vendorMessage || '',
      quotationStatus: 'sent',
      sentAt: new Date(),
    };
    inquiry.status = 'quotation_sent';
    await inquiry.save();

    await Notification.create({
      recipient: inquiry.user,
      recipientRole: 'user',
      message: `${inquiry.catering?.companyName || 'Caterer'} sent a formal quotation (Total: ₹${calculated.totalEstimatedAmount.toLocaleString('en-IN')}).`,
    });

    return res.json({ success: true, message: 'Catering quotation sent successfully.', data: inquiry });
  } catch (error) {
    return next(error);
  }
};

const updateInquiryStatus = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid inquiry ID.');
    const { status, reason, action, revisionNotes } = req.body;

    const inquiry = await CateringInquiry.findOne({ _id: req.params.id, user: req.user.id }).populate('catering', 'companyName');
    if (!inquiry) return respondError(res, 404, 'Inquiry not found.');

    const targetStatus = status || (action === 'accept' ? 'accepted' : action === 'request_revision' ? 'revision_requested' : action === 'reject' ? 'rejected' : 'pending');

    inquiry.status = targetStatus;
    if (inquiry.quotation) {
      inquiry.quotation.quotationStatus = targetStatus;
      inquiry.quotation.respondedAt = new Date();
      if (action === 'request_revision') inquiry.quotation.userRevisionNotes = revisionNotes || '';
    }

    if (targetStatus === 'cancelled') {
      inquiry.cancelledBy = 'user';
      inquiry.cancellationReason = reason;
      inquiry.cancelledAt = new Date();
    }

    await inquiry.save();

    await Notification.create({
      recipient: inquiry.vendor,
      recipientRole: 'vendor',
      message: `User updated status to ${targetStatus.replace('_', ' ')} for ${inquiry.catering?.companyName || 'Catering'} enquiry.`,
    });

    return res.json({ success: true, message: `Inquiry ${targetStatus} successfully.`, data: inquiry });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createInquiry,
  createTestEnquiry,
  getVendorInquiries,
  getUserInquiries,
  getAdminInquiries,
  respondEnquiry,
  sendQuotation,
  updateInquiryStatus,
};
