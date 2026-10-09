const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/User');
const Vendor = require('../src/models/Vendor');
const Venue = require('../src/models/Venue');
const Catering = require('../src/models/Catering');
const Decorator = require('../src/models/Decorator');
const VenueEnquiry = require('../src/models/VenueEnquiry');
const VenueBooking = require('../src/models/VenueBooking');
const CateringInquiry = require('../src/models/CateringInquiry');
const DecoratorEnquiry = require('../src/models/DecoratorEnquiry');

const {
  createEnquiry: createVenueEnquiry,
  getVendorEnquiries: getVendorVenueEnquiries,
  createOrUpdateQuotation: createVenueQuotation,
  respondToQuotationUser: respondVenueQuotationUser,
  respondEnquiry: respondVenueEnquiry,
  requestEnquiryVisit,
  respondToEnquiryVisit,
  confirmEnquiryVisitProposal,
  getUserEnquiries: getUserVenueEnquiries,
} = require('../src/controllers/venueEnquiryController');

const {
  checkAvailability,
  updateAvailability,
} = require('../src/controllers/venueController');

const {
  createInquiry: createCateringInquiry,
  sendQuotation: sendCateringQuotation,
} = require('../src/controllers/cateringInquiryController');

const {
  createEnquiry: createDecoratorEnquiry,
  sendQuotation: sendDecoratorQuotation,
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

test('End-to-End Multi-Date Wedding Schedule, Quotations, and Venue Availability', async () => {
  const mongo = await MongoMemoryServer.create();
  try {
    await mongoose.connect(mongo.getUri());

    const vendor = await Vendor.create({
      name: 'Grand Hospitality Vendor',
      email: 'grandvendor@example.test',
      password: 'hashed-password',
      businessName: 'Grand Celebrations',
      phone: '9876543210',
      role: 'vendor',
      isEmailVerified: true,
    });

    const user = await User.create({
      name: 'Priya Sharma',
      email: 'priya@example.test',
      password: 'hashed-password',
      role: 'user',
      isEmailVerified: true,
    });

    const venue = await Venue.create({
      vendor: vendor._id,
      venueName: 'Grand Heritage Palace',
      venueType: 'Banquet Hall',
      description: 'Luxury wedding destination palace',
      city: 'Surat',
      state: 'Gujarat',
      address: 'Ring Road, Surat',
      minimumGuests: 100,
      maximumGuests: 1000,
      seatingCapacity: 1000,
      startingPrice: 100000,
      priceType: 'Per Day',
      coverImage: 'https://example.test/palace.jpg',
      approvalStatus: 'approved',
      isActive: true,
    });

    const catering = await Catering.create({
      vendor: vendor._id,
      companyName: 'Royal Feast Caterers',
      contactPerson: 'Master Chef',
      description: 'Gourmet wedding catering',
      minCapacity: 50,
      maxCapacity: 1200,
      capacityPerDay: 2000,
      dietaryType: 'Veg',
      pricePerPlate: 850,
      coverImage: 'https://example.test/catering.jpg',
      approvalStatus: 'approved',
      isActive: true,
    });

    const decorator = await Decorator.create({
      vendor: vendor._id,
      businessName: 'Dream Decorators',
      description: 'Luxury floral and theme mandap decor',
      contactNumber: '9876543210',
      email: 'decorator@example.test',
      city: 'Surat',
      startingPrice: 50000,
      coverImage: 'https://example.test/decor.jpg',
      approvalStatus: 'approved',
      isActive: true,
    });

    // TEST 1 — Multi-Date Wedding Schedule Submission across Venue, Catering, and Decorator Enquiries
    const eventDates = [dateAfterDays(45), dateAfterDays(46), dateAfterDays(47)];
    const schedule = [
      {
        eventType: 'Sangeet / DJ Night',
        eventDate: eventDates[0],
        guestCount: 250,
        city: 'Surat',
        requirements: 'Stage decor & dinner buffet',
        notes: 'Pre-wedding party',
      },
      {
        eventType: 'Wedding Ceremony',
        eventDate: eventDates[1],
        guestCount: 500,
        city: 'Surat',
        requirements: 'Mandap, traditional thali & floral arrangement',
        notes: 'Main wedding event',
      },
      {
        eventType: 'Reception',
        eventDate: eventDates[2],
        guestCount: 750,
        city: 'Surat',
        requirements: 'Grand entrance & live dessert counters',
        notes: 'Post-wedding reception',
      },
    ];

    const venueEnqRes = await invoke(createVenueEnquiry, {
      user: { id: user._id.toString(), role: 'user' },
      body: {
        venueId: venue._id.toString(),
        eventSchedule: schedule,
        city: 'Surat',
        budget: '₹5,00,000 – ₹10,00,000',
        cateringRequired: true,
        decorationRequired: true,
        message: 'Requesting venue availability for all 3 wedding days.',
      },
    });

    assert.equal(venueEnqRes.statusCode, 201);
    assert.equal(venueEnqRes.body.data.eventSchedule.length, 3);
    assert.equal(venueEnqRes.body.data.userName, 'Priya Sharma');

    const cateringEnqRes = await invoke(createCateringInquiry, {
      user: { id: user._id.toString(), role: 'user' },
      body: {
        cateringId: catering._id.toString(),
        eventSchedule: schedule,
        city: 'Surat',
        foodPreference: 'Veg',
        cuisines: ['Gujarati', 'Punjabi', 'Mexican'],
        message: 'Multi-date catering quote needed.',
      },
    });

    assert.equal(cateringEnqRes.statusCode, 201);
    assert.equal(cateringEnqRes.body.data.eventSchedule.length, 3);

    const decoratorEnqRes = await invoke(createDecoratorEnquiry, {
      user: { id: user._id.toString(), role: 'user' },
      body: {
        decoratorId: decorator._id.toString(),
        eventSchedule: schedule,
        city: 'Surat',
        decorationsRequired: ['Stage Decor', 'Mandap Decor', 'Entrance Flowers'],
        style: 'Royal Traditional',
        message: 'Need complete theme decoration for 3 functions.',
      },
    });

    assert.equal(decoratorEnqRes.statusCode, 201);
    assert.equal(decoratorEnqRes.body.data.eventSchedule.length, 3);

    // TEST 2 — Vendor Venue Enquiries Retrieval & Vendor Quotation Creation
    const vendorEnqList = await invoke(getVendorVenueEnquiries, {
      user: { id: vendor._id.toString(), role: 'vendor' },
    });
    assert.equal(vendorEnqList.statusCode, 200);
    assert.equal(vendorEnqList.body.data.length, 1);
    assert.equal(vendorEnqList.body.data[0].eventSchedule.length, 3);

    const enquiryId = venueEnqRes.body.data._id.toString();
    const availabilityCheckPending = await invoke(checkAvailability, {
      params: { id: venue._id.toString() },
      query: {
        events: JSON.stringify(schedule.map((item, index) => ({
          index,
          eventType: item.eventType,
          eventDate: item.eventDate,
          guestCount: item.guestCount,
        }))),
      },
    });
    assert.equal(availabilityCheckPending.statusCode, 200);
    assert.equal(availabilityCheckPending.body.data.eventAvailability.length, 3);
    assert.equal(availabilityCheckPending.body.data.eventAvailability.every((item) => item.status === 'available'), true);

    const availabilityResponse = await invoke(respondVenueEnquiry, {
      user: { id: vendor._id.toString(), role: 'vendor' },
      params: { id: enquiryId },
      body: {
        eventAvailabilities: schedule.map((item, eventIndex) => ({
          eventIndex,
          eventDate: item.eventDate,
          status: 'available',
          reason: 'Confirmed available for this event.',
        })),
        estimatedPrice: 150000,
        vendorMessage: 'All requested event dates are available.',
      },
    });
    assert.equal(availabilityResponse.statusCode, 200);
    assert.equal(availabilityResponse.body.data.response.eventAvailabilities.length, 3);
    assert.equal(availabilityResponse.body.data.response.eventAvailabilities[2].eventType, 'Reception');

    const duplicateAvailabilityResponse = await invoke(respondVenueEnquiry, {
      user: { id: vendor._id.toString(), role: 'vendor' },
      params: { id: enquiryId },
      body: {
        eventAvailabilities: schedule.map((item, eventIndex) => ({
          eventIndex,
          eventDate: item.eventDate,
          status: 'available',
        })),
      },
    });
    assert.equal(duplicateAvailabilityResponse.statusCode, 409);

    const quoteRes = await invoke(createVenueQuotation, {
      user: { id: vendor._id.toString(), role: 'vendor' },
      params: { id: enquiryId },
      body: {
        baseVenuePrice: 150000,
        eventsBreakdown: [
          { eventType: 'Sangeet / DJ Night', eventDate: eventDates[0], guestCount: 250, charge: 50000 },
          { eventType: 'Wedding Ceremony', eventDate: eventDates[1], guestCount: 500, charge: 100000 },
          { eventType: 'Reception', eventDate: eventDates[2], guestCount: 750, charge: 120000 },
        ],
        additionalServiceCharges: 30000,
        tax: 20000,
        discount: 15000,
        advancePercentage: 30,
        paymentTerms: '30% advance on confirmation, balance 7 days before event.',
        vendorNotes: 'Includes full electricity backup and air conditioning.',
      },
    });

    assert.equal(quoteRes.statusCode, 200);
    const quoteData = quoteRes.body.data.quotation;
    assert.equal(quoteData.perEventTotal, 270000); // 50k + 100k + 120k
    assert.equal(quoteData.subtotal, 470000); // 150k base + 270k events + 30k addl + 20k tax
    assert.equal(quoteData.totalEstimatedAmount, 455000); // 470k - 15k discount
    assert.equal(quoteData.advanceAmount, 136500); // 30% of 455k
    assert.equal(quoteData.remainingAmount, 318500);

    // TEST 3 — User Quotation Revision Request & Acceptance
    const userRevRes = await invoke(respondVenueQuotationUser, {
      user: { id: user._id.toString(), role: 'user' },
      params: { id: enquiryId },
      body: {
        action: 'request_revision',
        revisionNotes: 'Can we get a ₹20,000 discount instead?',
      },
    });
    assert.equal(userRevRes.statusCode, 200);
    assert.equal(userRevRes.body.data.quotation.quotationStatus, 'revision_requested');
    assert.equal(userRevRes.body.data.quotation.userRevisionNotes, 'Can we get a ₹20,000 discount instead?');

    const duplicateQuoteRes = await invoke(createVenueQuotation, {
      user: { id: vendor._id.toString(), role: 'vendor' },
      params: { id: enquiryId },
      body: {
        baseVenuePrice: 150000,
        eventsBreakdown: schedule.map((item, index) => ({
          eventType: item.eventType,
          eventDate: eventDates[index],
          guestCount: item.guestCount,
          charge: [50000, 100000, 120000][index],
        })),
      },
    });
    assert.equal(duplicateQuoteRes.statusCode, 409);

    const revisedQuoteRes = await invoke(createVenueQuotation, {
      user: { id: vendor._id.toString(), role: 'vendor' },
      params: { id: enquiryId },
      body: {
        baseVenuePrice: 150000,
        eventsBreakdown: schedule.map((item, index) => ({
          eventType: item.eventType,
          eventDate: eventDates[index],
          guestCount: item.guestCount,
          charge: [50000, 100000, 120000][index],
        })),
        discount: 20000,
        advancePercentage: 30,
        revise: true,
      },
    });
    assert.equal(revisedQuoteRes.statusCode, 200);
    assert.equal(revisedQuoteRes.body.data.quotation.revisionNumber, 2);

    const prematureVisit = await invoke(requestEnquiryVisit, {
      user: { id: user._id.toString(), role: 'user' },
      params: { id: enquiryId },
      body: { preferredDate: dateAfterDays(60), preferredTime: '14:30', visitorCount: 3 },
    });
    assert.equal(prematureVisit.statusCode, 409);

    const userAcceptRes = await invoke(respondVenueQuotationUser, {
      user: { id: user._id.toString(), role: 'user' },
      params: { id: enquiryId },
      body: { action: 'accept' },
    });
    assert.equal(userAcceptRes.statusCode, 200);
    assert.equal(userAcceptRes.body.data.quotation.quotationStatus, 'accepted');
    assert.equal(await VenueBooking.countDocuments({ venue: venue._id }), 0);

    const invalidVisitRes = await invoke(requestEnquiryVisit, {
      user: { id: user._id.toString(), role: 'user' },
      params: { id: enquiryId },
      body: { preferredDate: 'not-a-date', preferredTime: '14:30', visitorCount: 3 },
    });
    assert.equal(invalidVisitRes.statusCode, 400);

    const visitRes = await invoke(requestEnquiryVisit, {
      user: { id: user._id.toString(), role: 'user' },
      params: { id: enquiryId },
      body: {
        preferredDate: dateAfterDays(60),
        preferredTime: '14:30',
        visitorCount: 3,
        message: 'We would like to see the main hall.',
      },
    });
    assert.equal(visitRes.statusCode, 201);
    assert.equal(visitRes.body.data.visit.quotationRevision, 2);
    assert.equal(visitRes.body.data.visit.status, 'requested');

    const unauthorizedVisitRes = await invoke(requestEnquiryVisit, {
      user: { id: vendor._id.toString(), role: 'user' },
      params: { id: enquiryId },
      body: { preferredDate: dateAfterDays(60), preferredTime: '14:30', visitorCount: 3 },
    });
    assert.equal(unauthorizedVisitRes.statusCode, 404);

    const duplicateVisitRes = await invoke(requestEnquiryVisit, {
      user: { id: user._id.toString(), role: 'user' },
      params: { id: enquiryId },
      body: { preferredDate: dateAfterDays(61), preferredTime: '15:00', visitorCount: 2 },
    });
    assert.equal(duplicateVisitRes.statusCode, 409);

    const proposedVisitRes = await invoke(respondToEnquiryVisit, {
      user: { id: vendor._id.toString(), role: 'vendor' },
      params: { id: enquiryId },
      body: {
        action: 'proposed',
        proposedDate: dateAfterDays(61),
        proposedTime: '16:00',
        vendorMessage: 'This time is convenient for our venue manager.',
      },
    });
    assert.equal(proposedVisitRes.statusCode, 200);
    assert.equal(proposedVisitRes.body.data.visit.status, 'proposed');

    const confirmedVisitRes = await invoke(confirmEnquiryVisitProposal, {
      user: { id: user._id.toString(), role: 'user' },
      params: { id: enquiryId },
    });
    assert.equal(confirmedVisitRes.statusCode, 200);
    assert.equal(confirmedVisitRes.body.data.visit.status, 'accepted');
    assert.equal(confirmedVisitRes.body.data.visit.preferredTime, '16:00');

    const persistedUserEnquiries = await invoke(getUserVenueEnquiries, {
      user: { id: user._id.toString(), role: 'user' },
    });
    const persistedEnquiry = persistedUserEnquiries.body.data.find((item) => item._id.toString() === enquiryId);
    assert.equal(persistedEnquiry.visit.status, 'accepted');
    assert.equal(persistedEnquiry.response.eventAvailabilities.length, 3);
    assert.equal(persistedEnquiry.quotation.quotationStatus, 'accepted');
    const persistedVendorEnquiries = await invoke(getVendorVenueEnquiries, {
      user: { id: vendor._id.toString(), role: 'vendor' },
    });
    const persistedVendorEnquiry = persistedVendorEnquiries.body.data.find((item) => item._id.toString() === enquiryId);
    assert.equal(persistedVendorEnquiry.visit.status, 'accepted');
    assert.equal(persistedVendorEnquiry.visit.proposedTime, '16:00');
    assert.equal(persistedVendorEnquiry.response.eventAvailabilities.length, 3);

    // TEST 4 — Venue Availability Management (Date Blocking & Multi-Date Checks)
    const blockRes = await invoke(updateAvailability, {
      user: { id: vendor._id.toString(), role: 'vendor' },
      params: { id: venue._id.toString() },
      body: {
        blockedDates: [dateAfterDays(48)],
        blockedDateDetails: [{ date: dateAfterDays(48), reason: 'Private Christmas Gala' }],
      },
    });
    assert.equal(blockRes.statusCode, 200);
    assert.equal(blockRes.body.data.blockedDates.length, 1);

    // Check multi-date availability including a blocked date
    const availCheckBlocked = await invoke(checkAvailability, {
      params: { id: venue._id.toString() },
      query: { dates: `${eventDates[0]},${dateAfterDays(48)}`, guests: '300' },
    });
    assert.equal(availCheckBlocked.body.data.available, false);
    assert.equal(availCheckBlocked.body.data.unavailableDates.length, 1);

    // Check multi-date availability for all clear dates
    const availCheckClear = await invoke(checkAvailability, {
      params: { id: venue._id.toString() },
      query: { dates: `${eventDates[0]},${eventDates[1]}`, guests: '300' },
    });
    assert.equal(availCheckClear.body.data.available, true);

    await VenueBooking.create({
      user: user._id,
      vendor: vendor._id,
      venue: venue._id,
      eventDate: new Date(`${dateAfterDays(49)}T00:00:00.000Z`),
      guestCount: 300,
      eventType: 'Private Event',
      eventSchedule: [{
        eventType: 'Private Event - second day',
        eventDate: new Date(`${dateAfterDays(50)}T00:00:00.000Z`),
        guestCount: 300,
      }],
      estimatedPrice: 100000,
      status: 'confirmed',
    });
    const availCheckConfirmed = await invoke(checkAvailability, {
      params: { id: venue._id.toString() },
      query: {
        events: JSON.stringify([
          { index: 0, eventType: 'Confirmed primary date', eventDate: dateAfterDays(49), guestCount: 300 },
          { index: 1, eventType: 'Confirmed schedule date', eventDate: dateAfterDays(50), guestCount: 300 },
        ]),
      },
    });
    assert.equal(availCheckConfirmed.body.data.eventAvailability[0].status, 'unavailable');
    assert.match(availCheckConfirmed.body.data.eventAvailability[0].reason, /accepted booking already exists/i);
    assert.equal(availCheckConfirmed.body.data.eventAvailability[1].status, 'unavailable');
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});
