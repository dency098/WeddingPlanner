const express = require('express');
const {
  createEnquiry,
  createTestEnquiry,
  getVendorEnquiries,
  getUserEnquiries,
  createOrUpdateQuotation,
  respondToQuotationUser,
  respondEnquiry,
  requestEnquiryVisit,
  respondToEnquiryVisit,
  confirmEnquiryVisitProposal,
} = require('../controllers/venueEnquiryController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, authorizeRoles('user', 'vendor'), createEnquiry);
router.post('/vendor/test-enquiry', authMiddleware, authorizeRoles('vendor'), createTestEnquiry);
router.get('/vendor/my', authMiddleware, authorizeRoles('vendor'), getVendorEnquiries);
router.get('/user/my', authMiddleware, authorizeRoles('user', 'vendor'), getUserEnquiries);
router.post('/:id/quotation', authMiddleware, authorizeRoles('vendor'), createOrUpdateQuotation);
router.post('/:id/quotation-response', authMiddleware, authorizeRoles('user', 'vendor'), respondToQuotationUser);
router.post('/:id/respond', authMiddleware, authorizeRoles('vendor'), respondEnquiry);
router.post('/:id/visit', authMiddleware, authorizeRoles('user'), requestEnquiryVisit);
router.patch('/:id/visit-response', authMiddleware, authorizeRoles('vendor'), respondToEnquiryVisit);
router.patch('/:id/visit-confirmation', authMiddleware, authorizeRoles('user'), confirmEnquiryVisitProposal);

module.exports = router;
