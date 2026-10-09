const express = require('express');
const { createVenueUploadSignature } = require('../controllers/uploadController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/venue-signature', authMiddleware, authorizeRoles('vendor'), createVenueUploadSignature);

module.exports = router;
