
const express = require('express');

const {
  createPortfolioItem,
  getVendorPortfolio,
} = require('../controllers/portfolioController');

const {
  authMiddleware,
  authorizeRoles,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  authorizeRoles('vendor'),
  createPortfolioItem
);

router.get('/vendor/:vendorId', getVendorPortfolio);

module.exports = router;
