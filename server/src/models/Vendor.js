const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    businessDescription: { type: String, trim: true, maxlength: 2000, default: '' },
    businessLocation: { type: String, trim: true, maxlength: 160, default: '' },
    yearsOfExperience: {
      type: Number,
      min: 0,
      max: 100,
      validate: (value) => value === null || Number.isInteger(value),
      default: null,
    },
    profileImage: { type: String, trim: true, maxlength: 2048, default: '' },
    publicContact: { type: String, trim: true, maxlength: 100, default: '' },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'vendor', 'admin'],
      default: 'vendor',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vendor', vendorSchema);
