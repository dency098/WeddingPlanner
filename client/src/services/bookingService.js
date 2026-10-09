import api from './api';

export async function requestVenueBooking(data) {
  const response = await api.post('/bookings', data);
  return response.data;
}

export async function getUserVenueBookings() {
  const response = await api.get('/bookings/user/my');
  return response.data.data;
}

export async function getUserVenueBooking(id) {
  const response = await api.get(`/bookings/user/my/${id}`);
  return response.data.data;
}

export async function getVendorVenueBookings() {
  const response = await api.get('/bookings/vendor/my');
  return response.data.data;
}

export async function respondToVenueBooking(id, status, vendorResponse = '') {
  const response = await api.patch(`/bookings/vendor/${id}/respond`, { status, vendorResponse });
  return response.data;
}

export async function sendVenueBookingQuotation(id, quotation) {
  const response = await api.post(`/bookings/vendor/${id}/quotation`, quotation);
  return response.data;
}

export async function respondToVenueBookingQuotation(id, status) {
  const response = await api.patch(`/bookings/user/my/${id}/quotation`, { status });
  return response.data;
}

export async function cancelVenueBooking(id, reason = '') {
  const response = await api.patch(`/bookings/user/my/${id}/cancel`, { reason });
  return response.data;
}

export async function cancelVendorVenueBooking(id, reason) {
  const response = await api.patch(`/bookings/vendor/${id}/cancel`, { reason });
  return response.data;
}

export async function cancelAdminVenueBooking(id, reason) {
  const response = await api.patch(`/bookings/admin/${id}/cancel`, { reason });
  return response.data;
}

export async function completeAdminVenueBooking(id) {
  const response = await api.patch(`/bookings/admin/${id}/complete`);
  return response.data;
}

export async function getAdminVenueBookings(status) {
  const response = await api.get('/bookings/admin', { params: status ? { status } : {} });
  return response.data.data;
}

export async function requestVendorVenueVisit(id, visitDate) {
  const response = await api.patch(`/bookings/vendor/${id}/visit`, { visitDate });
  return response.data;
}

export async function confirmUserVenueVisit(id) {
  const response = await api.patch(`/bookings/user/my/${id}/visit`);
  return response.data;
}
