const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviews');

router.post('/create', reviewController.createReview);
router.get('/customer/:id', reviewController.getReviewsByCustomer); 
router.get('/exists', reviewController.checkReviewExists);
router.get('/:review_id', reviewController.getReviewById); 
router.put('/:review_id', reviewController.updateReview);
router.delete('/:review_id', reviewController.deleteReview);
router.get('/item/:item_id', reviewController.getReviewsByItem);



module.exports = router;
