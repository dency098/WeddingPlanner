import api from './api';

export async function searchVenues(filters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => value !== '' && value !== undefined && value !== null)
      .map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : value])
  );
  const response = await api.get('/venues', { params });
  return response.data.data;
}

export async function getVenue(id) {
  const response = await api.get(`/venues/${id}`);
  return response.data.data;
}

export async function checkVenueAvailability(id, dates, guests) {
  const params = {};
  if (Array.isArray(dates) && dates.some((event) => typeof event === 'object' && event !== null)) {
    params.events = JSON.stringify(dates);
  } else if (Array.isArray(dates)) {
    params.dates = dates.join(',');
    params.guests = guests;
  } else {
    params.dates = dates;
    params.guests = guests;
  }
  const response = await api.get(`/venues/${id}/availability`, { params });
  return response.data.data;
}

export async function getVendorVenues() {
  const response = await api.get('/venues/vendor/my');
  return response.data.data;
}

export async function getVendorVenue(id) {
  const response = await api.get(`/venues/vendor/my/${id}`);
  return response.data.data;
}

export async function createVenue(data) {
  const response = await api.post('/venues', data);
  return response.data;
}

export async function updateVenue(id, data) {
  const response = await api.put(`/venues/${id}`, data);
  return response.data;
}

export async function deleteVenue(id) {
  const response = await api.delete(`/venues/${id}`);
  return response.data;
}

export async function setVenueActive(id, isActive) {
  const response = await api.patch(`/venues/${id}/status`, { isActive });
  return response.data;
}

export async function updateBlockedDates(id, blockedDates, blockedDateDetails) {
  const payload = { blockedDates };
  if (blockedDateDetails) payload.blockedDateDetails = blockedDateDetails;
  const response = await api.patch(`/venues/${id}/availability`, payload);
  return response.data;
}

export async function getAdminVenues(approvalStatus) {
  const response = await api.get('/venues/admin', {
    params: approvalStatus ? { approvalStatus } : {},
  });
  return response.data;
}

export async function moderateVenue(id, approvalStatus, rejectionReason) {
  const response = await api.patch(`/venues/admin/${id}/status`, { approvalStatus, rejectionReason });
  return response.data;
}
