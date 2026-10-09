import api from './api';

export async function getVenueUploadSignature() {
  const response = await api.post('/uploads/venue-signature');
  return response.data.data;
}
