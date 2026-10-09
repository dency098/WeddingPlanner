const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    recipientRole: { type: String, enum: ['user', 'vendor', 'admin'], required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'VenueBooking', index: true },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, recipientRole: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
