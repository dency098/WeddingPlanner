const mongoose = require('mongoose');
const Decorator = require('../models/Decorator');
const Notification = require('../models/Notification');

const respondError = (res, status, message) => res.status(status).json({ success: false, message });
const isObjectId = (value) => mongoose.isValidObjectId(value);

const publicDecoratorFilter = { approvalStatus: 'approved', isActive: true };

const validateDecoratorInput = (body) => {
  const errors = {};
  const requiredText = ['businessName', 'description', 'contactNumber', 'email', 'city'];
  for (const key of requiredText) {
    if (!body[key] || typeof body[key] !== 'string' || !body[key].trim()) {
      errors[key] = `${key} is required.`;
    }
  }

  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.email = 'Please provide a valid email address.';
  }

  const numericFields = ['startingPrice', 'yearsOfExperience'];
  for (const field of numericFields) {
    if (body[field] !== undefined && body[field] !== '') {
      const number = Number(body[field]);
      if (!Number.isFinite(number) || number < 0) {
        errors[field] = `${field} must be a valid non-negative number.`;
      }
    }
  }

  if (!body.startingPrice && body.startingPrice !== 0) {
    errors.startingPrice = 'Starting price is required.';
  }

  if (!Array.isArray(body.decorationServices) || body.decorationServices.length === 0) {
    errors.decorationServices = 'Select at least one decoration service.';
  }

  return errors;
};

const pickFields = (body, fields) =>
  Object.fromEntries(
    fields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]])
  );

const editableFields = [
  'businessName',
  'description',
  'contactNumber',
  'email',
  'city',
  'area',
  'yearsOfExperience',
  'decorationServices',
  'decorationStyles',
  'decorRequirements',
  'eventTypes',
  'venueTypes',
  'startingPrice',
  'pricingType',
  'minBudget',
  'maxBudget',
  'customQuoteAvailable',
  'packages',
  'addOns',
  'minGuests',
  'maxGuests',
  'serviceAreas',
  'availableForBooking',
  'availableDates',
  'coverImage',
  'gallery',
  'cancellationPolicy',
  'advancePayment',
  'termsAndConditions',
];

const listPublicDecorators = async (req, res, next) => {
  try {
    const { city, style, eventType, search, maxPrice } = req.query;
    const filter = { ...publicDecoratorFilter };

    if (city) {
      filter.city = new RegExp(city.trim(), 'i');
    }
    if (style) {
      filter.decorationStyles = { $in: [style] };
    }
    if (eventType) {
      filter.eventTypes = { $in: [eventType] };
    }
    if (maxPrice) {
      filter.startingPrice = { $lte: Number(maxPrice) };
    }
    if (search) {
      filter.$or = [
        { businessName: new RegExp(search.trim(), 'i') },
        { description: new RegExp(search.trim(), 'i') },
        { city: new RegExp(search.trim(), 'i') },
      ];
    }

    const decorators = await Decorator.find(filter)
      .populate('vendor', 'name businessName email phone')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: decorators });
  } catch (error) {
    return next(error);
  }
};

const getPublicDecorator = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid decorator ID.');
    const decorator = await Decorator.findOne({ _id: req.params.id, ...publicDecoratorFilter })
      .populate('vendor', 'name businessName email phone')
      .lean();

    if (!decorator) return respondError(res, 404, 'Decorator service not found or not currently available.');
    return res.json({ success: true, data: decorator });
  } catch (error) {
    return next(error);
  }
};

const listVendorDecorators = async (req, res, next) => {
  try {
    const decorators = await Decorator.find({ vendor: req.user.id })
      .sort({ updatedAt: -1 })
      .lean();
    return res.json({ success: true, data: decorators });
  } catch (error) {
    return next(error);
  }
};

const getVendorDecorator = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid decorator ID.');
    const decorator = await Decorator.findOne({ _id: req.params.id, vendor: req.user.id }).lean();
    if (!decorator) return respondError(res, 404, 'Decorator service not found.');
    return res.json({ success: true, data: decorator });
  } catch (error) {
    return next(error);
  }
};

