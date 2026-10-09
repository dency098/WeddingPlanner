const mongoose = require('mongoose');
const Review = require('../models/Review');
const VenueBooking = require('../models/VenueBooking');
const CateringInquiry = require('../models/CateringInquiry');

const respondError = (res, status, message) => res.status(status).json({ success: false, message });
const isObjectId = (value) => mongoose.isValidObjectId(value);

const createReview = async (req, res, next) => {
  try {
    const { vendorId, serviceType, referenceId, rating, feedback } = req.body;

    if (!isObjectId(vendorId) || !isObjectId(referenceId)) {
      return respondError(res, 400, 'Valid Vendor and Reference IDs are required.');
    }
    if (!['Venue', 'Catering'].includes(serviceType)) {
      return respondError(res, 400, 'Service type must be Venue or Catering.');
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return respondError(res, 400, 'Rating must be between 1 and 5.');
    }
    if (!feedback || typeof feedback !== 'string' || !feedback.trim()) {
      return respondError(res, 400, 'Feedback is required.');
    }

    // Verify booking completion
    let verifiedBooking = false;
    if (serviceType === 'Venue') {
      const booking = await VenueBooking.findOne({ _id: referenceId, user: req.user.id, vendor: vendorId, status: 'completed' });
      if (booking) verifiedBooking = true;
    } else {
      const inquiry = await CateringInquiry.findOne({ _id: referenceId, user: req.user.id, vendor: vendorId, status: { $in: ['accepted', 'completed'] } });
      if (inquiry) verifiedBooking = true;
    }

    if (!verifiedBooking) {
      return respondError(res, 403, 'You can only review services for which you have a completed booking.');
    }

    const review = await Review.create({
      user: req.user.id,
      vendor: vendorId,
      serviceType,
      referenceId,
      rating,
      feedback: feedback.trim(),
      verifiedBooking: true,
    });

    return res.status(201).json({ success: true, message: 'Review submitted successfully.', data: review });
  } catch (error) {
    return next(error);
  }
};

const getVendorReviews = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.vendorId)) return respondError(res, 400, 'Invalid vendor ID.');
    const reviews = await Review.find({ vendor: req.params.vendorId, isApproved: true })
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: reviews });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createReview,
  getVendorReviews,
};
