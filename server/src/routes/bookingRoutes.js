const express = require('express');
const {
  createBooking,
  listUserBookings,
  getUserBooking,
  cancelUserBooking,
  listVendorBookings,
  respondToBooking,
  cancelVendorBooking,
  createBookingQuotation,
  respondToBookingQuotation,
  listAdminBookings,
  cancelAdminBooking,
  completeAdminBooking,
  requestVisit,
  confirmVisit,
} = require('../controllers/bookingController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, authorizeRoles('user'), createBooking);
router.get('/user/my', authMiddleware, authorizeRoles('user'), listUserBookings);
router.get('/user/my/:id', authMiddleware, authorizeRoles('user'), getUserBooking);
router.patch('/user/my/:id/cancel', authMiddleware, authorizeRoles('user'), cancelUserBooking);
router.patch('/user/my/:id/quotation', authMiddleware, authorizeRoles('user'), respondToBookingQuotation);
router.patch('/user/my/:id/visit', authMiddleware, authorizeRoles('user'), confirmVisit);
router.get('/vendor/my', authMiddleware, authorizeRoles('vendor'), listVendorBookings);
router.post('/vendor/:id/quotation', authMiddleware, authorizeRoles('vendor'), createBookingQuotation);
router.patch('/vendor/:id/respond', authMiddleware, authorizeRoles('vendor'), respondToBooking);
router.patch('/vendor/:id/visit', authMiddleware, authorizeRoles('vendor'), requestVisit);
router.patch('/vendor/:id/cancel', authMiddleware, authorizeRoles('vendor'), cancelVendorBooking);
router.get('/admin', authMiddleware, authorizeRoles('admin'), listAdminBookings);
router.patch('/admin/:id/cancel', authMiddleware, authorizeRoles('admin'), cancelAdminBooking);
router.patch('/admin/:id/complete', authMiddleware, authorizeRoles('admin'), completeAdminBooking);

module.exports = router;
