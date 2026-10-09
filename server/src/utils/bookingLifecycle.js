const transitions = {
  pending: ['visit_requested', 'quotation_sent', 'accepted', 'rejected', 'cancelled'],
  visit_requested: ['visit_scheduled', 'rejected', 'cancelled'],
  visit_scheduled: ['quotation_sent', 'accepted', 'rejected', 'cancelled'],
  quotation_sent: ['confirmed', 'rejected', 'cancelled'],
  accepted: ['confirmed', 'cancelled', 'completed'],
  confirmed: ['cancelled', 'completed'],
  rejected: [],
  cancelled: [],
  completed: [],
};

const roundCurrency = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

const calculateQuotation = ({ baseVenuePrice, extraCharges, advancePercentage }) => {
  const base = Number(baseVenuePrice);
  const extras = Number(extraCharges);
  const advanceRate = Number(advancePercentage);
  if (!Number.isFinite(base) || base < 0 || !Number.isFinite(extras) || extras < 0) {
    throw new RangeError('Venue price and extra charges must be non-negative numbers.');
  }
  if (!Number.isFinite(advanceRate) || advanceRate < 0 || advanceRate > 100) {
    throw new RangeError('Advance percentage must be between 0 and 100.');
  }

  const estimatedTotal = roundCurrency(base + extras);
  const advanceAmount = roundCurrency((estimatedTotal * advanceRate) / 100);
  return {
    estimatedTotal,
    advanceAmount,
    remainingAmount: roundCurrency(estimatedTotal - advanceAmount),
  };
};

const canTransitionBookingStatus = (currentStatus, nextStatus) =>
  Boolean(transitions[currentStatus]?.includes(nextStatus));

const appendLifecycleEvent = (booking, { type, actorRole, actorId, message = '' }) => {
  booking.lifecycleEvents.push({
    type,
    actorRole,
    actorId,
    message,
    occurredAt: new Date(),
  });
};

module.exports = {
  appendLifecycleEvent,
  calculateQuotation,
  canTransitionBookingStatus,
};
