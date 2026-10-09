const mongoose = require('mongoose');

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

const quotationSchema = new mongoose.Schema(
  {
    baseVenuePrice: { type: Number, min: 0, required: true },
    eventsBreakdown: [quotationEventBreakdownSchema],
    perEventTotal: { type: Number, min: 0, default: 0 },
    extraCharges: { type: Number, min: 0, required: true, default: 0 },
    additionalServiceCharges: { type: Number, min: 0, default: 0 },
    cateringCharges: { type: Number, min: 0, default: 0 },
    decorationCharges: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    subtotal: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    extraChargeDetails: { type: String, trim: true, maxlength: 500, default: '' },
    estimatedTotal: { type: Number, min: 0, required: true },
    advancePercentage: { type: Number, min: 0, max: 100, required: true },
    advanceAmount: { type: Number, min: 0, required: true },
    remainingAmount: { type: Number, min: 0, required: true },
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
    createdAt: { type: Date },
    updatedAt: { type: Date },
    sentAt: { type: Date, required: true },
    respondedAt: { type: Date },
  },
  { _id: false, timestamps: true }
);

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
    eventDate: { type: Date, required: true },
    guestCount: { type: Number, required: true, min: 1, validate: Number.isInteger },
    eventType: {
      type: String,
      required: true,
    },
    eventSchedule: [eventScheduleItemSchema],
    message: { type: String, trim: true, maxlength: 2000, default: '' },
    estimatedPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'visit_requested', 'visit_scheduled', 'accepted', 'quotation_sent', 'revision_requested', 'confirmed', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
    visitDate: { type: Date },
    visitStatus: { type: String, enum: ['pending', 'confirmed', 'completed', 'rescheduled'] },
    cancellationReason: { type: String, trim: true, maxlength: 1000 },
    cancelledBy: { type: String, enum: ['user', 'vendor', 'admin'] },
    cancelledAt: { type: Date },
    vendorResponse: { type: String, trim: true, maxlength: 1000 },
    quotationStatus: { type: String, enum: ['draft', 'sent', 'viewed', 'accepted', 'revision_requested', 'rejected', 'expired'], default: 'draft' },
    quotation: { type: quotationSchema, default: undefined },
    lifecycleEvents: {
      type: [{
        type: { type: String, required: true, maxlength: 50 },
        actorRole: { type: String, enum: ['user', 'vendor', 'admin'], required: true },
        actorId: { type: mongoose.Schema.Types.ObjectId, required: true },
        message: { type: String, trim: true, maxlength: 1000, default: '' },
        occurredAt: { type: Date, required: true, default: Date.now },
      }],
      default: [],
    },
  },
  { timestamps: true }
);

bookingSchema.index(
  { venue: 1, eventDate: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['accepted', 'confirmed'] } },
    name: 'one_confirmed_booking_per_venue_date',
  }
);
bookingSchema.index({ vendor: 1, eventDate: 1, status: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('VenueBooking', bookingSchema);
