const EVENT_TYPES = [
  'Wedding Ceremony',
  'Sangeet / DJ Night',
  'Reception',
  'Engagement',
  'Mehndi',
  'Haldi',
  'Birthday',
  'Corporate Event',
  'Other',
];

export default function EventScheduleForm({ schedule, onChange, minGuests, maxGuests }) {
  const handleAddEvent = () => {
    const newEvent = {
      eventType: 'Wedding Ceremony',
      eventDate: '',
      guestCount: minGuests || 100,
      startTime: '',
      endTime: '',
      requirements: '',
      notes: '',
    };
    onChange([...schedule, newEvent]);
  };

  const handleRemoveEvent = (index) => {
    if (schedule.length <= 1) return;
    const updated = schedule.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = schedule.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange(updated);
  };

  return (
    <div className="wedding-schedule-container border rounded p-3 bg-light mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h3 className="h6 fw-bold text-dark mb-0">📅 Wedding Event Schedule</h3>
          <small className="text-muted">Add all wedding functions and event dates to receive accurate quotes.</small>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-primary fw-bold"
          onClick={handleAddEvent}
        >
          + Add Another Event
        </button>
      </div>

      {schedule.map((eventItem, index) => (
        <div key={index} className="card p-3 mb-3 border bg-white shadow-sm position-relative">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="badge bg-secondary text-uppercase" style={{ fontSize: '0.75rem' }}>
              Function #{index + 1}
            </span>
            {schedule.length > 1 && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger py-0 px-2"
                onClick={() => handleRemoveEvent(index)}
                title="Remove Event"
              >
                ✕ Remove
              </button>
            )}
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold text-secondary mb-1">Event Type / Function *</label>
              <select
                className="form-select form-select-sm"
                value={eventItem.eventType}
                onChange={(e) => handleItemChange(index, 'eventType', e.target.value)}
                required
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold text-secondary mb-1">Event Date *</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={typeof eventItem.eventDate === 'string' ? eventItem.eventDate.slice(0, 10) : ''}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => handleItemChange(index, 'eventDate', e.target.value)}
                required
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold text-secondary mb-1">Expected Guests *</label>
              <input
                type="number"
                className="form-control form-control-sm"
                min={minGuests || 1}
                max={maxGuests || 5000}
                value={eventItem.guestCount}
                onChange={(e) => handleItemChange(index, 'guestCount', Number(e.target.value))}
                required
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label small fw-bold text-secondary mb-1">Start Time</label>
              <input
                type="time"
                className="form-control form-control-sm"
                value={eventItem.startTime || ''}
                onChange={(e) => handleItemChange(index, 'startTime', e.target.value)}
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label small fw-bold text-secondary mb-1">End Time</label>
              <input
                type="time"
                className="form-control form-control-sm"
                value={eventItem.endTime || ''}
                onChange={(e) => handleItemChange(index, 'endTime', e.target.value)}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold text-secondary mb-1">Function-specific requirements</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Catering, stage, setup, or other requirements"
                value={eventItem.requirements || ''}
                onChange={(e) => handleItemChange(index, 'requirements', e.target.value)}
              />
            </div>

            <div className="col-12">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Notes for this event..."
                value={eventItem.notes || ''}
                onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
