const mongoose = require('mongoose');
const Portfolio = require('../models/Portfolio');

const respondError = (res, status, message) => res.status(status).json({ success: false, message });
const isObjectId = (value) => mongoose.isValidObjectId(value);

const createPortfolioItem = async (req, res, next) => {
  try {
    const { serviceType, eventTitle, eventDate, description, images, taggedVenue } = req.body;
    
    if (!['Venue', 'Catering'].includes(serviceType)) return respondError(res, 400, 'Invalid service type.');
    if (!eventTitle || !eventDate || !images || !Array.isArray(images) || images.length === 0) {
      return respondError(res, 400, 'Event title, date, and at least one image are required.');
    }
    
    const parsedDate = new Date(eventDate);
    if (isNaN(parsedDate)) return respondError(res, 400, 'Invalid event date.');

    const item = await Portfolio.create({
      vendor: req.user.id,
      serviceType,
      eventTitle: eventTitle.trim(),
      eventDate: parsedDate,
      description: description?.trim(),
      images,
      taggedVenue: isObjectId(taggedVenue) ? taggedVenue : undefined,
    });

    return res.status(201).json({ success: true, message: 'Portfolio item added.', data: item });
  } catch (error) {
    return next(error);
  }
};

const getVendorPortfolio = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.vendorId)) return respondError(res, 400, 'Invalid vendor ID.');
    const items = await Portfolio.find({ vendor: req.params.vendorId, isApproved: true })
      .populate('taggedVenue', 'venueName')
      .sort({ eventDate: -1 })
      .lean();
    return res.json({ success: true, data: items });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPortfolioItem,
  getVendorPortfolio,
};
