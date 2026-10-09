const mongoose = require('mongoose');
const Catering = require('../models/Catering');

const respondError = (res, status, message) => res.status(status).json({ success: false, message });
const isObjectId = (value) => mongoose.isValidObjectId(value);

const publicCateringFilter = { approvalStatus: 'approved', isActive: true };

const validateCateringInput = (body) => {
  const errors = {};
  const requiredText = ['companyName', 'contactPerson', 'dietaryType'];
  for (const key of requiredText) {
    if (!body[key] || typeof body[key] !== 'string' || !body[key].trim()) {
      errors[key] = `${key} is required.`;
    }
  }

  if (body.dietaryType && !['Veg', 'Non-Veg', 'Both'].includes(body.dietaryType)) {
    errors.dietaryType = 'Select a valid dietary type (Veg, Non-Veg, Both).';
  }

  const numericFields = ['minCapacity', 'maxCapacity', 'pricePerPlate'];
  for (const field of numericFields) {
    if (!Object.hasOwn(body, field)) {
      errors[field] = `${field} is required.`;
      continue;
    }
    const number = Number(body[field]);
    if (!Number.isFinite(number) || number < 0) {
      errors[field] = `${field} must be a valid non-negative number.`;
    }
  }

  if (!errors.minCapacity && !errors.maxCapacity && Number(body.maxCapacity) < Number(body.minCapacity)) {
    errors.maxCapacity = 'Maximum capacity must be greater than or equal to minimum capacity.';
  }

  return errors;
};

const pickFields = (body, fields) => Object.fromEntries(fields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]]));
const editableFields = [
  'venue', 'companyName', 'contactPerson', 'contactPhone', 'contactEmail', 'city', 'area', 'address',
  'menuPdf', 'description', 'minCapacity', 'maxCapacity', 'destinationCatering', 'dietaryType', 
  'pricePerPlate', 'minOrder', 'maxBudget', 'customQuoteAvailable', 'extraTravelCharge', 'serviceCharge',
  'termsAndConditions', 'cancellationPolicy', 'advancePayment', 'staffingOptions', 'operationalLocations',
  'yearsOfExperience', 'fssaiLicense', 'awards', 'cateringTypes', 'cuisines', 'foodPreferences',
  'mealTypes', 'eventTypes', 'packages', 'menuItems', 'liveCounters', 'serviceInclusions',
  'additionalServices', 'coverImage', 'gallery', 'capacityPerDay'
];

const listPublicCatering = async (req, res, next) => {
  try {
    const filter = { ...publicCateringFilter };
    const caterings = await Catering.find(filter)
      .populate('vendor', 'name businessName')
      .populate('venue', 'venueName city state')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: caterings });
  } catch (error) {
    return next(error);
  }
};

const listVendorCatering = async (req, res, next) => {
  try {
    const caterings = await Catering.find({ vendor: req.user.id })
      .populate('venue', 'venueName')
      .sort({ updatedAt: -1 })
      .lean();
    return res.json({ success: true, data: caterings });
  } catch (error) {
    return next(error);
  }
};

const listAdminCatering = async (req, res, next) => {
  try {
    const { approvalStatus } = req.query;
    const filter = {};
    if (approvalStatus) {
      if (!['pending', 'approved', 'rejected', 'disabled'].includes(approvalStatus)) {
        return respondError(res, 400, 'Invalid approval status.');
      }
      filter.approvalStatus = approvalStatus;
    }
    const caterings = await Catering.find(filter)
      .populate('vendor', 'name businessName email')
      .populate('venue', 'venueName')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: caterings });
  } catch (error) {
    return next(error);
  }
};

const createCatering = async (req, res, next) => {
  try {
    const errors = validateCateringInput(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, message: 'Please correct the catering details.', errors });
    }
    const data = pickFields(req.body, editableFields);
    const catering = await Catering.create({ ...data, vendor: req.user.id, approvalStatus: 'pending' });
    return res.status(201).json({ success: true, message: 'Catering service submitted for review.', data: catering });
  } catch (error) {
    return next(error);
  }
};

const updateCatering = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid catering ID.');
    const data = pickFields(req.body, editableFields);
    if (!Object.keys(data).length) return respondError(res, 400, 'No changes provided.');
    
    // Check validation if required fields are provided
    const catering = await Catering.findOne({ _id: req.params.id, vendor: req.user.id });
    if (!catering) return respondError(res, 404, 'Catering service not found.');
    
    Object.assign(catering, data, { approvalStatus: 'pending' }); // Reset approval status on edit
    await catering.save();
    return res.json({ success: true, message: 'Catering service updated and submitted for review.', data: catering });
  } catch (error) {
    return next(error);
  }
};

const deleteCatering = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid catering ID.');
    const catering = await Catering.findOne({ _id: req.params.id, vendor: req.user.id });
    if (!catering) return respondError(res, 404, 'Catering service not found.');
    await catering.deleteOne();
    return res.json({ success: true, message: 'Catering service deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};

const moderateCatering = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid catering ID.');
    const { approvalStatus, rejectionReason } = req.body;
    if (!['approved', 'rejected', 'disabled'].includes(approvalStatus)) {
      return respondError(res, 400, 'Choose approved, rejected, or disabled.');
    }
    const update = {
      approvalStatus,
      isActive: approvalStatus === 'approved',
      rejectionReason: approvalStatus === 'rejected' ? (rejectionReason || '') : '',
    };
    const catering = await Catering.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!catering) return respondError(res, 404, 'Catering not found.');
    return res.json({ success: true, message: `Catering service ${approvalStatus}.`, data: catering });
  } catch (error) {
    return next(error);
  }
};

const updateVendorStatus = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return respondError(res, 400, 'Invalid catering ID.');
    if (typeof req.body.isActive !== 'boolean') return respondError(res, 400, 'isActive must be a boolean.');
    const catering = await Catering.findOne({ _id: req.params.id, vendor: req.user.id });
    if (!catering) return respondError(res, 404, 'Catering not found.');
    if (catering.approvalStatus !== 'approved' && req.body.isActive) {
      return respondError(res, 409, 'Only approved services can be activated.');
    }
    catering.isActive = req.body.isActive;
    await catering.save();
    return res.json({ success: true, message: 'Catering availability status updated.', data: catering });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listPublicCatering,
  listVendorCatering,
  listAdminCatering,
  createCatering,
  updateCatering,
  deleteCatering,
  moderateCatering,
  updateVendorStatus,
};
