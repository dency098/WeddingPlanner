import axios from 'axios';
import api from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const handleResponse = (response) => response.data?.data;
const handleError = (error) => {
  throw error;
};

export const createCateringInquiry = (data) => axios.post(`${API_URL}/catering-inquiries`, data, { withCredentials: true }).then((res) => res.data).catch(handleError);

export const getUserCateringInquiries = () => axios.get(`${API_URL}/catering-inquiries/user/my`, { withCredentials: true }).then(handleResponse).catch(handleError);

export const getVendorCateringInquiries = () => axios.get(`${API_URL}/catering-inquiries/vendor/my`, { withCredentials: true }).then(handleResponse).catch(handleError);

export const getAdminCateringInquiries = () => axios.get(`${API_URL}/catering-inquiries/admin`, { withCredentials: true }).then(handleResponse).catch(handleError);

export const respondCateringInquiry = (id, data) => axios.post(`${API_URL}/catering-inquiries/vendor/${id}/respond`, data, { withCredentials: true }).then((res) => res.data).catch(handleError);

export const createTestCateringInquiry = (cateringId) => axios.post(`${API_URL}/catering-inquiries/vendor/test-enquiry`, { cateringId }, { withCredentials: true }).then((res) => res.data).catch(handleError);

export const sendCateringQuotation = (id, data) => axios.patch(`${API_URL}/catering-inquiries/vendor/${id}/quotation`, data, { withCredentials: true }).then((res) => res.data).catch(handleError);

export const updateCateringInquiryStatus = (id, data) => axios.patch(`${API_URL}/catering-inquiries/user/${id}/status`, data, { withCredentials: true }).then((res) => res.data).catch(handleError);

export const requestVendorCateringTasting = (id, tastingDate) => axios.patch(`${API_URL}/catering-inquiries/vendor/${id}/tasting`, { tastingDate }, { withCredentials: true }).then((res) => res.data).catch(handleError);

export const confirmUserCateringTasting = (id) => axios.patch(`${API_URL}/catering-inquiries/user/${id}/tasting`, {}, { withCredentials: true }).then((res) => res.data).catch(handleError);
