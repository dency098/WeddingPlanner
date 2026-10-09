const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    packageName: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    includes: { type: [String], default: [] },
    description: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const decoratorSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    area: {
      type: String,
      trim: true,
      default: '',
    },
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    decorationServices: {
      type: [String],
      default: [],
    },
    decorationStyles: {
      type: [String],
      default: [],
    },
    decorRequirements: {
      mandapAvailable: { type: Boolean, default: false },
      stageAvailable: { type: Boolean, default: false },
      floralDecoration: { type: Boolean, default: false },
      lighting: { type: Boolean, default: false },
      entrance: { type: Boolean, default: false },
      tablesChairs: { type: Boolean, default: false },
      ceilingDecoration: { type: Boolean, default: false },
      backdrop: { type: Boolean, default: false },
      welcomeArea: { type: Boolean, default: false },
    },
    eventTypes: {
      type: [String],
      default: [],
    },
    venueTypes: {
      type: [String],
      default: [],
    },
    startingPrice: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    pricingType: {
      type: String,
      enum: ['Per Event', 'Decoration Package', 'Custom Quote'],
      default: 'Custom Quote',
    },
    minBudget: {
      type: Number,
      min: 0,
    },
    maxBudget: {
      type: Number,
      min: 0,
    },
    customQuoteAvailable: {
      type: Boolean,
      default: true,
    },
    packages: [packageSchema],
    addOns: {
      type: [String],
      default: [],
    },
    minGuests: {
      type: Number,
      min: 1,
      default: 50,
    },
    maxGuests: {
      type: Number,
      min: 1,
      default: 1000,
    },
    serviceAreas: {
      type: [String],
      default: [],
    },
    availableForBooking: {
      type: Boolean,
      default: true,
    },
    availableDates: {
      type: [Date],
      default: [],
    },
    coverImage: {
      type: String,
      trim: true,
      default: '',
    },
    gallery: {
      type: [String],
      default: [],
    },
    cancellationPolicy: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: '',
    },
    advancePayment: {
      type: String,
      trim: true,
      default: '',
    },
    termsAndConditions: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: '',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'disabled'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

decoratorSchema.index({ approvalStatus: 1, isActive: 1, city: 1, startingPrice: 1 });
decoratorSchema.index({ vendor: 1, createdAt: -1 });

module.exports = mongoose.model('Decorator', decoratorSchema);

