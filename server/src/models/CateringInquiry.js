const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema(
  {
    availabilityStatus: {
      type: String,
      enum: ['available', 'not_available', 'need_more_details'],
    },
    estimatedPrice: { type: Number, min: 0 },
    pricePerPlate: { type: Number, min: 0 },
    suggestedPackage: { type: String, default: '' },
    vendorMessage: { type: String, trim: true, maxlength: 2000, default: '' },
    respondedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const eventScheduleItemSchema = new mongoose.Schema(
  {
    eventType: { type: String, required: true },
    eventDate: { type: Date, required: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    guestCount: { type: Number, required: true, min: 1 },
    mealTypes: { type: [String], default: [] },
    foodPreference: { type: String, default: '' },
    cuisines: { type: [String], default: [] },
    selectedPackage: { type: String, default: '' },
    liveCounters: { type: [String], default: [] },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const quotationEventBreakdownSchema = new mongoose.Schema(
  {
    eventType: { type: String, default: '' },
    eventDate: { type: Date },
    guestCount: { type: Number, default: 0 },
    pricePerPlate: { type: Number, default: 0, min: 0 },
    charge: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const cateringQuotationSchema = new mongoose.Schema(
  {
    basePackagePrice: { type: Number, min: 0 },
    eventsBreakdown: [quotationEventBreakdownSchema],
    perEventTotal: { type: Number, min: 0, default: 0 },
    customCharges: { type: Number, min: 0, default: 0 },
    customChargeDetails: { type: String, trim: true, maxlength: 1000, default: '' },
    tax: { type: Number, min: 0, default: 0 },
    subtotal: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    estimatedTotal: { type: Number, min: 0 },
    advancePercentage: { type: Number, min: 0, max: 100, default: 30 },
    advanceAmount: { type: Number, min: 0, default: 0 },
    remainingAmount: { type: Number, min: 0, default: 0 },
    validUntil: { type: Date },
    paymentTerms: { type: String, trim: true, default: '' },
    vendorNotes: { type: String, trim: true, default: '' },
    termsAndConditions: { type: String, trim: true, default: '' },
    vendorMessage: { type: String, trim: true, maxlength: 1000, default: '' },
    quotationStatus: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'accepted', 'revision_requested', 'rejected', 'expired'],
      default: 'sent',
    },
    userRevisionNotes: { type: String, trim: true, default: '' },
    sentAt: { type: Date },
    respondedAt: { type: Date },
  },
  { _id: false, timestamps: true }
);

const mealSchema = new mongoose.Schema(
  {
    type: { type: String },
    timings: { type: String, trim: true, maxlength: 100 },
    menuSelection: { type: String, trim: true, maxlength: 1000 },
    customizationRequest: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    date: { type: Date },
    dayCount: { type: Number, default: 1, min: 1 },
    timing: { type: String, trim: true, maxlength: 100 },
    meals: [mealSchema],
  },
  { _id: false }
);

const cateringInquirySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', index: true },
    catering: { type: mongoose.Schema.Types.ObjectId, ref: 'Catering', required: true, index: true },
    totalGuestCount: { type: Number },
    events: [eventSchema],
    eventSchedule: [eventScheduleItemSchema],
    
    // Catering Enquiry Fields
    eventType: { type: String, default: 'Wedding' },
    eventDate: { type: Date },
    city: { type: String, default: '' },
    venueName: { type: String, default: '' },
    venueType: { type: String, default: '' },
    guestCount: { type: Number, default: 100 },
    mealTypes: { type: [String], default: [] },
    foodPreference: { type: String, default: '' },
    cuisines: { type: [String], default: [] },
    selectedPackage: { type: String, default: '' },
    liveCounters: { type: [String], default: [] },
    specialFoodRequirements: { type: String, default: '' },
    dietaryRequirements: { type: String, default: '' },
    budgetPerPlate: { type: Number },
    totalBudget: { type: Number },
    customQuoteRequired: { type: Boolean, default: false },
    message: { type: String, trim: true, maxlength: 3000, default: '' },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    userPhone: { type: String, default: '' },
    isTest: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['pending', 'responded', 'accepted', 'revision_requested', 'rejected', 'closed', 'tasting_requested', 'tasting_scheduled', 'quotation_sent', 'cancelled'],
      default: 'pending',
      index: true,
    },
    tastingDate: { type: Date },
    tastingStatus: { type: String, enum: ['pending', 'confirmed', 'completed', 'rescheduled'] },
    cancellationReason: { type: String, trim: true, maxlength: 1000 },
    cancelledBy: { type: String, enum: ['user', 'vendor', 'admin'] },
    cancelledAt: { type: Date },
    quotation: { type: cateringQuotationSchema, default: undefined },
    response: { type: responseSchema, default: undefined },
  },
  { timestamps: true }
);

cateringInquirySchema.index({ user: 1, createdAt: -1 });
cateringInquirySchema.index({ vendor: 1, status: 1 });

module.exports = mongoose.model('CateringInquiry', cateringInquirySchema);
