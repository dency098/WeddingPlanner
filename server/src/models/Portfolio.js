const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    serviceType: { type: String, enum: ['Venue', 'Catering'], required: true },
    eventTitle: { type: String, required: true, trim: true, maxlength: 120 },
    eventDate: { type: Date, required: true },
    description: { type: String, trim: true, maxlength: 2000 },
    images: { type: [String], required: true, validate: [arr => arr.length > 0, 'At least one image is required'] },
    taggedVenue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' }, // Optional cross-link
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

portfolioSchema.index({ vendor: 1, eventDate: -1 });
portfolioSchema.index({ taggedVenue: 1 });

module.exports = mongoose.model('Portfolio', portfolioSchema);
