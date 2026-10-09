import api from './api';

export async function createDecoratorEnquiry(payload) {
  const response = await api.post('/decorator-enquiries', payload);
  return response.data;
}

export async function getVendorDecoratorEnquiries() {
  const response = await api.get('/decorator-enquiries/vendor/my');
  return response.data.data;
}

export async function getUserDecoratorEnquiries() {
  const response = await api.get('/decorator-enquiries/user/my');
  return response.data.data;
}

export async function getDecoratorEnquiryDetails(id) {
  const response = await api.get(`/decorator-enquiries/${id}`);
  return response.data.data;
}

export async function respondDecoratorEnquiry(id, payload) {
  const response = await api.post(`/decorator-enquiries/${id}/respond`, payload);
  return response.data;
}

