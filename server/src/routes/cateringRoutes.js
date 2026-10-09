const express = require('express');
const {
  listPublicCatering,
  listVendorCatering,
  listAdminCatering,
  createCatering,
  updateCatering,
  deleteCatering,
  moderateCatering,
  updateVendorStatus
} = require('../controllers/cateringController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', listPublicCatering);

// Vendor routes
router.get('/vendor/my', authMiddleware, authorizeRoles('vendor'), listVendorCatering);
router.post('/', authMiddleware, authorizeRoles('vendor'), createCatering);
router.put('/:id', authMiddleware, authorizeRoles('vendor'), updateCatering);
router.delete('/:id', authMiddleware, authorizeRoles('vendor'), deleteCatering);
router.patch('/:id/status', authMiddleware, authorizeRoles('vendor'), updateVendorStatus);

// Admin routes
router.get('/admin', authMiddleware, authorizeRoles('admin'), listAdminCatering);
router.patch('/admin/:id/status', authMiddleware, authorizeRoles('admin'), moderateCatering);

module.exports = router;
