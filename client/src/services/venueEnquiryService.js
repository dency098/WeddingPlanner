import api from './api';

export async function createVenueEnquiry(payload) {
  const response = await api.post('/venue-enquiries', payload);
  return response.data;
}

export async function createTestVenueEnquiry(venueId) {
  const response = await api.post('/venue-enquiries/vendor/test-enquiry', { venueId });
  return response.data;
}

export async function getVendorVenueEnquiries() {
  const response = await api.get('/venue-enquiries/vendor/my');
  return response.data.data;
}

export async function getUserVenueEnquiries() {
  const response = await api.get('/venue-enquiries/user/my');
  return response.data.data;
}

export async function sendVenueQuotation(id, payload) {
  const response = await api.post(`/venue-enquiries/${id}/quotation`, payload);
  return response.data;
}

export async function respondVenueQuotationUser(id, payload) {
  const response = await api.post(`/venue-enquiries/${id}/quotation-response`, payload);
  return response.data;
}

export async function respondVenueEnquiry(id, payload) {
  const response = await api.post(`/venue-enquiries/${id}/respond`, payload);
  return response.data;
}

export async function requestVenueVisit(id, payload) {
  const response = await api.post(`/venue-enquiries/${id}/visit`, payload);
  return response.data;
}

export async function respondVenueVisit(id, payload) {
  const response = await api.patch(`/venue-enquiries/${id}/visit-response`, payload);
  return response.data;
}

export async function confirmVenueVisitProposal(id) {
  const response = await api.patch(`/venue-enquiries/${id}/visit-confirmation`);
  return response.data;
}
