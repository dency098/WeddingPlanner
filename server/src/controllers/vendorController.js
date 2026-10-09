const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const Venue = require('../models/Venue');

const profileFields = [
  'businessName',
  'businessDescription',
  'businessLocation',
  'yearsOfExperience',
  'profileImage',
  'publicContact',
];

const safeProfile = (vendor) => ({
  id: vendor._id.toString(),
  businessName: vendor.businessName,
  businessDescription: vendor.businessDescription || '',
  businessLocation: vendor.businessLocation || '',
  yearsOfExperience: vendor.yearsOfExperience ?? null,
  profileImage: vendor.profileImage || '',
  publicContact: vendor.publicContact || '',
});

const isHttpUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const getPublicVendorProfile = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid vendor ID.' });
    }
    const vendor = await Vendor.findById(req.params.id)
      .select('businessName businessDescription businessLocation yearsOfExperience profileImage publicContact')
      .lean();
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found.' });
    const venues = await Venue.find({
      vendor: vendor._id,
      approvalStatus: 'approved',
      isActive: true,
    }).select('venueName venueType city state coverImage startingPrice priceType').sort({ createdAt: -1 }).lean();
    return res.json({
      success: true,
      data: { ...safeProfile(vendor), venueCount: venues.length, venues },
    });
  } catch (error) {
    return next(error);
  }
};

const getOwnVendorProfile = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.user.id)
      .select('businessName businessDescription businessLocation yearsOfExperience profileImage publicContact')
      .lean();
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found.' });
    return res.json({ success: true, data: safeProfile(vendor) });
  } catch (error) {
    return next(error);
  }
};

const updateOwnVendorProfile = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ success: false, message: 'Profile details must be a JSON object.' });
    }
    const updates = Object.fromEntries(
      profileFields.filter((field) => Object.hasOwn(req.body, field)).map((field) => [field, req.body[field]])
    );
    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'No profile changes were provided.' });
    }
    const errors = {};
    for (const field of ['businessName', 'businessDescription', 'businessLocation', 'profileImage', 'publicContact']) {
      if (!Object.hasOwn(updates, field)) continue;
      if (typeof updates[field] !== 'string') errors[field] = `${field} must be text.`;
      else if (field === 'businessName' && !updates[field].trim()) errors[field] = 'Business name is required.';
      else if (field === 'profileImage' && updates[field] && !isHttpUrl(updates[field])) errors[field] = 'Profile image must be a valid HTTP or HTTPS URL.';
      else if (updates[field].length > ({ businessName: 120, businessDescription: 2000, businessLocation: 160, profileImage: 2048, publicContact: 100 })[field]) {
        errors[field] = `${field} is too long.`;
      }
    }
    if (Object.hasOwn(updates, 'yearsOfExperience') && updates.yearsOfExperience !== '' && updates.yearsOfExperience !== null) {
      const years = Number(updates.yearsOfExperience);
      if (!Number.isInteger(years) || years < 0 || years > 100) {
        errors.yearsOfExperience = 'Years of experience must be a whole number from 0 to 100.';
      } else {
        updates.yearsOfExperience = years;
      }
    } else if (Object.hasOwn(updates, 'yearsOfExperience')) {
      updates.yearsOfExperience = null;
    }
    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, message: 'Please correct the profile details.', errors });
    }
    for (const field of ['businessName', 'businessDescription', 'businessLocation', 'profileImage', 'publicContact']) {
      if (typeof updates[field] === 'string') updates[field] = updates[field].trim();
    }

    const vendor = await Vendor.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    ).select('businessName businessDescription businessLocation yearsOfExperience profileImage publicContact').lean();
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found.' });
    return res.json({ success: true, message: 'Business profile updated.', data: safeProfile(vendor) });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getPublicVendorProfile, getOwnVendorProfile, updateOwnVendorProfile };
