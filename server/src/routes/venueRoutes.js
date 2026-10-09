const express = require('express');
const {
  listPublicVenues,
  listVendorVenues,
  listAdminVenues,
  getVendorVenue,
  getPublicVenue,
  createVenue,
  updateVenue,
  deleteVenue,
  updateVendorStatus,
  updateAvailability,
  moderateVenue,
  checkAvailability,
} = require('../controllers/venueController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', listPublicVenues);
router.get('/vendor/my', authMiddleware, authorizeRoles('vendor'), listVendorVenues);
router.get('/vendor/my/:id', authMiddleware, authorizeRoles('vendor'), getVendorVenue);
router.post('/', authMiddleware, authorizeRoles('vendor'), createVenue);
router.get('/admin', authMiddleware, authorizeRoles('admin'), listAdminVenues);
router.patch('/admin/:id/status', authMiddleware, authorizeRoles('admin'), moderateVenue);
router.get('/:id/availability', checkAvailability);
router.patch('/:id/status', authMiddleware, authorizeRoles('vendor'), updateVendorStatus);
router.patch('/:id/availability', authMiddleware, authorizeRoles('vendor'), updateAvailability);
router.get('/:id', getPublicVenue);
router.put('/:id', authMiddleware, authorizeRoles('vendor'), updateVenue);
router.delete('/:id', authMiddleware, authorizeRoles('vendor'), deleteVenue);

module.exports = router;
