import api from './api';

export const getVendorPortfolio = async (vendorId) => {
  const response = await api.get(`/portfolio/vendor/${vendorId}`);
  return response.data.data;
};

export const createPortfolioItem = async (data) => {
  const response = await api.post('/portfolio', data);
  return response.data;
};
