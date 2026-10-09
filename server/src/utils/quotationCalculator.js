const calculateQuotation = ({
  baseVenuePrice = 0,
  eventsBreakdown = [],
  additionalServiceCharges = 0,
  cateringCharges = 0,
  decorationCharges = 0,
  tax = 0,
  discount = 0,
  advancePercentage = 30,
}) => {
  const parsedBasePrice = Number.isFinite(Number(baseVenuePrice)) && Number(baseVenuePrice) >= 0 ? Number(baseVenuePrice) : 0;
  
  let perEventTotal = 0;
  const processedEvents = Array.isArray(eventsBreakdown)
    ? eventsBreakdown.map((item) => {
        const charge = Number.isFinite(Number(item.charge)) && Number(item.charge) >= 0 ? Number(item.charge) : 0;
        perEventTotal += charge;
        return {
          eventType: item.eventType || 'Event',
          eventDate: item.eventDate ? new Date(item.eventDate) : null,
          guestCount: Number(item.guestCount || 0),
          charge,
          notes: typeof item.notes === 'string' ? item.notes.trim() : '',
        };
      })
    : [];

  const parsedAdditional = Number.isFinite(Number(additionalServiceCharges)) && Number(additionalServiceCharges) >= 0 ? Number(additionalServiceCharges) : 0;
  const parsedCatering = Number.isFinite(Number(cateringCharges)) && Number(cateringCharges) >= 0 ? Number(cateringCharges) : 0;
  const parsedDecoration = Number.isFinite(Number(decorationCharges)) && Number(decorationCharges) >= 0 ? Number(decorationCharges) : 0;
  const parsedTax = Number.isFinite(Number(tax)) && Number(tax) >= 0 ? Number(tax) : 0;
  const parsedDiscount = Number.isFinite(Number(discount)) && Number(discount) >= 0 ? Number(discount) : 0;
  
  let parsedAdvancePct = Number.isFinite(Number(advancePercentage)) ? Number(advancePercentage) : 30;
  if (parsedAdvancePct < 0) parsedAdvancePct = 0;
  if (parsedAdvancePct > 100) parsedAdvancePct = 100;

  const subtotal = Math.round(parsedBasePrice + perEventTotal + parsedAdditional + parsedCatering + parsedDecoration + parsedTax);
  const totalEstimatedAmount = Math.max(0, Math.round(subtotal - parsedDiscount));
  const advanceAmount = Math.round(totalEstimatedAmount * (parsedAdvancePct / 100));
  const remainingAmount = Math.max(0, totalEstimatedAmount - advanceAmount);

  return {
    baseVenuePrice: parsedBasePrice,
    eventsBreakdown: processedEvents,
    perEventTotal,
    additionalServiceCharges: parsedAdditional,
    cateringCharges: parsedCatering,
    decorationCharges: parsedDecoration,
    tax: parsedTax,
    subtotal,
    discount: parsedDiscount,
    totalEstimatedAmount,
    advancePercentage: parsedAdvancePct,
    advanceAmount,
    remainingAmount,
  };
};

module.exports = { calculateQuotation };