const createDecorator = async (req, res, next) => {
  try {
    const errors = validateDecoratorInput(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, message: 'Please correct the decorator details.', errors });
    }
    const data = pickFields(req.body, editableFields);
    const decorator = await Decorator.create({
      ...data,
      vendor: req.user.id,
      approvalStatus: 'pending',
    });

    return res.status(201).json({ success: true, message: 'Decorator service submitted for approval.', data: decorator });
  } catch (error) {
    return next(error);
  }
};

const updateDecorator = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid decorator ID.');
    const errors = validateDecoratorInput(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, message: 'Please correct the decorator details.', errors });
    }

    const data = pickFields(req.body, editableFields);
    const decorator = await Decorator.findOne({ _id: req.params.id, vendor: req.user.id });
    if (!decorator) return respondError(res, 404, 'Decorator service not found.');

    Object.assign(decorator, data, { approvalStatus: 'pending', rejectionReason: '' });
    await decorator.save();

    return res.json({ success: true, message: 'Decorator service updated and resubmitted for approval.', data: decorator });
  } catch (error) {
    return next(error);
  }
};

const deleteDecorator = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid decorator ID.');
    const decorator = await Decorator.findOneAndDelete({ _id: req.params.id, vendor: req.user.id });
    if (!decorator) return respondError(res, 404, 'Decorator service not found.');
    return res.json({ success: true, message: 'Decorator service deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};

const updateVendorStatus = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid decorator ID.');
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') return respondError(res, 400, 'isActive must be a boolean.');

    const decorator = await Decorator.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user.id },
      { isActive },
      { new: true }
    );
    if (!decorator) return respondError(res, 404, 'Decorator service not found.');
    return res.json({ success: true, message: `Decorator service ${isActive ? 'activated' : 'deactivated'}.`, data: decorator });
  } catch (error) {
    return next(error);
  }
};

const listAdminDecorators = async (req, res, next) => {
  try {
    const { approvalStatus } = req.query;
    const filter = {};
    if (approvalStatus) {
      if (!['pending', 'approved', 'rejected', 'disabled'].includes(approvalStatus)) {
        return respondError(res, 400, 'Invalid approval status.');
      }
      filter.approvalStatus = approvalStatus;
    }

    const decorators = await Decorator.find(filter)
      .populate('vendor', 'name businessName email phone')
      .sort({ createdAt: -1 })
      .lean();

    const stats = {
      total: await Decorator.countDocuments(),
      pending: await Decorator.countDocuments({ approvalStatus: 'pending' }),
      approved: await Decorator.countDocuments({ approvalStatus: 'approved' }),
      rejected: await Decorator.countDocuments({ approvalStatus: 'rejected' }),
      disabled: await Decorator.countDocuments({ approvalStatus: 'disabled' }),
    };

    return res.json({ success: true, data: decorators, stats });
  } catch (error) {
    return next(error);
  }
};

const moderateDecorator = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid decorator ID.');
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected', 'disabled'].includes(status)) {
      return respondError(res, 400, 'Status must be approved, rejected, or disabled.');
    }

    const decorator = await Decorator.findById(req.params.id);
    if (!decorator) return respondError(res, 404, 'Decorator service not found.');

    decorator.approvalStatus = status;
    if (status === 'rejected') {
      decorator.rejectionReason = rejectionReason || 'Information provided did not meet requirements.';
    } else {
      decorator.rejectionReason = '';
    }
    await decorator.save();

    // Create Notification for vendor
    let notifMessage = '';
    if (status === 'approved') {
      notifMessage = `Your Wedding Decorator service "${decorator.businessName}" has been approved.`;
    } else if (status === 'rejected') {
      notifMessage = `Your Wedding Decorator service "${decorator.businessName}" was rejected. Reason: ${decorator.rejectionReason}`;
    } else {
      notifMessage = `Your Wedding Decorator service "${decorator.businessName}" was disabled by admin.`;
    }

    await Notification.create({
      recipient: decorator.vendor,
      recipientRole: 'vendor',
      message: notifMessage,
    });

    return res.json({ success: true, message: `Decorator service ${status}.`, data: decorator });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listPublicDecorators,
  getPublicDecorator,
  listVendorDecorators,
  getVendorDecorator,
  createDecorator,
  updateDecorator,
  deleteDecorator,
  updateVendorStatus,
  listAdminDecorators,
  moderateDecorator,
};

