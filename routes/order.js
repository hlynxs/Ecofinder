const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrdersByCustomer,
  getShippingOptions,
  updateOrderStatus,
  updateOrderStatusGet,
  getAllOrdersForAdmin,
  getOrderDetailsById,
  softDeleteOrder,
  restoreOrder,
  getArchivedOrders,
} = require('../controllers/order');

// ADMIN routes
router.get('/admin', getAllOrdersForAdmin);
router.put('/admin/:orderId/status', updateOrderStatus);
router.delete('/admin/:orderId', softDeleteOrder);
router.get('/admin/archived', getArchivedOrders);
router.get('/admin/:orderId', getOrderDetailsById);
router.put('/admin/:orderId/restore', restoreOrder); // ✅ if you want restore



// CUSTOMER routes
router.post('/', createOrder);
router.get('/customer/:customerId', getOrdersByCustomer);
router.get('/shipping', getShippingOptions);

// Browser-based testing routes
router.put('/:orderId/status', updateOrderStatus);
router.get('/:orderId/status/:newStatus', updateOrderStatusGet);

module.exports = router;
