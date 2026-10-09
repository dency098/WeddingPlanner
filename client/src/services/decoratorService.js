import api from './api';

export async function getPublicDecorators(params = {}) {
  const response = await api.get('/decorators', { params });
  return response.data.data;
}

export async function getPublicDecorator(id) {
  const response = await api.get(`/decorators/${id}`);
  return response.data.data;
}

export async function getVendorDecorators() {
  const response = await api.get('/decorators/vendor/my');
  return response.data.data;
}

export async function getVendorDecorator(id) {
  const response = await api.get(`/decorators/vendor/my/${id}`);
  return response.data.data;
}

export async function createDecorator(payload) {
  const response = await api.post('/decorators', payload);
  return response.data;
}

export async function updateDecorator(id, payload) {
  const response = await api.put(`/decorators/${id}`, payload);
  return response.data;
}

export async function deleteDecorator(id) {
  const response = await api.delete(`/decorators/${id}`);
  return response.data;
}

export async function setDecoratorActive(id, isActive) {
  const response = await api.patch(`/decorators/${id}/status`, { isActive });
  return response.data;
}

export async function getAdminDecorators(approvalStatus = '') {
  const response = await api.get('/decorators/admin', {
    params: approvalStatus ? { approvalStatus } : {},
  });
  return response.data;
}

export async function moderateDecorator(id, status, rejectionReason = '') {
  const response = await api.patch(`/decorators/admin/${id}/status`, {
    status,
    rejectionReason,
  });
  return response.data;
}

