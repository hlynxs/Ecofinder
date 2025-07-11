const express = require('express');
const router = express.Router();
const itemController = require('../controllers/item'); // Assuming the merged version
const upload = require('../middlewares/upload'); // Multer middleware for image upload

// --------------------
// PUBLIC ROUTES
// --------------------
router.get('/', itemController.getAllItems);
router.get('/category/:categoryId', itemController.getItemsByCategory);

// --------------------
// ADMIN ROUTES
// --------------------
router.get('/admin', itemController.getAllItemsWithStock);
router.get('/admin/:id', itemController.getSingleItem);
router.post('/admin', upload.single('image'), itemController.createItem);
router.put('/admin/:id', upload.single('image'), itemController.updateItem);
router.delete('/admin/:id', itemController.deleteItem);

module.exports = router;
