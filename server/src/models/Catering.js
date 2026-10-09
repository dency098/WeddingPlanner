const mongoose = require('mongoose');

const menuPackageSchema = new mongoose.Schema(
  {
    packageName: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    pricePerPlate: { type: Number, required: true, min: 0 },
    includedItems: { type: [String], default: [] },
  },
  { _id: true }
);

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'Main Course' },
    description: { type: String, trim: true, default: '' },
    isVeg: { type: Boolean, default: true },
    isJain: { type: Boolean, default: false },
    price: { type: Number, min: 0 },
  },
  { _id: true }
);

const cateringSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    contactPhone: { type: String, trim: true, default: '' },
    contactEmail: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    area: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    yearsOfExperience: {
      type: Number,
      min: 0,
      default: 0,
    },
    fssaiLicense: {
      type: String,
      trim: true,
      maxlength: 50,
      default: '',
    },
    awards: {
      type: [String],
      default: [],
    },
    cateringTypes: {
      type: [String],
      default: [],
    },
    cuisines: {
      type: [String],
      default: [],
    },
    foodPreferences: {
      type: [String],
      default: [],
    },
    mealTypes: {
      type: [String],
      default: [],
    },
    eventTypes: {
      type: [String],
      default: [],
    },
    capacityPerDay: {
      type: Number,
      min: 1,
      default: 500,
    },
    menuPdf: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: '',
    },
    minCapacity: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isInteger,
    },
    maxCapacity: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isInteger,
    },
    destinationCatering: {
      type: Boolean,
      default: false,
    },
    dietaryType: {
      type: String,
      required: true,
      default: 'Veg',
    },
    pricePerPlate: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrder: { type: Number, min: 0 },
    maxBudget: { type: Number, min: 0 },
    customQuoteAvailable: { type: Boolean, default: true },
    extraTravelCharge: { type: Number, min: 0, default: 0 },
    serviceCharge: { type: Number, min: 0, default: 0 },
    packages: [menuPackageSchema],
    menuItems: [menuItemSchema],
    liveCounters: { type: [String], default: [] },
    serviceInclusions: { type: [String], default: [] },
    additionalServices: { type: [String], default: [] },
    coverImage: { type: String, trim: true, default: '' },
    gallery: { type: [String], default: [] },
    termsAndConditions: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: '',
    },
    cancellationPolicy: { type: String, trim: true, maxlength: 3000, default: '' },
    advancePayment: { type: String, trim: true, default: '' },
    staffingOptions: {
      type: [String],
      default: [],
    },
    operationalLocations: {
      type: [String],
      default: [],
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'disabled'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, trim: true, default: '' },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

cateringSchema.index({ approvalStatus: 1, isActive: 1, pricePerPlate: 1 });
cateringSchema.index({ vendor: 1, createdAt: -1 });

module.exports = mongoose.model('Catering', cateringSchema);
