const express = require('express');
const router = express.Router();
const itemController = require('../controllers/item');
const upload = require('../middlewares/upload');

// PUBLIC ROUTES
router.get('/', itemController.getAllItems);
router.get('/category/:categoryId', itemController.getItemsByCategory);

// ADMIN ROUTES
router.get('/admin', itemController.getAllItemsWithStock);
router.get('/admin/:id', itemController.getSingleItem);

// CREATE (single image)
router.post('/admin', upload.single('image'), itemController.createItem);

// UPDATE (multiple images)
router.put('/admin/:id', upload.array('images', 5), itemController.updateItem);

router.delete('/admin/:id', itemController.deleteItem);

module.exports = router;
