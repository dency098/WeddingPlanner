const express = require('express');
const {
  getPublicVendorProfile,
  getOwnVendorProfile,
  updateOwnVendorProfile,
} = require('../controllers/vendorController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', authMiddleware, authorizeRoles('vendor'), getOwnVendorProfile);
router.patch('/me', authMiddleware, authorizeRoles('vendor'), updateOwnVendorProfile);
router.get('/:id', getPublicVendorProfile);

module.exports = router;
