const express = require('express');
const { createReview, getVendorReviews } = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();


router.post('/', authMiddleware, createReview);
router.get('/vendor/:vendorId', getVendorReviews);

module.exports = router;
