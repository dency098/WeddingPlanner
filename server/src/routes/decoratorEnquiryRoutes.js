const express = require('express');
const {
  createEnquiry,
  getVendorEnquiries,
  getUserEnquiries,
  getEnquiryDetails,
  sendQuotation,
  respondToQuotationUser,
  respondEnquiry,
} = require('../controllers/decoratorEnquiryController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, authorizeRoles('user', 'vendor'), createEnquiry);
router.get('/vendor/my', authMiddleware, authorizeRoles('vendor'), getVendorEnquiries);
router.get('/user/my', authMiddleware, authorizeRoles('user', 'vendor'), getUserEnquiries);
router.get('/:id', authMiddleware, getEnquiryDetails);
router.post('/:id/quotation', authMiddleware, authorizeRoles('vendor'), sendQuotation);
router.post('/:id/quotation-response', authMiddleware, authorizeRoles('user', 'vendor'), respondToQuotationUser);
router.post('/:id/respond', authMiddleware, authorizeRoles('vendor'), respondEnquiry);

module.exports = router;
