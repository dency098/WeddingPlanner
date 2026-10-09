const express = require('express');
const {
  listPublicDecorators,
  getPublicDecorator,
  listVendorDecorators,
  getVendorDecorator,
  createDecorator,
  updateDecorator,
  deleteDecorator,
  updateVendorStatus,
  listAdminDecorators,
  moderateDecorator,
} = require('../controllers/decoratorController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', listPublicDecorators);

// Vendor routes
router.get('/vendor/my', authMiddleware, authorizeRoles('vendor'), listVendorDecorators);
router.get('/vendor/my/:id', authMiddleware, authorizeRoles('vendor'), getVendorDecorator);
router.post('/', authMiddleware, authorizeRoles('vendor'), createDecorator);
router.put('/:id', authMiddleware, authorizeRoles('vendor'), updateDecorator);
router.delete('/:id', authMiddleware, authorizeRoles('vendor'), deleteDecorator);
router.patch('/:id/status', authMiddleware, authorizeRoles('vendor'), updateVendorStatus);

// Admin routes
router.get('/admin', authMiddleware, authorizeRoles('admin'), listAdminDecorators);
router.patch('/admin/:id/status', authMiddleware, authorizeRoles('admin'), moderateDecorator);

// Public single detail route (must come after specific routes)
router.get('/:id', getPublicDecorator);

module.exports = router;

