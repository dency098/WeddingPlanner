const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/User');
const Vendor = require('../src/models/Vendor');
const Venue = require('../src/models/Venue');
const VenueBooking = require('../src/models/VenueBooking');
const Notification = require('../src/models/Notification');
const {
  createBooking,
  createBookingQuotation,
  respondToBookingQuotation,
  cancelUserBooking,
  listVendorBookings,
  completeAdminBooking,
} = require('../src/controllers/bookingController');
const {
  updateOwnVendorProfile,
  getPublicVendorProfile,
} = require('../src/controllers/vendorController');

const invoke = async (handler, req) => {
  const response = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await handler(req, response, (error) => {
    if (error) throw error;
  });
  return response;
};

test('booking quotation, confirmation, cancellation, and notification flow', async () => {
  const mongo = await MongoMemoryServer.create();
  try {
    await mongoose.connect(mongo.getUri());
    await VenueBooking.syncIndexes();

    const vendor = await Vendor.create({
      name: 'Venue Partner',
      email: 'vendor@example.test',
      password: 'hashed-password',
      businessName: 'Royal Wedding Events',
      phone: '0000000000',
      role: 'vendor',
      isEmailVerified: true,
    });
    const user = await User.create({
      name: 'Customer',
      email: 'user@example.test',
      password: 'hashed-password',
      role: 'user',
      isEmailVerified: true,
    });
    const venue = await Venue.create({
      vendor: vendor._id,
      venueName: 'Royal Palace',
      venueType: 'Banquet Hall',
      description: 'Wedding venue',
      city: 'Surat',
      state: 'Gujarat',
      address: 'Venue address',
      minimumGuests: 50,
      maximumGuests: 500,
      seatingCapacity: 500,
      startingPrice: 80000,
      priceType: 'Per Day',
      coverImage: 'https://example.test/venue.jpg',
      cancellationPolicy: 'Please contact the venue about its cancellation policy.',
      approvalStatus: 'approved',
      isActive: true,
    });
    const profileUpdate = await invoke(updateOwnVendorProfile, {
      user: { id: vendor._id.toString(), role: 'vendor' },
      body: {
        businessName: 'Royal Wedding Events',
        businessDescription: 'Wedding venue and event services.',
        businessLocation: 'Surat, Gujarat',
        yearsOfExperience: 12,
        profileImage: 'https://example.test/profile.jpg',
        publicContact: '+910000000000',
      },
    });
    assert.equal(profileUpdate.statusCode, 200);
    const publicProfile = await invoke(getPublicVendorProfile, {
      params: { id: vendor._id.toString() },
    });
    assert.equal(publicProfile.body.data.venueCount, 1);
    assert.equal(publicProfile.body.data.yearsOfExperience, 12);
    assert.equal(publicProfile.body.data.businessLocation, 'Surat, Gujarat');
    assert.equal(Object.hasOwn(publicProfile.body.data, 'email'), false);
    assert.equal(Object.hasOwn(publicProfile.body.data, 'password'), false);
    assert.equal(Object.hasOwn(publicProfile.body.data, 'phone'), false);
    assert.equal(Object.hasOwn(publicProfile.body.data, 'publicContact'), true);

    const eventDate = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

    const created = await invoke(createBooking, {
      user: { id: user._id.toString(), role: 'user' },
      body: { venueId: venue._id.toString(), eventDate, guestCount: 300, eventType: 'Wedding' },
    });
    assert.equal(created.statusCode, 201);
    const bookingId = created.body.data._id.toString();
    assert.equal(created.body.data.status, 'pending');

    const sent = await invoke(createBookingQuotation, {
      user: { id: vendor._id.toString(), role: 'vendor' },
      params: { id: bookingId },
      body: {
        baseVenuePrice: 80000,
        extraCharges: 10000,
        extraChargeDetails: 'Decor and setup',
        advancePercentage: 30,
        vendorMessage: 'We look forward to hosting your wedding.',
        estimatedTotal: 1,
      },
    });
    assert.equal(sent.statusCode, 200);
    assert.equal(sent.body.data.status, 'quotation_sent');
    assert.equal(sent.body.data.quotationStatus, 'sent');
    assert.equal(sent.body.data.quotation.estimatedTotal, 90000);
    assert.equal(sent.body.data.quotation.advanceAmount, 27000);
    assert.equal(sent.body.data.quotation.remainingAmount, 63000);
    assert.notEqual(sent.body.data.quotation.estimatedTotal, 1);
    assert.ok(sent.body.data.quotation.createdAt);
    assert.ok(sent.body.data.quotation.updatedAt);

    const confirmed = await invoke(respondToBookingQuotation, {
      user: { id: user._id.toString(), role: 'user' },
      params: { id: bookingId },
      body: { status: 'accepted' },
    });
    assert.equal(confirmed.statusCode, 200);
    assert.equal(confirmed.body.data.status, 'confirmed');
    assert.equal(confirmed.body.data.quotationStatus, 'accepted');

    const competingBooking = await VenueBooking.create({
      user: user._id,
      vendor: vendor._id,
      venue: venue._id,
      eventDate: new Date(`${eventDate}T00:00:00.000Z`),
      guestCount: 300,
      eventType: 'Wedding',
      estimatedPrice: 80000,
      status: 'quotation_sent',
      quotationStatus: 'sent',
      quotation: {
        baseVenuePrice: 80000,
        extraCharges: 0,
        estimatedTotal: 80000,
        advancePercentage: 0,
        advanceAmount: 0,
        remainingAmount: 80000,
        sentAt: new Date(),
      },
    });
    const duplicateConfirmation = await invoke(respondToBookingQuotation, {
      user: { id: user._id.toString(), role: 'user' },
      params: { id: competingBooking._id.toString() },
      body: { status: 'accepted' },
    });
    assert.equal(duplicateConfirmation.statusCode, 409);

    const missingReason = await invoke(cancelUserBooking, {
      user: { id: user._id.toString(), role: 'user' },
      params: { id: bookingId },
      body: {},
    });
    assert.equal(missingReason.statusCode, 400);

    const cancelled = await invoke(cancelUserBooking, {
      user: { id: user._id.toString(), role: 'user' },
      params: { id: bookingId },
      body: { reason: 'Change of plans' },
    });
    assert.equal(cancelled.statusCode, 200);
    assert.equal(cancelled.body.data.status, 'cancelled');
    assert.equal(cancelled.body.data.cancelledBy, 'user');
    assert.equal(cancelled.body.data.cancellationReason, 'Change of plans');
    assert.equal(cancelled.body.data.venue.cancellationPolicy, 'Please contact the venue about its cancellation policy.');
    assert.ok(cancelled.body.data.cancelledAt);

    const vendorBookings = await invoke(listVendorBookings, {
      user: { id: vendor._id.toString(), role: 'vendor' },
    });
    const visibleCancellation = vendorBookings.body.data.find((booking) => booking._id.toString() === bookingId);
    assert.equal(visibleCancellation.status, 'cancelled');
    assert.equal(visibleCancellation.cancellationReason, 'Change of plans');

    const pastConfirmedBooking = await VenueBooking.create({
      user: user._id,
      vendor: vendor._id,
      venue: venue._id,
      eventDate: new Date(Date.UTC(2020, 0, 1)),
      guestCount: 300,
      eventType: 'Wedding',
      estimatedPrice: 80000,
      status: 'confirmed',
    });
    const completed = await invoke(completeAdminBooking, {
      user: { id: new mongoose.Types.ObjectId().toString(), role: 'admin' },
      params: { id: pastConfirmedBooking._id.toString() },
    });
    assert.equal(completed.statusCode, 200);
    assert.equal(completed.body.data.status, 'completed');
    const completedCancellation = await invoke(cancelUserBooking, {
      user: { id: user._id.toString(), role: 'user' },
      params: { id: pastConfirmedBooking._id.toString() },
      body: { reason: 'Too late' },
    });
    assert.equal(completedCancellation.statusCode, 409);
    assert.equal(await Notification.countDocuments(), 5);
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});
