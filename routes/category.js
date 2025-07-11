const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category');

// GET /api/category
router.get('/', categoryController.getAllCategories);

module.exports = router;
