const express = require('express');
const router = express.Router();
const itemController = require('../controllers/item');
const upload = require('../middlewares/upload');



// PUBLIC ROUTES
router.get('/', itemController.getAllItems);
router.get('/category/:categoryId', itemController.getItemsByCategory);
router.get('/search/:term', itemController.searchItems);
router.get('/eco-filter/:isEco', itemController.getItemsByEcoFlag);


// ADMIN ROUTES
router.get('/admin', itemController.getAllItemsIncludingDeleted);

// Specific routes 
router.get('/admin/infinite', itemController.getItemsPaginated);

// General route 
router.get('/admin/:id', itemController.getSingleItem);


// item.js (routes)
router.post('/admin', upload.array('images', 5), itemController.createItem);

// UPDATE (multiple images)
router.put('/admin/:id', upload.array('images', 5), itemController.updateItem);

router.delete('/admin/:id', itemController.deleteItem);
//restore
router.patch('/admin/restore/:id', itemController.restoreItem);
router.get('/admin/all', itemController.getAllItemsIncludingDeleted);





router.get('/:id', itemController.getSingleItem); 





module.exports = router;
