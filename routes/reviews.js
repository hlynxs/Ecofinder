const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviews');

router.post('/create', reviewController.createReview);

module.exports = router;
