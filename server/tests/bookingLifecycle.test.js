const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateQuotation,
  canTransitionBookingStatus,
} = require('../src/utils/bookingLifecycle');

test('calculates the requested quotation amounts on the server', () => {
  assert.deepEqual(
    calculateQuotation({ baseVenuePrice: 80000, extraCharges: 10000, advancePercentage: 30 }),
    { estimatedTotal: 90000, advanceAmount: 27000, remainingAmount: 63000 }
  );
});

test('rounds currency values to two decimal places', () => {
  assert.deepEqual(
    calculateQuotation({ baseVenuePrice: 99.995, extraCharges: 0.005, advancePercentage: 33.33 }),
    { estimatedTotal: 100, advanceAmount: 33.33, remainingAmount: 66.67 }
  );
});

test('rejects invalid monetary and advance values', () => {
  assert.throws(() => calculateQuotation({ baseVenuePrice: -1, extraCharges: 0, advancePercentage: 30 }), RangeError);
  assert.throws(() => calculateQuotation({ baseVenuePrice: 1, extraCharges: 0, advancePercentage: 101 }), RangeError);
});

test('permits only supported lifecycle transitions', () => {
  assert.equal(canTransitionBookingStatus('pending', 'quotation_sent'), true);
  assert.equal(canTransitionBookingStatus('quotation_sent', 'confirmed'), true);
  assert.equal(canTransitionBookingStatus('confirmed', 'cancelled'), true);
  assert.equal(canTransitionBookingStatus('confirmed', 'completed'), true);
  assert.equal(canTransitionBookingStatus('completed', 'cancelled'), false);
  assert.equal(canTransitionBookingStatus('rejected', 'confirmed'), false);
  assert.equal(canTransitionBookingStatus('cancelled', 'confirmed'), false);
});
