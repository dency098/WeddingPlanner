const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    serviceType: { type: String, enum: ['Venue', 'Catering'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Booking or Inquiry ID
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, trim: true, maxlength: 2000, required: true },
    verifiedBooking: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: true }, // Can be used by admin to hide inappropriate reviews
  },
  { timestamps: true }
);

reviewSchema.index({ vendor: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
