const express = require('express');
const {
  createInquiry,
  createTestEnquiry,
  getVendorInquiries,
  getUserInquiries,
  getAdminInquiries,
  respondEnquiry,
  sendQuotation,
  updateInquiryStatus,
} = require('../controllers/cateringInquiryController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// User routes
router.post('/', authMiddleware, authorizeRoles('user', 'vendor'), createInquiry);
router.get('/user/my', authMiddleware, authorizeRoles('user', 'vendor'), getUserInquiries);
router.patch('/user/:id/status', authMiddleware, authorizeRoles('user', 'vendor'), updateInquiryStatus);
router.post('/:id/quotation-response', authMiddleware, authorizeRoles('user', 'vendor'), updateInquiryStatus);

// Vendor routes
router.get('/vendor/my', authMiddleware, authorizeRoles('vendor'), getVendorInquiries);
router.post('/vendor/test-enquiry', authMiddleware, authorizeRoles('vendor'), createTestEnquiry);
router.post('/vendor/:id/respond', authMiddleware, authorizeRoles('vendor'), respondEnquiry);
router.post('/:id/quotation', authMiddleware, authorizeRoles('vendor'), sendQuotation);
router.patch('/vendor/:id/quotation', authMiddleware, authorizeRoles('vendor'), sendQuotation);

// Admin routes
router.get('/admin', authMiddleware, authorizeRoles('admin'), getAdminInquiries);

module.exports = router;
