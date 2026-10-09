const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema(
  {
    availabilityStatus: {
      type: String,
      enum: ['available', 'not_available', 'need_more_details'],
      required: true,
    },
    estimatedPrice: {
      type: Number,
      min: 0,
    },
    vendorMessage: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    eventAvailabilities: {
      type: [{
        eventIndex: { type: Number, required: true, min: 0 },
        eventType: { type: String, required: true, trim: true },
        eventDate: { type: Date, required: true },
        status: { type: String, enum: ['available', 'not_available', 'need_more_details'], required: true },
        reason: { type: String, trim: true, maxlength: 500, default: '' },
        alternativeDate: { type: Date },
      }],
      default: [],
    },
    respondedAt: {
      type: Date,
      default: Date.now,
    },
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
    city: { type: String, default: '' },
    venueName: { type: String, default: '' },
    requirements: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const quotationEventBreakdownSchema = new mongoose.Schema(
  {
    eventType: { type: String, default: '' },
    eventDate: { type: Date },
    guestCount: { type: Number, default: 0 },
    charge: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const comprehensiveQuotationSchema = new mongoose.Schema(
  {
    baseVenuePrice: { type: Number, min: 0, default: 0 },
    eventsBreakdown: [quotationEventBreakdownSchema],
    perEventTotal: { type: Number, min: 0, default: 0 },
    additionalServiceCharges: { type: Number, min: 0, default: 0 },
    cateringCharges: { type: Number, min: 0, default: 0 },
    decorationCharges: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    subtotal: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    totalEstimatedAmount: { type: Number, min: 0, required: true },
    advancePercentage: { type: Number, min: 0, max: 100, default: 30 },
    advanceAmount: { type: Number, min: 0, default: 0 },
    remainingAmount: { type: Number, min: 0, default: 0 },
    validUntil: { type: Date },
    paymentTerms: { type: String, trim: true, default: '' },
    vendorNotes: { type: String, trim: true, default: '' },
    termsAndConditions: { type: String, trim: true, default: '' },
    quotationStatus: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'accepted', 'revision_requested', 'rejected', 'expired'],
      default: 'sent',
    },
    revisionNumber: { type: Number, min: 1, default: 1 },
    userRevisionNotes: { type: String, trim: true, default: '' },
    sentAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
  },
  { _id: false, timestamps: true }
);

const venueVisitSchema = new mongoose.Schema(
  {
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true, trim: true },
    visitorCount: { type: Number, required: true, min: 1, validate: Number.isInteger },
    message: { type: String, trim: true, maxlength: 2000, default: '' },
    quotationRevision: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['requested', 'proposed', 'accepted', 'rejected'],
      required: true,
      default: 'requested',
    },
    proposedDate: { type: Date },
    proposedTime: { type: String, trim: true, default: '' },
    vendorMessage: { type: String, trim: true, maxlength: 2000, default: '' },
    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
  },
  { _id: false }
);

const venueEnquirySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    eventSchedule: [eventScheduleItemSchema],
    city: {
      type: String,
      required: true,
    },
    guestCount: {
      type: Number,
      required: true,
      min: 1,
    },
    venueName: {
      type: String,
      default: '',
    },
    preferredVenueType: {
      type: String,
      default: '',
    },
    budget: {
      type: String,
      default: '',
    },
    cateringRequired: {
      type: Boolean,
      default: false,
    },
    decorationRequired: {
      type: Boolean,
      default: false,
    },
    djRequired: {
      type: Boolean,
      default: false,
    },
    numberOfRooms: {
      type: Number,
      min: 0,
      default: 0,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: '',
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userPhone: {
      type: String,
      default: '',
    },
    isTest: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'responded', 'quotation_sent', 'accepted', 'revision_requested', 'rejected', 'closed'],
      default: 'pending',
      index: true,
    },
    quotation: {
      type: comprehensiveQuotationSchema,
      default: undefined,
    },
    response: {
      type: responseSchema,
      default: undefined,
    },
    visit: {
      type: venueVisitSchema,
      default: undefined,
    },
  },
  { timestamps: true }
);

venueEnquirySchema.index({ user: 1, createdAt: -1 });
venueEnquirySchema.index({ vendor: 1, status: 1 });

module.exports = mongoose.model('VenueEnquiry', venueEnquirySchema);
