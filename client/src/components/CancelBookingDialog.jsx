import { useState } from 'react';

export default function CancelBookingDialog({ booking, onClose, onConfirm, working = false, requestError = '' }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Please enter a cancellation reason.');
      return;
    }
    setError('');
    await onConfirm(reason.trim());
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !working) onClose();
    }}>
      <section className="cancel-dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-dialog-title">
        <h2 id="cancel-dialog-title">Cancel booking</h2>
        <p>Are you sure you want to cancel this booking?</p>
        <div className="cancellation-policy">
          <strong>Cancellation policy</strong>
          <p>{booking.venue?.cancellationPolicy || 'No cancellation policy has been provided by this venue.'}</p>
          <small>Any refund, if applicable, will be handled according to the venue policy. No refund amount is calculated here.</small>
        </div>
        <form onSubmit={submit}>
          <label htmlFor="cancel-reason">Cancellation reason <span aria-hidden="true">*</span></label>
          <textarea
            id="cancel-reason"
            rows="4"
            maxLength="1000"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            autoFocus
          />
          {error && <p className="venue-alert error" role="alert">{error}</p>}
          {requestError && <p className="venue-alert error" role="alert">{requestError}</p>}
          <div className="dialog-actions">
            <button className="secondary-button" type="button" disabled={working} onClick={onClose}>Keep booking</button>
            <button className="danger-button" type="submit" disabled={working}>{working ? 'Cancelling…' : 'Cancel booking'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
