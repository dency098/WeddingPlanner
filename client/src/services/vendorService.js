import api from './api';

export async function getPublicVendorProfile(id) {
  const response = await api.get(`/vendors/${id}`);
  return response.data.data;
}

export async function getOwnVendorProfile() {
  const response = await api.get('/vendors/me');
  return response.data.data;
}

export async function updateOwnVendorProfile(data) {
  const response = await api.patch('/vendors/me', data);
  return response.data;
}
