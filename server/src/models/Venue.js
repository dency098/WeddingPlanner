const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    venueName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    venueType: {
      type: String,
      required: true,
      trim: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    contactPhone: { type: String, trim: true, default: '' },
    contactEmail: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, maxlength: 160 },
    city: { type: String, required: true, trim: true, maxlength: 100, index: true },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    area: { type: String, trim: true, default: '' },
    landmark: { type: String, trim: true, default: '' },
    minimumGuests: { type: Number, required: true, min: 1, validate: Number.isInteger },
    maximumGuests: { type: Number, required: true, min: 1, validate: Number.isInteger },
    floatingCapacity: { type: Number, min: 1 },
    seatingCapacity: { type: Number, required: true, min: 1 },
    parkingCapacity: { type: Number, min: 0, default: 0 },
    numberOfRooms: { type: Number, min: 0, default: 0 },
    spaces: {
      type: [{
        spaceType: { type: String },
        seatingCapacity: { type: Number, min: 0 },
        floatingCapacity: { type: Number, min: 0 }
      }],
      default: []
    },
    baseRentalFee: { type: Number, min: 0, default: 0 },
    decorationPolicy: { type: String, default: 'In-house only' },
    cateringPolicy: { type: String, default: 'In-house only' },
    alcoholPolicy: { type: String, trim: true, maxlength: 500 },
    startingPrice: { type: Number, required: true, min: 0, index: true },
    priceType: { type: String, required: true, default: 'Per Day' },
    advancePaymentPercentage: { type: String, trim: true, default: '' },
    additionalCharges: [
      {
        name: { type: String, trim: true, maxlength: 100 },
        amount: { type: Number, min: 0 },
      },
    ],
    eventTypes: {
      type: [String],
      default: [],
    },
    facilities: {
      type: [String],
      default: [],
    },
    amenities: {
      changingRooms: { type: Number, min: 0, default: 0 },
      generatorBackup: { type: Boolean, default: false },
      valetParking: { type: Number, min: 0, default: 0 },
      acRooms: { type: Number, min: 0, default: 0 },
      wheelchairAccessible: { type: Boolean, default: false }
    },
    coverImage: { type: String, required: true, trim: true },
    gallery: { type: [String], default: [] },
    venueVideo: { type: String, trim: true, default: '' },
    cancellationPolicy: { type: String, trim: true, maxlength: 3000, default: '' },
    advancePayment: { type: Number, min: 0, default: 0 },
    eventDuration: { type: Number, min: 1, default: 8 },
    termsAndConditions: { type: String, trim: true, maxlength: 5000, default: '' },
    blockedDates: { type: [Date], default: [] },
    blockedDateDetails: {
      type: [
        {
          date: { type: Date, required: true },
          reason: { type: String, trim: true, default: 'Manually blocked' },
        },
      ],
      default: [],
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'disabled'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

venueSchema.index({ approvalStatus: 1, isActive: 1, city: 1, venueType: 1, startingPrice: 1 });
venueSchema.index({ vendor: 1, createdAt: -1 });

venueSchema.pre('validate', function validateGuestCapacity() {
  if (this.maximumGuests < this.minimumGuests) {
    this.invalidate('maximumGuests', 'Maximum guests must be greater than or equal to minimum guests.');
  }
});

module.exports = mongoose.model('Venue', venueSchema);
