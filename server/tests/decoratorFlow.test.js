const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/User');
const Vendor = require('../src/models/Vendor');
const Decorator = require('../src/models/Decorator');
const DecoratorEnquiry = require('../src/models/DecoratorEnquiry');
const Notification = require('../src/models/Notification');
const {
  createDecorator,
  listAdminDecorators,
  moderateDecorator,
  listPublicDecorators,
} = require('../src/controllers/decoratorController');
const {
  createEnquiry,
  getVendorEnquiries,
  getUserEnquiries,
  respondEnquiry,
} = require('../src/controllers/decoratorEnquiryController');

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

const dateAfterDays = (days) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

test('Wedding Decorator lifecycle: Vendor creation, Admin moderation, User discovery, Enquiry & Response flow', async () => {
  const mongo = await MongoMemoryServer.create();
  try {
    await mongoose.connect(mongo.getUri());
    await Decorator.syncIndexes();
    await DecoratorEnquiry.syncIndexes();

    // Setup Users
    const vendorUser = await Vendor.create({
      name: 'Priya Patel',
      email: 'decorator.vendor@example.test',
      password: 'hashed-password',
      businessName: 'Dream Decor Events',
      phone: '9876543210',
      role: 'vendor',
      isEmailVerified: true,
    });

    const customerUser = await User.create({
      name: 'Rohan Sharma',
      email: 'rohan@example.test',
      password: 'hashed-password',
      role: 'user',
      phone: '9123456789',
      isEmailVerified: true,
    });

    // TEST 1 — Vendor Creates Decorator Service
    const createRes = await invoke(createDecorator, {
      user: { id: vendorUser._id.toString(), role: 'vendor' },
      body: {
        businessName: 'Dream Decor Events',
        description: 'Complete wedding decoration including mandap, stage, floral, and lighting.',
        contactNumber: '9876543210',
        email: 'decorator.vendor@example.test',
        city: 'Surat',
        area: 'Vesu',
        yearsOfExperience: 8,
        decorationServices: ['Wedding Decoration', 'Mandap Decoration', 'Stage Decoration', 'Floral Decoration'],
        decorationStyles: ['Luxury', 'Traditional', 'Floral'],
        decorRequirements: { mandapAvailable: true, stageAvailable: true, floralDecoration: true, lighting: true },
        eventTypes: ['Wedding', 'Reception', 'Engagement'],
        venueTypes: ['Banquet Hall', 'Resort', 'Lawn'],
        startingPrice: 75000,
        pricingType: 'Custom Quote',
        minGuests: 100,
        maxGuests: 1000,
        serviceAreas: ['Surat', 'Navsari'],
        coverImage: 'https://example.com/cover.jpg',
      },
    });

    assert.equal(createRes.statusCode, 201);
    assert.equal(createRes.body.success, true);
    assert.equal(createRes.body.data.approvalStatus, 'pending');
    const decoratorId = createRes.body.data._id.toString();

    // TEST 2 — Public search should NOT show pending decorator
    const publicPreRes = await invoke(listPublicDecorators, { query: {} });
    assert.equal(publicPreRes.body.data.length, 0);

    // TEST 3 — Admin Moderate Accept Decorator
    const adminApproveRes = await invoke(moderateDecorator, {
      params: { id: decoratorId },
      body: { status: 'approved' },
    });
    assert.equal(adminApproveRes.statusCode, 200);
    assert.equal(adminApproveRes.body.data.approvalStatus, 'approved');

    // Verify Notification to Vendor for approval
    const vendorNotif = await Notification.findOne({ recipient: vendorUser._id });
    assert.ok(vendorNotif);
    assert.match(vendorNotif.message, /approved/i);

    // TEST 4 — Public search SHOULD show approved decorator
    const publicPostRes = await invoke(listPublicDecorators, { query: { city: 'Surat' } });
    assert.equal(publicPostRes.body.data.length, 1);
    assert.equal(publicPostRes.body.data[0].businessName, 'Dream Decor Events');

    const eventDates = [dateAfterDays(30), dateAfterDays(31), dateAfterDays(32)];
    const eventSchedule = [
      {
        eventType: 'Mehendi',
        eventDate: eventDates[0],
        startTime: '10:00',
        endTime: '14:00',
        guestCount: 120,
        decorationsRequired: ['Floral Decoration', 'Welcome Area'],
        style: 'Pastel',
        budget: '₹25,000 – ₹50,000',
        notes: 'Garden setup.',
      },
      {
        eventType: 'Wedding',
        eventDate: eventDates[1],
        startTime: '17:00',
        endTime: '23:00',
        guestCount: 300,
        decorationsRequired: ['Mandap', 'Stage', 'Lighting'],
        style: 'Luxury',
        budget: '₹50,000 – ₹1,00,000',
        notes: 'Floral mandap.',
      },
      {
        eventType: 'Reception',
        eventDate: eventDates[2],
        guestCount: 450,
        decorationsRequired: ['Stage', 'Entrance', 'Table Decoration'],
        style: 'Modern',
        budget: '₹1,00,000 – ₹2,00,000',
      },
    ];

    const invalidScheduleRes = await invoke(createEnquiry, {
      user: { id: customerUser._id.toString(), role: 'user' },
      body: {
        decoratorId,
        eventSchedule: [{ ...eventSchedule[0], eventDate: '2020-01-01' }],
        city: 'Surat',
      },
    });
    assert.equal(invalidScheduleRes.statusCode, 400);

    // TEST 5 — User sends a multi-date decoration enquiry (NO Direct Booking)
    const enquiryRes = await invoke(createEnquiry, {
      user: { id: customerUser._id.toString(), role: 'user', name: customerUser.name, email: customerUser.email, phone: customerUser.phone },
      body: {
        decoratorId,
        eventType: eventSchedule[0].eventType,
        eventDate: eventSchedule[0].eventDate,
        eventSchedule,
        city: 'Surat',
        venueName: 'Royal Palace Banquet',
        venueType: 'Banquet Hall',
        guestCount: eventSchedule[0].guestCount,
        decorationsRequired: eventSchedule[0].decorationsRequired,
        style: eventSchedule[0].style,
        budget: '₹50,000 – ₹1,00,000',
        message: 'I need floral mandap decoration and warm lighting for 300 guests.',
      },
    });

    assert.equal(enquiryRes.statusCode, 201);
    assert.equal(enquiryRes.body.success, true);
    assert.equal(enquiryRes.body.data.status, 'sent');
    assert.equal(enquiryRes.body.data.eventSchedule.length, 3);
    assert.equal(enquiryRes.body.data.eventSchedule[0].eventType, 'Mehendi');
    assert.equal(enquiryRes.body.data.eventSchedule[1].guestCount, 300);
    assert.equal(enquiryRes.body.data.eventSchedule[2].decorationsRequired.includes('Entrance'), true);
    const enquiryId = enquiryRes.body.data._id.toString();

    // Verify Notification to Vendor for enquiry
    const vendorEnquiryNotif = await Notification.findOne({ recipient: vendorUser._id, message: /enquiry received/i });
    assert.ok(vendorEnquiryNotif);

    // TEST 6 — Vendor Views & Responds to Enquiry
    const vendorEnquiriesRes = await invoke(getVendorEnquiries, {
      user: { id: vendorUser._id.toString(), role: 'vendor' },
    });
    assert.equal(vendorEnquiriesRes.body.data.length, 1);
    assert.equal(vendorEnquiriesRes.body.data[0].eventSchedule.length, 3);

    const respondRes = await invoke(respondEnquiry, {
      user: { id: vendorUser._id.toString(), role: 'vendor' },
      params: { id: enquiryId },
      body: {
        availabilityStatus: 'available',
        estimatedPrice: 85000,
        vendorMessage: 'We can provide the requested floral mandap, stage and lighting for ₹85,000.',
      },
    });

    assert.equal(respondRes.statusCode, 200);
    assert.equal(respondRes.body.data.status, 'responded');
    assert.equal(respondRes.body.data.response.estimatedPrice, 85000);

    // Verify Notification to User for vendor response
    const userResNotif = await Notification.findOne({ recipient: customerUser._id });
    assert.ok(userResNotif);
    assert.match(userResNotif.message, /responded to your/i);

    // TEST 7 — User lists their enquiries
    const userEnquiriesRes = await invoke(getUserEnquiries, {
      user: { id: customerUser._id.toString(), role: 'user' },
    });
    assert.equal(userEnquiriesRes.body.data.length, 1);
    assert.equal(userEnquiriesRes.body.data[0].status, 'responded');
    assert.equal(userEnquiriesRes.body.data[0].eventSchedule.length, 3);
    assert.equal(userEnquiriesRes.body.data[0].eventSchedule[2].eventType, 'Reception');

    // TEST 8 — Admin Rejection Flow with Reason
    const rejectRes = await invoke(moderateDecorator, {
      params: { id: decoratorId },
      body: { status: 'rejected', rejectionReason: 'Please upload clearer portfolio images.' },
    });
    assert.equal(rejectRes.statusCode, 200);
    assert.equal(rejectRes.body.data.approvalStatus, 'rejected');
    assert.equal(rejectRes.body.data.rejectionReason, 'Please upload clearer portfolio images.');
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});
