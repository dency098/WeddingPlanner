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
    decorationsRequired: { type: [String], default: [] },
    style: { type: String, default: '' },
    budget: { type: String, default: '' },
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

const decoratorQuotationSchema = new mongoose.Schema(
  {
    baseDecorationPrice: { type: Number, min: 0, default: 0 },
    eventsBreakdown: [quotationEventBreakdownSchema],
    perEventTotal: { type: Number, min: 0, default: 0 },
    additionalServiceCharges: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    subtotal: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    estimatedTotal: { type: Number, min: 0, required: true },
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
    userRevisionNotes: { type: String, trim: true, default: '' },
    sentAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
  },
  { _id: false, timestamps: true }
);

const decoratorEnquirySchema = new mongoose.Schema(
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
    decorator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Decorator',
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
    venueName: {
      type: String,
      default: '',
    },
    venueType: {
      type: String,
      default: '',
    },
    guestCount: {
      type: Number,
      required: true,
      min: 1,
    },
    decorationsRequired: {
      type: [String],
      default: [],
    },
    style: {
      type: String,
      default: '',
    },
    budget: {
      type: String,
      default: '',
    },
    customBudget: {
      type: Number,
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
    status: {
      type: String,
      enum: ['sent', 'viewed', 'responded', 'quotation_sent', 'accepted', 'revision_requested', 'rejected', 'closed', 'cancelled'],
      default: 'sent',
      index: true,
    },
    quotation: {
      type: decoratorQuotationSchema,
      default: undefined,
    },
    response: {
      type: responseSchema,
      default: undefined,
    },
  },
  { timestamps: true }
);

decoratorEnquirySchema.index({ user: 1, createdAt: -1 });
decoratorEnquirySchema.index({ vendor: 1, status: 1 });

module.exports = mongoose.model('DecoratorEnquiry', decoratorEnquirySchema);
