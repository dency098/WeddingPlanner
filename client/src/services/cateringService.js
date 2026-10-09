import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const handleResponse = (response) => response.data?.data;
const handleError = (error) => {
  throw error;
};

export const getPublicCatering = () => axios.get(`${API_URL}/catering`, { withCredentials: true }).then(handleResponse).catch(handleError);

export const getVendorCatering = () => axios.get(`${API_URL}/catering/vendor/my`, { withCredentials: true }).then(handleResponse).catch(handleError);

export const getAdminCatering = (status) => axios.get(`${API_URL}/catering/admin${status ? `?approvalStatus=${status}` : ''}`, { withCredentials: true }).then(handleResponse).catch(handleError);

export const createCatering = (data) => axios.post(`${API_URL}/catering`, data, { withCredentials: true }).then((res) => res.data).catch(handleError);

export const updateCatering = (id, data) => axios.put(`${API_URL}/catering/${id}`, data, { withCredentials: true }).then((res) => res.data).catch(handleError);

export const deleteCatering = (id) => axios.delete(`${API_URL}/catering/${id}`, { withCredentials: true }).then((res) => res.data).catch(handleError);

export const setCateringActive = (id, isActive) => axios.patch(`${API_URL}/catering/${id}/status`, { isActive }, { withCredentials: true }).then((res) => res.data).catch(handleError);

export const moderateCatering = (id, approvalStatus, rejectionReason) => axios.patch(`${API_URL}/catering/admin/${id}/status`, { approvalStatus, rejectionReason }, { withCredentials: true }).then((res) => res.data).catch(handleError);
