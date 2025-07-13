const db = require('../config/database'); // Your DB connection

// 🚚 Get all shipping options
const getShippingOptions = (req, res) => {
  const sql = `SELECT shipping_id, region, rate FROM shipping`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching shipping options:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    res.json({ success: true, data: results });
  });
};

// 🧾 Create an order
const createOrder = (req, res) => {
  const { customer_id, date_placed, shipping_id, status, items } = req.body;

  if (!customer_id || !date_placed || !shipping_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Missing or invalid order data' });
  }

  // Start a transaction
  db.beginTransaction(err => {
    if (err) {
      console.error('Transaction error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    // Insert into orderinfo
    const orderInfoSql = `
      INSERT INTO orderinfo (customer_id, date_placed, shipping_id, status)
      VALUES (?, ?, ?, ?)
    `;

    db.query(orderInfoSql, [customer_id, date_placed, shipping_id, status], (err, result) => {
      if (err) {
        return db.rollback(() => {
          console.error('Insert orderinfo error:', err);
          res.status(500).json({ success: false, message: 'Failed to create order' });
        });
      }

      const orderinfo_id = result.insertId;

      // Prepare orderline inserts
      const orderlines = items.map(item => [orderinfo_id, item.id, item.quantity]);

      const orderlineSql = 'INSERT INTO orderline (orderinfo_id, item_id, quantity) VALUES ?';

      db.query(orderlineSql, [orderlines], (err) => {
        if (err) {
          return db.rollback(() => {
            console.error('Insert orderline error:', err);
            res.status(500).json({ success: false, message: 'Failed to add order items' });
          });
        }

        // Commit transaction
        db.commit(err => {
          if (err) {
            return db.rollback(() => {
              console.error('Commit error:', err);
              res.status(500).json({ success: false, message: 'Failed to finalize order' });
            });
          }

          res.json({ success: true, message: 'Order created', orderinfo_id });
        });
      });
    });
  });
};

// Placeholder if you have this in your project
const getOrdersByCustomer = (req, res) => {
    const customerId = req.params.customerId;

    // Get orders + shipping info
    const sql = `
      SELECT 
        o.orderinfo_id,
        o.date_placed,
        o.status,
        s.region,
        s.rate
      FROM orderinfo o
      JOIN shipping s ON o.shipping_id = s.shipping_id
      WHERE o.customer_id = ?
      ORDER BY o.date_placed DESC
    `;
  
    db.query(sql, [customerId], (err, orders) => {
      if (err) {
        console.error("Error fetching orders:", err);
        return res.status(500).json({ success: false, message: "Error fetching orders" });
      }
  
      if (!orders.length) {
        return res.json({ success: true, data: [] });
      }
  
      // Get all order lines for these orders
      const orderIds = orders.map(o => o.orderinfo_id);
      const placeholders = orderIds.map(() => '?').join(',');
  
      const itemSql = `
        SELECT 
          ol.orderinfo_id,
          i.item_name,
          i.sell_price AS price,
          ol.quantity
        FROM orderline ol
        JOIN item i ON i.item_id = ol.item_id
        WHERE ol.orderinfo_id IN (${placeholders})
      `;
  
      db.query(itemSql, [...orderIds], (err, orderItems) => {
        if (err) {
          console.error("Error fetching order items:", err);
          return res.status(500).json({ success: false, message: "Error fetching items" });
        }
  
        // Group items by orderinfo_id
        const grouped = {};
        orderItems.forEach(item => {
          if (!grouped[item.orderinfo_id]) grouped[item.orderinfo_id] = [];
          grouped[item.orderinfo_id].push({
            item_name: item.item_name,
            quantity: item.quantity,
            price: item.price
          });
        });
  
        // Attach items to orders
        const final = orders.map(order => ({
          ...order,
          items: grouped[order.orderinfo_id] || []
        }));
  
        res.json({ success: true, data: final });
      });
    });
  };

module.exports = {
  createOrder,
  getOrdersByCustomer,
  getShippingOptions
};
