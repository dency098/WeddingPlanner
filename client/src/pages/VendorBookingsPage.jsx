import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVendorVenues } from '../services/venueService';
import {
  createTestVenueEnquiry,
  getVendorVenueEnquiries,
  respondVenueEnquiry,
  respondVenueVisit,
  sendVenueQuotation,
} from '../services/venueEnquiryService';

const dateLabel = (value) => {
  if (!value) return 'TBD';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};
const dateInputValue = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');
const formatPrice = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

export default function VendorBookingsPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [vendorVenues, setVendorVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState('');

  // Simple Response Modal State
  const [respondingEnquiry, setRespondingInquiry] = useState(null);
  const [editingResponse, setEditingResponse] = useState(false);
  const [responseForm, setResponseForm] = useState({
    eventAvailabilities: [],
    estimatedPrice: '',
    vendorMessage: '',
  });
  const [visitResponseEnquiry, setVisitResponseEnquiry] = useState(null);
  const [visitResponseForm, setVisitResponseForm] = useState({
    action: 'proposed',
    proposedDate: '',
    proposedTime: '',
    vendorMessage: '',
  });

  // Comprehensive Multi-Event Quotation Modal State
  const [quotingEnquiry, setQuotingEnquiry] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    baseVenuePrice: 0,
    eventsBreakdown: [],
    additionalServiceCharges: 0,
    cateringCharges: 0,
    decorationCharges: 0,
    tax: 0,
    discount: 0,
    advancePercentage: 30,
    validUntil: '',
    paymentTerms: '30% Advance on confirmation, balance 7 days before event.',
    vendorNotes: '',
    termsAndConditions: '',
  });
  const summary = enquiries.reduce((counts, enquiry) => {
    counts.total += 1;
    if (['pending', 'booking_requested'].includes(enquiry.status)) counts.pending += 1;
    if (['confirmed', 'booking_confirmed'].includes(enquiry.status) || (enquiry.status === 'accepted' && enquiry.isBookingRecord)) {
      counts.confirmed += 1;
    }
    if (enquiry.status === 'completed') counts.completed += 1;
    return counts;
  }, { total: 0, pending: 0, confirmed: 0, completed: 0 });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [enqData, venueList] = await Promise.all([
        getVendorVenueEnquiries(),
        getVendorVenues().catch(() => []),
      ]);
      setEnquiries(enqData || []);
      setVendorVenues(venueList || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || apiError.message || 'Could not load your venue enquiries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreateTestEnquiry = async () => {
    if (!vendorVenues || vendorVenues.length === 0) {
      setError('You need at least one active Venue listing to generate a test enquiry. Please add a Venue service first.');
      return;
    }

    setWorking('test-enquiry');
    setError('');
    setNotice('');

    try {
      await createTestVenueEnquiry(vendorVenues[0]._id);
      setNotice('✓ Test Venue Enquiry created successfully! Check your inquiries list below.');
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to create test venue enquiry.');
    } finally {
      setWorking('');
    }
  };

  const openRespondModal = (enquiry, edit = false) => {
    setRespondingInquiry(enquiry);
    setEditingResponse(edit);
    const schedule = enquiry.eventSchedule?.length ? enquiry.eventSchedule : [
      { eventType: enquiry.eventType, eventDate: enquiry.eventDate, guestCount: enquiry.guestCount },
    ];
    const savedEvents = enquiry.response?.eventAvailabilities || [];
    setResponseForm({
      eventAvailabilities: schedule.map((item, eventIndex) => {
        const saved = savedEvents.find((event) => event.eventIndex === eventIndex);
        return {
          eventIndex,
          eventType: item.eventType || 'Function',
          eventDate: dateInputValue(item.eventDate),
          status: saved?.status || 'available',
          reason: saved?.reason || '',
          alternativeDate: dateInputValue(saved?.alternativeDate),
        };
      }),
      estimatedPrice: String(enquiry.response?.estimatedPrice || enquiry.venue?.startingPrice || ''),
      vendorMessage: enquiry.response?.vendorMessage || '',
    });
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!respondingEnquiry) return;

    setWorking(respondingEnquiry._id);
    setError('');
    setNotice('');

    try {
      await respondVenueEnquiry(respondingEnquiry._id, {
        eventAvailabilities: responseForm.eventAvailabilities,
        estimatedPrice: Number(responseForm.estimatedPrice || 0),
        vendorMessage: responseForm.vendorMessage,
        edit: editingResponse,
      });
      setNotice(editingResponse ? 'Availability response updated successfully.' : 'Availability response sent successfully.');
      setRespondingInquiry(null);
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to send response.');
    } finally {
      setWorking('');
    }
  };

  const handleEventAvailabilityChange = (index, field, value) => {
    setResponseForm((previous) => ({
      ...previous,
      eventAvailabilities: previous.eventAvailabilities.map((event, eventIndex) => (
        eventIndex === index ? { ...event, [field]: value } : event
      )),
    }));
  };

  const handleVisitResponse = async (event) => {
    event.preventDefault();
    if (!visitResponseEnquiry) return;
    setWorking(`visit-${visitResponseEnquiry._id}`);
    setError('');
    setNotice('');
    try {
      await respondVenueVisit(visitResponseEnquiry._id, visitResponseForm);
      setNotice(visitResponseForm.action === 'proposed'
        ? 'Alternative venue visit time proposed.'
        : `Venue visit ${visitResponseForm.action}.`);
      setVisitResponseEnquiry(null);
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Could not update the venue visit request.');
    } finally {
      setWorking('');
    }
  };

  // QUOTATION BUILDER HANDLERS
  const openQuotationModal = (enquiry) => {
    const schedule = enquiry.eventSchedule || [
      { eventType: enquiry.eventType || 'Wedding', eventDate: enquiry.eventDate, guestCount: enquiry.guestCount || 100 },
    ];

    const initialBreakdown = schedule.map((item) => ({
      eventType: item.eventType || 'Wedding Function',
      eventDate: item.eventDate ? new Date(item.eventDate).toISOString().slice(0, 10) : '',
      guestCount: item.guestCount || 100,
      charge: item.charge || 25000,
      notes: item.notes || '',
    }));

    setQuotingEnquiry(enquiry);
    setQuoteForm({
      baseVenuePrice: enquiry.quotation?.baseVenuePrice || enquiry.venue?.startingPrice || 50000,
      eventsBreakdown: initialBreakdown,
      additionalServiceCharges: enquiry.quotation?.additionalServiceCharges || 0,
      cateringCharges: enquiry.quotation?.cateringCharges || 0,
      decorationCharges: enquiry.quotation?.decorationCharges || 0,
      tax: enquiry.quotation?.tax || 0,
      discount: enquiry.quotation?.discount || 0,
      advancePercentage: enquiry.quotation?.advancePercentage || 30,
      validUntil: enquiry.quotation?.validUntil ? new Date(enquiry.quotation.validUntil).toISOString().slice(0, 10) : '',
      paymentTerms: enquiry.quotation?.paymentTerms || '30% Advance on confirmation, balance 7 days before event.',
      vendorNotes: enquiry.quotation?.vendorNotes || '',
      termsAndConditions: enquiry.quotation?.termsAndConditions || 'Standard cancellation and venue rules apply.',
    });
  };

  const handleBreakdownChange = (index, field, value) => {
    const updated = quoteForm.eventsBreakdown.map((item, i) => {
      if (i === index) return { ...item, [field]: value };
      return item;
    });
    setQuoteForm((prev) => ({ ...prev, eventsBreakdown: updated }));
  };

  // Live calculation helper
  const calculateTotals = () => {
    const base = Number(quoteForm.baseVenuePrice || 0);
    const eventCharges = quoteForm.eventsBreakdown.reduce((sum, item) => sum + Number(item.charge || 0), 0);
    const addl = Number(quoteForm.additionalServiceCharges || 0);
    const cat = Number(quoteForm.cateringCharges || 0);
    const dec = Number(quoteForm.decorationCharges || 0);
    const tax = Number(quoteForm.tax || 0);
    const disc = Number(quoteForm.discount || 0);
    const advPct = Number(quoteForm.advancePercentage || 30);

    const subtotal = base + eventCharges + addl + cat + dec + tax;
    const total = Math.max(0, subtotal - disc);
    const advance = Math.round(total * (advPct / 100));
    const remaining = total - advance;

    return { subtotal, total, advance, remaining, eventCharges };
  };

  const handleSendQuotationSubmit = async (e) => {
    e.preventDefault();
    if (!quotingEnquiry) return;

    setWorking(`quote-${quotingEnquiry._id}`);
    setError('');
    setNotice('');

    try {
      await sendVenueQuotation(quotingEnquiry._id, {
        ...quoteForm,
        revise: Boolean(quotingEnquiry.quotation),
      });
      setNotice('✓ Formal itemized quotation sent to customer successfully.');
      setQuotingEnquiry(null);
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to send formal quotation.');
    } finally {
      setWorking('');
    }
  };

  const computed = calculateTotals();

  return (
    <main className="venue-management-page vendor-bookings-page container py-4">
      <header className="venue-management-heading d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom flex-wrap gap-3">
        <div>
          <p className="eyebrow text-uppercase text-primary fw-bold mb-1" style={{ fontSize: '0.8rem' }}>Vendor Workspace</p>
          <h1 className="h2 fw-bold text-dark mb-1">Manage Bookings</h1>
          <p className="text-muted small mb-0">Review customer requests, manage event schedules, and respond with availability and pricing.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-success fw-bold"
            disabled={working === 'test-enquiry'}
            onClick={handleCreateTestEnquiry}
          >
            {working === 'test-enquiry' ? 'Generating Test Enquiry…' : '🏰 Send Test Venue Enquiry'}
          </button>
          <Link className="btn btn-outline-secondary" to="/vendor/services">Manage Services</Link>
        </div>
      </header>

      {notice && <div className="alert alert-success small mb-4" role="status">{notice}</div>}
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4" role="alert">
          <div>
            <strong>Error:</strong> {error}
          </div>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={refresh}>
            🔄 Retry Loading
          </button>
        </div>
      )}

      {loading && <div className="vendor-bookings-loading text-center py-5 text-muted" role="status">Loading bookings and enquiries…</div>}

      {!loading && !error && (
        <section className="row row-cols-2 row-cols-xl-4 g-3 vendor-booking-summary-grid mb-4" aria-label="Booking summary">
          <div className="col"><article className="card vendor-booking-summary-card h-100">
            <span className="summary-card-mark" aria-hidden="true"></span>
            <span>Total requests</span>
            <strong>{summary.total}</strong>
            <small>Bookings and venue enquiries</small>
          </article></div>
          <div className="col"><article className="card vendor-booking-summary-card h-100">
            <span className="summary-card-mark" aria-hidden="true"></span>
            <span>Pending</span>
            <strong>{summary.pending}</strong>
            <small>Awaiting your response</small>
          </article></div>
          <div className="col"><article className="card vendor-booking-summary-card h-100">
            <span className="summary-card-mark" aria-hidden="true"></span>
            <span>Confirmed</span>
            <strong>{summary.confirmed}</strong>
            <small>Confirmed bookings</small>
          </article></div>
          <div className="col"><article className="card vendor-booking-summary-card h-100">
            <span className="summary-card-mark" aria-hidden="true"></span>
            <span>Completed</span>
            <strong>{summary.completed}</strong>
            <small>Completed bookings</small>
          </article></div>
        </section>
      )}

      {!loading && !error && enquiries.length === 0 && (
        <div className="card vendor-bookings-empty text-center p-5 border-dashed">
          <h2 className="h4 fw-bold text-dark mb-2">No venue enquiries received yet.</h2>
          <p className="text-muted small mb-3">You can click "Send Test Venue Enquiry" above to generate a multi-date test enquiry for development testing.</p>
          <div>
            <button
              type="button"
              className="btn btn-outline-primary fw-bold"
              onClick={handleCreateTestEnquiry}
            >
              Generate Test Enquiry Now
            </button>
          </div>
        </div>
      )}

      {!loading && enquiries.length > 0 && (
        <div className="row g-4">
          {enquiries.map((enquiry) => {
            const schedule = enquiry.eventSchedule && enquiry.eventSchedule.length > 0
              ? enquiry.eventSchedule
              : [{ eventType: enquiry.eventType, eventDate: enquiry.eventDate, guestCount: enquiry.guestCount, city: enquiry.city }];
            
            const q = enquiry.quotation;
            const bookingAmount = q?.totalEstimatedAmount ?? enquiry.response?.estimatedPrice ?? enquiry.estimatedPrice;

            return (
              <div className="col-12" key={enquiry._id}>
                <div
                  className="card vendor-enquiry-card shadow-sm border rounded-3 p-4 bg-white"
                  data-test-enquiry={enquiry.isTest ? 'true' : undefined}
                >
                  <div className="vendor-enquiry-header d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge vendor-enquiry-type px-2 py-1">
                          {enquiry.isBookingRecord ? 'Venue booking' : 'Venue enquiry'} <span aria-hidden="true">·</span> {schedule.length} function{schedule.length > 1 ? 's' : ''}
                        </span>
                        {enquiry.isTest && (
                          <span className="badge vendor-test-badge px-2 py-1">
                            Test enquiry
                          </span>
                        )}
                        {q?.quotationStatus && (
                          <span className={`badge vendor-quote-badge vendor-quote-${q.quotationStatus} px-2 py-1`}>
                            Quote {q.quotationStatus.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <h3 className="h5 fw-bold text-dark mb-1">
                        {enquiry.userName || enquiry.user?.name || 'Customer'}
                      </h3>
                      <p className="vendor-customer-contact text-muted small mb-0">
                        <span>{enquiry.userEmail || enquiry.user?.email || 'Email not provided'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{enquiry.userPhone || enquiry.user?.phone || 'Phone not provided'}</span>
                      </p>
                    </div>

                    <span className={`badge vendor-enquiry-status vendor-status-${enquiry.status}`}>
                      {enquiry.status === 'quotation_sent' ? 'Quotation sent' : enquiry.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* MULTI-DATE SCHEDULE BREAKDOWN */}
                  <div className="vendor-enquiry-schedule p-3 bg-light rounded border mb-3">
                    <h4 className="h6 fw-bold text-dark mb-2">Event schedule</h4>
                    <div className="row g-2">
                      {schedule.map((item, idx) => (
                        <div className="col-12 col-md-4" key={idx}>
                          <div className="vendor-event-card p-2 border bg-white rounded small">
                            <strong className="d-block text-primary">{item.eventType || 'Function'}</strong>
                            <div className="vendor-event-meta"><span>Date</span><strong>{dateLabel(item.eventDate)}</strong></div>
                            <div className="vendor-event-meta"><span>Guests</span><strong>{item.guestCount}</strong></div>
                            {(item.startTime || item.endTime) && (
                              <div className="vendor-event-meta"><span>Time</span><strong>{item.startTime || '—'}{item.endTime ? `–${item.endTime}` : ''}</strong></div>
                            )}
                            {item.requirements && <div className="vendor-event-requirements"><span>Requirements</span>{item.requirements}</div>}
                            {item.notes && <div className="text-muted fst-italic mt-1">"{item.notes}"</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ADDITIONAL ENQUIRY FIELDS */}
                  <div className="vendor-enquiry-details row g-3 p-3 bg-white rounded border mb-3 text-secondary small">
                    <div className="col-6 col-md-3">
                      <span className="d-block text-muted">Requested Venue</span>
                      <strong className="text-dark fs-6">{enquiry.venueName || enquiry.venue?.venueName}</strong>
                    </div>
                    <div className="col-6 col-md-3">
                      <span className="d-block text-muted">City / Location</span>
                      <strong className="text-dark fs-6">{enquiry.city}</strong>
                    </div>
                    <div className="col-6 col-md-3">
                      <span className="d-block text-muted">Budget Range</span>
                      <strong className="text-dark fs-6">{enquiry.budget || 'Not specified'}</strong>
                    </div>
                    <div className="col-6 col-md-3">
                      <span className="d-block text-muted">Services Needed</span>
                      <strong className="text-dark fs-6">
                        {[
                          enquiry.cateringRequired && 'Catering',
                          enquiry.decorationRequired && 'Decoration',
                          enquiry.djRequired && 'DJ',
                        ].filter(Boolean).join(', ') || 'Venue Only'}
                      </strong>
                    </div>
                    <div className="col-6 col-md-3">
                      <span className="d-block text-muted">Booking amount</span>
                      <strong className="text-dark fs-6">{bookingAmount !== undefined && bookingAmount !== null ? formatPrice(bookingAmount) : 'Not quoted yet'}</strong>
                    </div>
                    <div className="col-12 col-md-6">
                      <span className="d-block text-muted">Record ID</span>
                      <strong className="vendor-booking-id text-dark">{enquiry._id}</strong>
                    </div>
                  </div>

                  {enquiry.message && (
                    <div className="vendor-customer-message p-3 rounded mb-3 small text-dark">
                      <strong>Customer Message:</strong> "{enquiry.message}"
                    </div>
                  )}

                  {enquiry.response?.eventAvailabilities?.length > 0 && (
                    <section className="vendor-availability-response p-3 rounded mb-3 small" aria-label="Saved availability response">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                        <strong className="fs-6">Availability response</strong>
                        <span className="badge text-bg-light">Saved {enquiry.response.respondedAt ? dateLabel(enquiry.response.respondedAt) : ''}</span>
                      </div>
                      <div className="row g-2">
                        {enquiry.response.eventAvailabilities.map((event) => (
                          <div className="col-12 col-md-6" key={event.eventIndex}>
                            <div className="p-2 bg-white border rounded h-100">
                              <strong>{event.eventType} · {dateLabel(event.eventDate)}</strong>
                              <div className="mt-1">
                                <span className={`badge ${event.status === 'available' ? 'text-bg-success' : event.status === 'not_available' ? 'text-bg-danger' : 'text-bg-warning'}`}>
                                  {event.status.replaceAll('_', ' ')}
                                </span>
                              </div>
                              {event.reason && <p className="mb-0 mt-1">{event.reason}</p>}
                              {event.alternativeDate && <p className="mb-0 mt-1">Alternative: <strong>{dateLabel(event.alternativeDate)}</strong></p>}
                            </div>
                          </div>
                        ))}
                      </div>
                      {enquiry.response.vendorMessage && <p className="mb-0 mt-2">{enquiry.response.vendorMessage}</p>}
                    </section>
                  )}

                  {enquiry.visit && (
                    <section className="vendor-visit-summary p-3 rounded mb-3 small" aria-label="Venue visit request">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                        <strong className="fs-6">Venue visit</strong>
                        <span className="badge text-bg-light">{enquiry.visit.status?.replaceAll('_', ' ')}</span>
                      </div>
                      <div className="row g-2">
                        <div className="col-12 col-md-6">Requested: <strong>{dateLabel(enquiry.visit.preferredDate)} at {enquiry.visit.preferredTime}</strong></div>
                        <div className="col-12 col-md-6">Visitors: <strong>{enquiry.visit.visitorCount}</strong></div>
                        <div className="col-12">Accepted quotation: <strong>Revision {enquiry.visit.quotationRevision}</strong></div>
                        {enquiry.visit.message && <div className="col-12">Customer message: {enquiry.visit.message}</div>}
                        {enquiry.visit.proposedDate && <div className="col-12">Proposed time: <strong>{dateLabel(enquiry.visit.proposedDate)} at {enquiry.visit.proposedTime}</strong></div>}
                        {enquiry.visit.vendorMessage && <div className="col-12">Your response: {enquiry.visit.vendorMessage}</div>}
                      </div>
                        {enquiry.visit.status === 'proposed' && (
                          <p className="small text-muted mt-2 mb-0">Awaiting the customer’s confirmation of your proposed time.</p>
                        )}
                        {['requested', 'proposed'].includes(enquiry.visit.status) && (
                          <div className="d-flex flex-wrap gap-2 mt-3">
                            {enquiry.visit.status === 'requested' && <button type="button" className="btn btn-sm btn-success" disabled={working === `visit-${enquiry._id}`} onClick={async () => {
                            setWorking(`visit-${enquiry._id}`);
                            setError('');
                            try {
                              await respondVenueVisit(enquiry._id, { action: 'accepted' });
                              setNotice('Venue visit accepted.');
                              await refresh();
                            } catch (apiError) {
                              setError(apiError.response?.data?.message || 'Could not accept the venue visit.');
                            } finally {
                              setWorking('');
                            }
                          }}>Accept visit time</button>}
                          <button type="button" className="btn btn-sm btn-outline-danger" disabled={working === `visit-${enquiry._id}`} onClick={async () => {
                            setWorking(`visit-${enquiry._id}`);
                            setError('');
                            try {
                              await respondVenueVisit(enquiry._id, { action: 'rejected' });
                              setNotice('Venue visit declined.');
                              await refresh();
                            } catch (apiError) {
                              setError(apiError.response?.data?.message || 'Could not decline the venue visit.');
                            } finally {
                              setWorking('');
                            }
                          }}>Decline</button>
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => {
                            setVisitResponseEnquiry(enquiry);
                            setVisitResponseForm({ action: 'proposed', proposedDate: '', proposedTime: '', vendorMessage: '' });
                          }}>Propose another time</button>
                        </div>
                      )}
                    </section>
                  )}

                  {/* FORMAL QUOTATION RECORD */}
                  {q && (
                    <div className="vendor-quotation-summary p-3 rounded mb-3 small">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong className="fs-6">Formal quotation</strong>
                        <span className="badge">{q.quotationStatus?.replace('_', ' ')}</span>
                      </div>
                      <div className="row g-2 text-dark">
                        <div className="col-6 col-md-3">Base Rental: <strong>{formatPrice(q.baseVenuePrice)}</strong></div>
                        <div className="col-6 col-md-3">Per-Event Total: <strong>{formatPrice(q.perEventTotal)}</strong></div>
                        <div className="col-6 col-md-3">Discount: <strong className="text-danger">-{formatPrice(q.discount)}</strong></div>
                        <div className="col-6 col-md-3">Grand Total: <strong className="vendor-quotation-total fs-6">{formatPrice(q.totalEstimatedAmount)}</strong></div>
                        <div className="col-6 col-md-3">Advance Required ({q.advancePercentage}%): <strong>{formatPrice(q.advanceAmount)}</strong></div>
                        <div className="col-6 col-md-3">Remaining Balance: <strong>{formatPrice(q.remainingAmount)}</strong></div>
                      </div>
                      {q.userRevisionNotes && (
                        <div className="p-2 bg-white border border-warning rounded mt-2 text-danger">
                          <strong>Customer Revision Feedback:</strong> "{q.userRevisionNotes}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  <div className="vendor-enquiry-actions d-flex justify-content-end gap-2 flex-wrap">
                    {(!enquiry.isBookingRecord || !enquiry.response?.eventAvailabilities?.length) && (
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        disabled={working === enquiry._id}
                        onClick={() => openRespondModal(enquiry, Boolean(enquiry.response?.eventAvailabilities?.length))}
                      >
                        {enquiry.response?.eventAvailabilities?.length ? 'Edit Response' : 'Respond to Availability'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary fw-bold"
                      disabled={working === `quote-${enquiry._id}` || q?.quotationStatus === 'accepted' || (!enquiry.isBookingRecord && !enquiry.response?.eventAvailabilities?.length)}
                      onClick={() => openQuotationModal(enquiry)}
                    >
                      {q?.quotationStatus === 'accepted' ? 'Quotation Accepted' : q ? '✏️ Revise Quotation' : '📋 Create Formal Quotation'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK RESPOND MODAL */}
      {respondingEnquiry && (
        <div className="modal-overlay position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 1050 }}>
          <div className="card vendor-bookings-modal shadow-lg border-0 rounded-3 p-4" style={{ maxWidth: '720px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h3 className="h5 fw-bold text-dark mb-0">{editingResponse ? 'Edit Availability Response' : 'Respond to Venue Enquiry'}</h3>
              <button type="button" className="btn-close" onClick={() => setRespondingInquiry(null)}></button>
            </div>
            
            <p className="text-muted small mb-3">
              Customer: <strong>{respondingEnquiry.userName || 'Customer'}</strong> · {responseForm.eventAvailabilities.length} event dates.
            </p>

            <form onSubmit={handleSendResponse}>
              {responseForm.eventAvailabilities.map((event, index) => (
                <div className="p-3 bg-light border rounded mb-3" key={event.eventIndex}>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                    <strong>{event.eventType} · {dateLabel(event.eventDate)}</strong>
                    <span className="small text-muted">Event {index + 1} of {responseForm.eventAvailabilities.length}</span>
                  </div>
                  <label className="form-label small fw-bold">Availability *</label>
                  <select className="form-select mb-2" value={event.status} onChange={(e) => handleEventAvailabilityChange(index, 'status', e.target.value)} required>
                    <option value="available">Available</option>
                    <option value="not_available">Unavailable</option>
                    <option value="need_more_details">Need more details</option>
                  </select>
                  <label className="form-label small fw-bold">Reason or details</label>
                  <textarea className="form-control mb-2" rows="2" maxLength="500" value={event.reason} onChange={(e) => handleEventAvailabilityChange(index, 'reason', e.target.value)} />
                  {event.status === 'not_available' && (
                    <>
                      <label className="form-label small fw-bold">Alternative date (optional)</label>
                      <input type="date" className="form-control" value={event.alternativeDate} onChange={(e) => handleEventAvailabilityChange(index, 'alternativeDate', e.target.value)} />
                    </>
                  )}
                </div>
              ))}

              <div className="mb-3">
                <label className="form-label small fw-bold">Estimated Quote Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 150000"
                  value={responseForm.estimatedPrice}
                  onChange={(e) => setResponseForm((prev) => ({ ...prev, estimatedPrice: e.target.value }))}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Message to Customer</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Share details on venue rental, hall package, food terms, or advance payment..."
                  value={responseForm.vendorMessage}
                  onChange={(e) => setResponseForm((prev) => ({ ...prev, vendorMessage: e.target.value }))}
                />
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
                <button type="button" className="btn btn-secondary" onClick={() => setRespondingInquiry(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={working === respondingEnquiry._id}>
                  {working === respondingEnquiry._id ? 'Saving…' : editingResponse ? 'Save Response' : 'Send Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {visitResponseEnquiry && (
        <div className="modal-overlay position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 1055 }}>
          <div className="card vendor-bookings-modal shadow-lg border-0 rounded-3 p-4" style={{ maxWidth: '560px', width: '95%' }}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <div>
                <h3 className="h5 fw-bold text-dark mb-0">Propose another visit time</h3>
                <p className="text-muted small mb-0">For {visitResponseEnquiry.userName || 'the customer'} · {visitResponseEnquiry.venueName || visitResponseEnquiry.venue?.venueName}</p>
              </div>
              <button type="button" className="btn-close" onClick={() => setVisitResponseEnquiry(null)} aria-label="Close"></button>
            </div>
            <form onSubmit={handleVisitResponse}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold" htmlFor={`proposed-date-${visitResponseEnquiry._id}`}>Proposed date</label>
                  <input id={`proposed-date-${visitResponseEnquiry._id}`} type="date" className="form-control" min={dateInputValue(new Date())} required value={visitResponseForm.proposedDate} onChange={(event) => setVisitResponseForm((previous) => ({ ...previous, proposedDate: event.target.value }))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold" htmlFor={`proposed-time-${visitResponseEnquiry._id}`}>Proposed time</label>
                  <input id={`proposed-time-${visitResponseEnquiry._id}`} type="time" className="form-control" required value={visitResponseForm.proposedTime} onChange={(event) => setVisitResponseForm((previous) => ({ ...previous, proposedTime: event.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-bold" htmlFor={`proposed-message-${visitResponseEnquiry._id}`}>Message to customer (optional)</label>
                  <textarea id={`proposed-message-${visitResponseEnquiry._id}`} className="form-control" rows="3" maxLength="2000" value={visitResponseForm.vendorMessage} onChange={(event) => setVisitResponseForm((previous) => ({ ...previous, vendorMessage: event.target.value }))} />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
                <button type="button" className="btn btn-secondary" onClick={() => setVisitResponseEnquiry(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={working === `visit-${visitResponseEnquiry._id}`}>
                  {working === `visit-${visitResponseEnquiry._id}` ? 'Sending…' : 'Send Proposed Time'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE MULTI-EVENT QUOTATION BUILDER MODAL */}
      {quotingEnquiry && (
        <div className="modal-overlay position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center overflow-auto py-4" style={{ zIndex: 1060 }}>
          <div className="card vendor-bookings-modal shadow-lg border-0 rounded-3 p-4 my-auto" style={{ maxWidth: '780px', width: '95%' }}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <div>
                <h3 className="h5 fw-bold text-dark mb-0">📋 Create / Edit Itemized Quotation</h3>
                <p className="text-muted small mb-0">Customer: <strong>{quotingEnquiry.userName}</strong> ({quotingEnquiry.userEmail})</p>
              </div>
              <button type="button" className="btn-close" onClick={() => setQuotingEnquiry(null)}></button>
            </div>

            <form onSubmit={handleSendQuotationSubmit}>
              {/* SECTION 1: BASE VENUE PRICE */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary mb-1">Base Venue Rental Charge (₹) *</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  value={quoteForm.baseVenuePrice}
                  onChange={(e) => setQuoteForm((prev) => ({ ...prev, baseVenuePrice: Number(e.target.value) }))}
                  required
                />
              </div>

              {/* SECTION 2: PER-EVENT BREAKDOWN CHARGES */}
              <div className="p-3 bg-light rounded border mb-3">
                <h4 className="h6 fw-bold text-dark mb-2">Per-Event Function Charges</h4>
                {quoteForm.eventsBreakdown.map((item, idx) => (
                  <div key={idx} className="row g-2 align-items-center mb-2 pb-2 border-bottom">
                    <div className="col-12 col-md-5">
                      <small className="d-block fw-bold text-primary">{item.eventType}</small>
                      <small className="text-muted">{dateLabel(item.eventDate)} ({item.guestCount} guests)</small>
                    </div>
                    <div className="col-12 col-md-7">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text">₹ Charge</span>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          value={item.charge}
                          onChange={(e) => handleBreakdownChange(idx, 'charge', Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* SECTION 3: ADDITIONAL CHARGES, TAX & DISCOUNT */}
              <div className="row g-3 mb-3">
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-bold">Additional Charges (₹)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min="0"
                    value={quoteForm.additionalServiceCharges}
                    onChange={(e) => setQuoteForm((prev) => ({ ...prev, additionalServiceCharges: Number(e.target.value) }))}
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-bold">Tax (₹)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min="0"
                    value={quoteForm.tax}
                    onChange={(e) => setQuoteForm((prev) => ({ ...prev, tax: Number(e.target.value) }))}
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-bold">Discount (₹)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min="0"
                    value={quoteForm.discount}
                    onChange={(e) => setQuoteForm((prev) => ({ ...prev, discount: Number(e.target.value) }))}
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-bold">Advance %</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min="0"
                    max="100"
                    value={quoteForm.advancePercentage}
                    onChange={(e) => setQuoteForm((prev) => ({ ...prev, advancePercentage: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {/* SECTION 4: COMPUTED SUMMARY PREVIEW */}
              <div className="p-3 bg-primary-subtle border border-primary rounded mb-3 small">
                <h4 className="h6 fw-bold text-primary mb-2">💰 Quotation Summary Calculation</h4>
                <div className="row g-2">
                  <div className="col-6 col-md-3">Subtotal: <strong>{formatPrice(computed.subtotal)}</strong></div>
                  <div className="col-6 col-md-3">Discount: <strong className="text-danger">-{formatPrice(quoteForm.discount)}</strong></div>
                  <div className="col-6 col-md-3">Total Estimate: <strong className="text-primary fs-6">{formatPrice(computed.total)}</strong></div>
                  <div className="col-6 col-md-3">Advance ({quoteForm.advancePercentage}%): <strong className="text-success">{formatPrice(computed.advance)}</strong></div>
                  <div className="col-12">Remaining Balance: <strong>{formatPrice(computed.remaining)}</strong></div>
                </div>
              </div>

              {/* SECTION 5: TERMS & NOTES */}
              <div className="mb-3">
                <label className="form-label small fw-bold">Payment Terms & Validity</label>
                <input
                  type="text"
                  className="form-control form-control-sm mb-2"
                  placeholder="Payment terms..."
                  value={quoteForm.paymentTerms}
                  onChange={(e) => setQuoteForm((prev) => ({ ...prev, paymentTerms: e.target.value }))}
                />
                <label className="form-label small fw-bold" htmlFor={`quote-valid-until-${quotingEnquiry._id}`}>Quotation valid until</label>
                <input
                  id={`quote-valid-until-${quotingEnquiry._id}`}
                  type="date"
                  min={dateInputValue(new Date())}
                  className="form-control form-control-sm mb-2"
                  value={quoteForm.validUntil}
                  onChange={(e) => setQuoteForm((prev) => ({ ...prev, validUntil: e.target.value }))}
                />
                <label className="form-label small fw-bold">Vendor Notes & Inclusions</label>
                <textarea
                  className="form-control form-control-sm"
                  rows="2"
                  placeholder="Inclusions, parking, DJ timing restrictions, electricity backup details..."
                  value={quoteForm.vendorNotes}
                  onChange={(e) => setQuoteForm((prev) => ({ ...prev, vendorNotes: e.target.value }))}
                />
                <label className="form-label small fw-bold mt-2">Terms & Conditions</label>
                <textarea
                  className="form-control form-control-sm"
                  rows="2"
                  value={quoteForm.termsAndConditions}
                  onChange={(e) => setQuoteForm((prev) => ({ ...prev, termsAndConditions: e.target.value }))}
                />
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button type="button" className="btn btn-secondary" onClick={() => setQuotingEnquiry(null)}>Cancel</button>
                <button type="submit" className="btn btn-success fw-bold" disabled={working === `quote-${quotingEnquiry._id}`}>
                  {working === `quote-${quotingEnquiry._id}` ? 'Sending Quotation…' : '✉️ Send Formal Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
