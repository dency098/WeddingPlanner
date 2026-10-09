import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VenueImage from '../components/VenueImage';
import {
  confirmVenueVisitProposal,
  getUserVenueEnquiries,
  requestVenueVisit,
  respondVenueQuotationUser,
} from '../services/venueEnquiryService';

const dateLabel = (value) => {
  if (!value) return 'TBD';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};
const formatPrice = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const todayInputValue = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export default function UserVenueBookingsPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState('');

  // Quotation View / Action Modal State
  const [activeQuotationEnquiry, setActiveQuotationEnquiry] = useState(null);
  const [revisionMode, setRevisionMode] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [visitEnquiryId, setVisitEnquiryId] = useState('');
  const [visitForm, setVisitForm] = useState({ preferredDate: '', preferredTime: '', visitorCount: 1, message: '' });
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
      const data = await getUserVenueEnquiries();
      setEnquiries(data || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || apiError.message || 'Could not load your venue enquiries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleQuotationAction = async (enquiryId, action) => {
    setWorking(`${action}-${enquiryId}`);
    setError('');
    setNotice('');

    try {
      await respondVenueQuotationUser(enquiryId, { action, revisionNotes });
      setNotice(
        action === 'accept'
          ? '✓ Quotation accepted! The vendor will coordinate final booking arrangements.'
          : action === 'request_revision'
          ? '✓ Revision request sent to vendor with your notes.'
          : '✓ Quotation rejected.'
      );
      setActiveQuotationEnquiry(null);
      setRevisionMode(false);
      setRevisionNotes('');
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to submit response.');
    } finally {
      setWorking('');
    }
  };

  const handleVisitRequest = async (event, enquiryId) => {
    event.preventDefault();
    setWorking(`visit-${enquiryId}`);
    setError('');
    setNotice('');
    try {
      await requestVenueVisit(enquiryId, {
        ...visitForm,
        visitorCount: Number(visitForm.visitorCount),
      });
      setNotice('Venue visit request submitted successfully.');
      setVisitEnquiryId('');
      setVisitForm({ preferredDate: '', preferredTime: '', visitorCount: 1, message: '' });
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Could not submit the venue visit request.');
    } finally {
      setWorking('');
    }
  };

  const handleConfirmProposedVisit = async (enquiryId) => {
    setWorking(`confirm-visit-${enquiryId}`);
    setError('');
    setNotice('');
    try {
      await confirmVenueVisitProposal(enquiryId);
      setNotice('Proposed venue visit time confirmed.');
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Could not confirm the proposed venue visit.');
    } finally {
      setWorking('');
    }
  };

  return (
    <main className="user-bookings-page container py-4">
      <header className="user-bookings-heading mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <p className="eyebrow text-uppercase text-primary fw-bold mb-1" style={{ fontSize: '0.8rem' }}>Customer Portal</p>
          <h1 className="h2 fw-bold text-dark mb-1">My Bookings</h1>
          <p className="text-muted small mb-0">Track your venue requests, review quotations, and keep your event plans in one place.</p>
        </div>
        <Link className="btn btn-primary fw-bold" to="/venues">Explore Venues</Link>
      </header>

      {notice && <div className="alert alert-success small mb-4">{notice}</div>}
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4" role="alert">
          <div><strong>Error:</strong> {error}</div>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={refresh}>🔄 Retry</button>
        </div>
      )}

      {loading && <div className="user-bookings-loading text-center py-5 text-muted" role="status">Loading your bookings…</div>}

      {!loading && !error && (
        <section className="row row-cols-2 row-cols-xl-4 g-3 booking-summary-grid mb-4" aria-label="Booking summary">
          <div className="col"><article className="card booking-summary-card h-100">
            <span className="summary-card-mark" aria-hidden="true"></span>
            <span>Total bookings</span>
            <strong>{summary.total}</strong>
            <small>Venue requests and bookings</small>
          </article></div>
          <div className="col"><article className="card booking-summary-card h-100">
            <span className="summary-card-mark" aria-hidden="true"></span>
            <span>Pending</span>
            <strong>{summary.pending}</strong>
            <small>Awaiting a response</small>
          </article></div>
          <div className="col"><article className="card booking-summary-card h-100">
            <span className="summary-card-mark" aria-hidden="true"></span>
            <span>Confirmed</span>
            <strong>{summary.confirmed}</strong>
            <small>Confirmed bookings</small>
          </article></div>
          <div className="col"><article className="card booking-summary-card h-100">
            <span className="summary-card-mark" aria-hidden="true"></span>
            <span>Completed</span>
            <strong>{summary.completed}</strong>
            <small>Past completed bookings</small>
          </article></div>
        </section>
      )}

      {!loading && !error && enquiries.length === 0 && (
        <div className="card user-bookings-empty text-center p-5 border-dashed">
          <h2 className="h4 fw-bold text-dark mb-2">No venue enquiries submitted yet.</h2>
          <p className="text-muted small mb-3">Browse our curated wedding venues and send enquiries for your event dates.</p>
          <div><Link className="btn btn-primary" to="/venues">Browse Wedding Venues</Link></div>
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
                <article className={`card user-booking-card user-venue-request-card shadow-sm border rounded-3 p-4 bg-white${enquiry.venue?.coverImage ? ' has-venue-image' : ''}`}>
                  {enquiry.venue?.coverImage && (
                    <VenueImage
                      className="user-booking-image"
                      src={enquiry.venue.coverImage}
                      alt={`${enquiry.venueName || enquiry.venue?.venueName || 'Venue'}`}
                    />
                  )}
                  <div className="user-booking-info">
                  <div className="user-booking-header d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                    <div>
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                        <span className="badge user-booking-kind px-2 py-1">
                          {enquiry.isBookingRecord ? 'Venue booking' : `Venue request · ${schedule.length} function${schedule.length > 1 ? 's' : ''}`}
                        </span>
                        {q?.quotationStatus && (
                          <span className={`badge user-quote-status user-quote-${q.quotationStatus} px-2 py-1`}>
                            Quote {q.quotationStatus.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <h3 className="h5 fw-bold text-dark mb-1">
                        {enquiry.venueName || enquiry.venue?.venueName || 'Venue'}
                      </h3>
                      <p className="user-booking-vendor text-muted small mb-0">
                        <span>{enquiry.city || enquiry.venue?.city || 'Location not provided'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{enquiry.vendor?.businessName || enquiry.vendor?.name || 'Venue vendor'}</span>
                      </p>
                    </div>

                    <span className={`badge user-booking-status booking-status-${enquiry.status}`}>
                      {enquiry.status === 'quotation_sent' ? 'Quotation received' : enquiry.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* MULTI-DATE SCHEDULE BREAKDOWN */}
                  <div className="user-booking-schedule p-3 rounded mb-3">
                    <h4 className="h6 fw-bold text-dark mb-2">Event schedule</h4>
                    <div className="row g-2">
                      {schedule.map((item, idx) => (
                        <div className="col-12 col-md-4" key={idx}>
                          <div className="user-booking-event p-2 border bg-white rounded small">
                            <strong className="d-block text-primary">{item.eventType || 'Function'}</strong>
                            <div className="user-booking-event-meta"><span>Date</span><strong>{dateLabel(item.eventDate)}</strong></div>
                            <div className="user-booking-event-meta"><span>Guests</span><strong>{item.guestCount ?? '—'}</strong></div>
                            {(item.startTime || item.endTime) && (
                              <div className="user-booking-event-meta"><span>Time</span><strong>{item.startTime || '—'}{item.endTime ? `–${item.endTime}` : ''}</strong></div>
                            )}
                            {item.requirements && <p className="user-booking-requirements"><strong>Requirements:</strong> {item.requirements}</p>}
                            {item.notes && <p className="user-booking-notes">{item.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="user-booking-facts">
                    <div><span>Booking ID</span><strong title={enquiry._id}>{enquiry._id}</strong></div>
                    <div><span>Booking amount</span><strong>{bookingAmount !== undefined && bookingAmount !== null ? formatPrice(bookingAmount) : 'Not quoted yet'}</strong></div>
                  </div>

                  {/* VENDOR QUICK RESPONSE / QUOTATION STATUS */}
                  {enquiry.response && !q && (
                    <div className="user-vendor-response p-3 rounded mb-3 small text-dark">
                      <p className="fw-bold mb-1">Vendor Availability Update: {enquiry.response.availabilityStatus === 'available' ? '✓ Dates Available' : 'Unavailable'}</p>
                      {enquiry.response.estimatedPrice > 0 && <p className="mb-1">Estimated Quote: <strong>{formatPrice(enquiry.response.estimatedPrice)}</strong></p>}
                      {enquiry.response.vendorMessage && <p className="mb-0">"{enquiry.response.vendorMessage}"</p>}
                    </div>
                  )}

                  {enquiry.response?.eventAvailabilities?.length > 0 && (
                    <section className="user-vendor-response p-3 rounded mb-3 small text-dark" aria-label="Vendor availability by event date">
                      <strong className="d-block mb-2">Availability by event date</strong>
                      <div className="row g-2">
                        {enquiry.response.eventAvailabilities.map((event) => (
                          <div className="col-12 col-md-6" key={event.eventIndex}>
                            <div className="p-2 bg-white border rounded h-100">
                              <strong>{event.eventType} · {dateLabel(event.eventDate)}</strong>
                              <div className="my-1">
                                <span className={`badge ${event.status === 'available' ? 'text-bg-success' : event.status === 'not_available' ? 'text-bg-danger' : 'text-bg-warning'}`}>
                                  {event.status.replaceAll('_', ' ')}
                                </span>
                              </div>
                              {event.reason && <p className="mb-1">{event.reason}</p>}
                              {event.alternativeDate && <p className="mb-0">Alternative date: <strong>{dateLabel(event.alternativeDate)}</strong></p>}
                            </div>
                          </div>
                        ))}
                      </div>
                      {enquiry.response.vendorMessage && <p className="mt-2 mb-0">{enquiry.response.vendorMessage}</p>}
                    </section>
                  )}

                  {q && (
                    <div className="user-quotation-summary p-3 rounded mb-3 small text-dark">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong className="fs-6">Itemized quotation</strong>
                        <span className="badge">{q.quotationStatus?.replace('_', ' ')}</span>
                      </div>
                      <div className="row g-2">
                        <div className="col-6 col-md-3">Base Price: <strong>{formatPrice(q.baseVenuePrice)}</strong></div>
                        <div className="col-6 col-md-3">Total Estimate: <strong className="user-quotation-total fs-6">{formatPrice(q.totalEstimatedAmount)}</strong></div>
                        <div className="col-6 col-md-3">Advance Required ({q.advancePercentage}%): <strong>{formatPrice(q.advanceAmount)}</strong></div>
                        <div className="col-6 col-md-3">Remaining: <strong>{formatPrice(q.remainingAmount)}</strong></div>
                      </div>
                    </div>
                  )}

                  {!enquiry.isBookingRecord && q?.quotationStatus === 'accepted' && (
                    <section className="user-visit-workflow p-3 rounded mb-3" aria-label="Venue visit">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                        <strong className="fs-6">Venue visit</strong>
                        {enquiry.visit?.status && <span className="badge text-bg-light">{enquiry.visit.status.replaceAll('_', ' ')}</span>}
                      </div>
                      {enquiry.visit ? (
                        <>
                          <div className="row g-2 small text-dark">
                            <div className="col-12 col-md-6">Requested date and time: <strong>{dateLabel(enquiry.visit.preferredDate)} at {enquiry.visit.preferredTime}</strong></div>
                            <div className="col-12 col-md-6">Visitors: <strong>{enquiry.visit.visitorCount}</strong></div>
                            <div className="col-12">Quotation reference: <strong>Revision {enquiry.visit.quotationRevision}</strong></div>
                            {enquiry.visit.message && <div className="col-12">Your message: {enquiry.visit.message}</div>}
                            {enquiry.visit.proposedDate && <div className="col-12">Vendor proposed: <strong>{dateLabel(enquiry.visit.proposedDate)} at {enquiry.visit.proposedTime}</strong></div>}
                            {enquiry.visit.vendorMessage && <div className="col-12">Vendor response: {enquiry.visit.vendorMessage}</div>}
                          </div>
                          {enquiry.visit.status === 'proposed' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-success mt-3"
                              disabled={working === `confirm-visit-${enquiry._id}`}
                              onClick={() => handleConfirmProposedVisit(enquiry._id)}
                            >
                              {working === `confirm-visit-${enquiry._id}` ? 'Confirming…' : 'Confirm Proposed Time'}
                            </button>
                          )}
                          {enquiry.visit.status === 'rejected' && (
                            <button
                              type="button"
                              className="btn btn-outline-primary mt-3"
                              onClick={() => {
                                setVisitEnquiryId(enquiry._id);
                                setVisitForm({ preferredDate: '', preferredTime: '', visitorCount: 1, message: '' });
                              }}
                            >
                              Request Another Visit
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => {
                            setVisitEnquiryId(visitEnquiryId === enquiry._id ? '' : enquiry._id);
                            setVisitForm({ preferredDate: '', preferredTime: '', visitorCount: 1, message: '' });
                          }}
                        >
                          Visit Venue
                        </button>
                      )}

                      {visitEnquiryId === enquiry._id && (
                        <form className="mt-3 p-3 bg-white border rounded" onSubmit={(event) => handleVisitRequest(event, enquiry._id)}>
                          <h4 className="h6 fw-bold">Request a venue visit</h4>
                          <div className="row g-2">
                            <div className="col-12 col-md-4">
                              <label className="form-label small fw-bold" htmlFor={`visit-date-${enquiry._id}`}>Preferred date</label>
                              <input id={`visit-date-${enquiry._id}`} type="date" className="form-control" min={todayInputValue()} required value={visitForm.preferredDate} onChange={(event) => setVisitForm((previous) => ({ ...previous, preferredDate: event.target.value }))} />
                            </div>
                            <div className="col-12 col-md-4">
                              <label className="form-label small fw-bold" htmlFor={`visit-time-${enquiry._id}`}>Preferred time</label>
                              <input id={`visit-time-${enquiry._id}`} type="time" className="form-control" required value={visitForm.preferredTime} onChange={(event) => setVisitForm((previous) => ({ ...previous, preferredTime: event.target.value }))} />
                            </div>
                            <div className="col-12 col-md-4">
                              <label className="form-label small fw-bold" htmlFor={`visit-count-${enquiry._id}`}>Number of visitors</label>
                              <input id={`visit-count-${enquiry._id}`} type="number" className="form-control" min="1" step="1" required value={visitForm.visitorCount} onChange={(event) => setVisitForm((previous) => ({ ...previous, visitorCount: event.target.value }))} />
                            </div>
                            <div className="col-12">
                              <label className="form-label small fw-bold" htmlFor={`visit-message-${enquiry._id}`}>Message to the vendor (optional)</label>
                              <textarea id={`visit-message-${enquiry._id}`} className="form-control" rows="2" maxLength="2000" value={visitForm.message} onChange={(event) => setVisitForm((previous) => ({ ...previous, message: event.target.value }))} />
                            </div>
                          </div>
                          <div className="d-flex justify-content-end gap-2 mt-3">
                            <button type="button" className="btn btn-sm btn-secondary" onClick={() => setVisitEnquiryId('')}>Cancel</button>
                            <button type="submit" className="btn btn-sm btn-primary" disabled={working === `visit-${enquiry._id}`}>
                              {working === `visit-${enquiry._id}` ? 'Submitting…' : 'Send Visit Request'}
                            </button>
                          </div>
                        </form>
                      )}
                    </section>
                  )}

                  {/* ACTION BUTTONS */}
                  <div className="d-flex justify-content-end gap-2">
                    {q && (
                      <button
                        type="button"
                        className="btn btn-primary fw-bold"
                        onClick={() => {
                          setActiveQuotationEnquiry(enquiry);
                          setRevisionMode(false);
                        }}
                      >
                        {['sent', 'revision_requested'].includes(q.quotationStatus)
                          ? '🔍 View Full Quotation Breakdown & Respond'
                          : '🔍 View Full Quotation'}
                      </button>
                    )}
                  </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL QUOTATION DETAILS & RESPONSE MODAL */}
      {activeQuotationEnquiry && (
        <div className="modal-overlay position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center overflow-auto py-4" style={{ zIndex: 1060 }}>
          <div className="card shadow-lg border-0 rounded-3 p-4 my-auto" style={{ maxWidth: '720px', width: '95%' }}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <div>
                <h3 className="h5 fw-bold text-dark mb-0">📄 Formal Quotation Breakdown</h3>
                <p className="text-muted small mb-0">Venue: <strong>{activeQuotationEnquiry.venueName}</strong> · Vendor: <strong>{activeQuotationEnquiry.vendor?.businessName || activeQuotationEnquiry.vendor?.name}</strong></p>
              </div>
              <button type="button" className="btn-close" onClick={() => setActiveQuotationEnquiry(null)}></button>
            </div>

            {activeQuotationEnquiry.quotation && (
              <div>
                {/* EVENT BREAKDOWN */}
                {activeQuotationEnquiry.quotation.eventsBreakdown?.length > 0 && (
                  <div className="p-3 bg-light rounded border mb-3">
                    <h4 className="h6 fw-bold text-dark mb-2">Event Function Charges</h4>
                    {activeQuotationEnquiry.quotation.eventsBreakdown.map((item, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center py-1 border-bottom small">
                        <div>
                          <strong>{item.eventType}</strong> ({dateLabel(item.eventDate)}) — <span className="text-muted">{item.guestCount} guests</span>
                        </div>
                        <strong className="text-dark">{formatPrice(item.charge)}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {/* ITEMIZATION TABLE */}
                <div className="table-responsive mb-3">
                  <table className="table table-bordered table-sm text-secondary small">
                    <tbody>
                      <tr>
                        <td>Base Venue Rental Charge</td>
                        <td className="text-end fw-bold">{formatPrice(activeQuotationEnquiry.quotation.baseVenuePrice)}</td>
                      </tr>
                      {activeQuotationEnquiry.quotation.perEventTotal > 0 && (
                        <tr>
                          <td>Per-Event Total Charges</td>
                          <td className="text-end fw-bold">{formatPrice(activeQuotationEnquiry.quotation.perEventTotal)}</td>
                        </tr>
                      )}
                      {activeQuotationEnquiry.quotation.additionalServiceCharges > 0 && (
                        <tr>
                          <td>Additional Service Charges</td>
                          <td className="text-end fw-bold">{formatPrice(activeQuotationEnquiry.quotation.additionalServiceCharges)}</td>
                        </tr>
                      )}
                      {activeQuotationEnquiry.quotation.cateringCharges > 0 && (
                        <tr>
                          <td>Catering Charges</td>
                          <td className="text-end fw-bold">{formatPrice(activeQuotationEnquiry.quotation.cateringCharges)}</td>
                        </tr>
                      )}
                      {activeQuotationEnquiry.quotation.decorationCharges > 0 && (
                        <tr>
                          <td>Decoration Charges</td>
                          <td className="text-end fw-bold">{formatPrice(activeQuotationEnquiry.quotation.decorationCharges)}</td>
                        </tr>
                      )}
                      {activeQuotationEnquiry.quotation.tax > 0 && (
                        <tr>
                          <td>Taxes & Fees</td>
                          <td className="text-end fw-bold">{formatPrice(activeQuotationEnquiry.quotation.tax)}</td>
                        </tr>
                      )}
                      {activeQuotationEnquiry.quotation.discount > 0 && (
                        <tr>
                          <td className="text-danger">Discount</td>
                          <td className="text-end fw-bold text-danger">-{formatPrice(activeQuotationEnquiry.quotation.discount)}</td>
                        </tr>
                      )}
                      <tr className="table-primary fw-bold">
                        <td className="fs-6">Total Estimated Amount</td>
                        <td className="text-end fs-6 text-primary">{formatPrice(activeQuotationEnquiry.quotation.totalEstimatedAmount)}</td>
                      </tr>
                      <tr>
                        <td>Advance Required ({activeQuotationEnquiry.quotation.advancePercentage}%)</td>
                        <td className="text-end fw-bold text-success">{formatPrice(activeQuotationEnquiry.quotation.advanceAmount)}</td>
                      </tr>
                      <tr>
                        <td>Remaining Balance</td>
                        <td className="text-end fw-bold">{formatPrice(activeQuotationEnquiry.quotation.remainingAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {activeQuotationEnquiry.quotation.paymentTerms && (
                  <div className="p-2 bg-light border rounded mb-2 small">
                    <strong>Payment Terms:</strong> {activeQuotationEnquiry.quotation.paymentTerms}
                  </div>
                )}

                {activeQuotationEnquiry.quotation.validUntil && (
                  <div className="p-2 bg-light border rounded mb-2 small">
                    <strong>Valid until:</strong> {dateLabel(activeQuotationEnquiry.quotation.validUntil)}
                  </div>
                )}

                {activeQuotationEnquiry.quotation.vendorNotes && (
                  <div className="p-2 bg-light border rounded mb-3 small">
                    <strong>Vendor Notes & Inclusions:</strong> "{activeQuotationEnquiry.quotation.vendorNotes}"
                  </div>
                )}

                {activeQuotationEnquiry.quotation.termsAndConditions && (
                  <div className="p-2 bg-light border rounded mb-3 small">
                    <strong>Terms & Conditions:</strong> {activeQuotationEnquiry.quotation.termsAndConditions}
                  </div>
                )}

                {/* REVISION REQUEST TEXT AREA */}
                {revisionMode && (
                  <div className="p-3 bg-warning-subtle border border-warning rounded mb-3">
                    <label className="form-label small fw-bold text-dark">Request Changes / Revision Notes for Vendor *</label>
                    <textarea
                      className="form-control form-control-sm mb-2"
                      rows="3"
                      placeholder="Specify your requested price adjustments, date changes, or requirement updates..."
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                    />
                    <div className="d-flex justify-content-end gap-2">
                      <button type="button" className="btn btn-sm btn-secondary" onClick={() => setRevisionMode(false)}>Cancel</button>
                      <button
                        type="button"
                        className="btn btn-sm btn-warning fw-bold"
                        disabled={!revisionNotes.trim() || working.includes(activeQuotationEnquiry._id)}
                        onClick={() => handleQuotationAction(activeQuotationEnquiry._id, 'request_revision')}
                      >
                        Submit Revision Request
                      </button>
                    </div>
                  </div>
                )}

                {/* USER ACTION BUTTONS */}
                {!revisionMode && ['sent', 'revision_requested'].includes(activeQuotationEnquiry.quotation.quotationStatus) && (
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      disabled={working.includes(activeQuotationEnquiry._id)}
                      onClick={() => handleQuotationAction(activeQuotationEnquiry._id, 'reject')}
                    >
                      Decline Quotation
                    </button>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-warning text-dark fw-bold"
                        onClick={() => setRevisionMode(true)}
                      >
                        ✏️ Request Changes / Revision
                      </button>
                      <button
                        type="button"
                        className="btn btn-success fw-bold"
                        disabled={working.includes(activeQuotationEnquiry._id)}
                        onClick={() => handleQuotationAction(activeQuotationEnquiry._id, 'accept')}
                      >
                        ✓ Accept Quotation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
