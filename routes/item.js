const express = require('express');
const router = express.Router();
const itemController = require('../controllers/item');

// Routes using the controller functions
router.get('/', itemController.getAllItems);
router.get('/category/:categoryId', itemController.getItemsByCategory);

module.exports = router;
