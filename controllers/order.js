const db = require('../config/database'); 
const sendEmail = require('../utils/sendEmail'); // ✅ correct import

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

  db.beginTransaction(err => {
    if (err) {
      console.error('Transaction error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

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
      const orderlines = items.map(item => [orderinfo_id, item.id, item.quantity]);

      const orderlineSql = 'INSERT INTO orderline (orderinfo_id, item_id, quantity) VALUES ?';

      db.query(orderlineSql, [orderlines], (err) => {
        if (err) {
          return db.rollback(() => {
            console.error('Insert orderline error:', err);
            res.status(500).json({ success: false, message: 'Failed to add order items' });
          });
        }

        // Deduct stock quantities
        const updateStockPromises = items.map(item => {
          return new Promise((resolve, reject) => {
            const reduceStockSql = `
              UPDATE stock
              SET quantity = quantity - ?
              WHERE item_id = ? AND quantity >= ?
            `;
            db.query(reduceStockSql, [item.quantity, item.id, item.quantity], (err, result) => {
              if (err) {
                console.error(`Error updating stock for item ${item.id}:`, err);
                return reject(new Error(`Failed to update stock for item ID ${item.id}`));
              }
        
              if (result.affectedRows === 0) {
                console.warn(`❌ Stock too low or item not found: item_id=${item.id}, qty=${item.quantity}`);
                return reject(new Error(`Insufficient stock for item ID ${item.id}`));
              }
        
              console.log(`✅ Stock deducted for item ${item.id}: -${item.quantity}`);
              resolve();
            });
          });
        });
        

        Promise.all(updateStockPromises)
          .then(() => {
            db.commit(async err => {
              if (err) {
                return db.rollback(() => {
                  console.error('Commit error:', err);
                  res.status(500).json({ success: false, message: 'Failed to finalize order' });
                });
              }

              // ✅ Fetch customer and shipping info
              const customerDetailsSql = `
                SELECT u.email, CONCAT(c.fname, ' ', c.lname) AS fullName, s.region, s.rate
                FROM customer c
                JOIN users u ON u.id = c.user_id
                JOIN shipping s ON s.shipping_id = ?
                WHERE c.customer_id = ?
              `;

              db.query(customerDetailsSql, [shipping_id, customer_id], (err, userResult) => {
                if (err || !userResult.length) {
                  console.error('Email fetch error:', err);
                  return res.json({ success: true, message: 'Order created but customer info not found.', orderinfo_id });
                }

                const { email, fullName, region, rate } = userResult[0];

                // ✅ Now fetch item details
                const itemDetailsSql = `
                  SELECT i.item_name, i.sell_price AS price, ol.quantity
                  FROM orderline ol
                  JOIN item i ON ol.item_id = i.item_id
                  WHERE ol.orderinfo_id = ?
                `;

                db.query(itemDetailsSql, [orderinfo_id], async (err, itemRows) => {
                  if (err) {
                    console.error('Item fetch error:', err);
                    return res.json({ success: true, message: 'Order created. Failed to build receipt.', orderinfo_id });
                  }

                  const itemsHtml = itemRows.map(item => `
                    <tr>
                      <td>${item.item_name}</td>
                      <td>${item.quantity}</td>
                      <td>₱${parseFloat(item.price).toFixed(2)}</td>
                      <td>₱${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('');

                  const subtotal = itemRows.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
                  const total = (subtotal + parseFloat(rate)).toFixed(2);

                  const message = `
                    <h3>Hi ${fullName || 'Customer'},</h3>
                    <p>Thank you for placing your order with <strong>Drift n' Dash</strong>!</p>
                    <p><strong>Order ID:</strong> ${orderinfo_id}</p>
                    <p><strong>Date Placed:</strong> ${new Date(date_placed).toLocaleDateString()}</p>

                    <h4>Order Summary</h4>
                    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
                      <thead>
                        <tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
                      </thead>
                      <tbody>${itemsHtml}</tbody>
                    </table>
                    <p><strong>Shipping:</strong> ${region} - ₱${parseFloat(rate).toFixed(2)}</p>
                    <p><strong>Total:</strong> ₱${total}</p>

                    <br><p>We will notify you once your order status is updated.<br>🚗💨</p>
                  `;

                  try {
                    await sendEmail({
                      email,
                      subject: `Drift n' Dash - Order #${orderinfo_id} Confirmation`,
                      message
                    });

                    res.json({ success: true, message: 'Order created and email sent.', orderinfo_id });
                  } catch (emailErr) {
                    console.error('Email sending failed:', emailErr);
                    res.json({ success: true, message: 'Order created but email failed.', orderinfo_id });
                  }
                });
              });
            });
          })
          .catch(stockErr => {
            db.rollback(() => {
              console.error('Stock update error:', stockErr.message);
              res.status(400).json({ success: false, message: stockErr.message });
            });
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

  const updateOrderStatus = (req, res) => {
    const { orderId } = req.params;
    const { newStatus } = req.body;
  
    const updateSql = `UPDATE orderinfo SET status = ? WHERE orderinfo_id = ?`;
  
    db.query(updateSql, [newStatus, orderId], (err, updateResult) => {
      if (err) {
        console.error('Update error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
  
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ message: 'Order not found.' });
      }
  
      const getCustomerSql = `
        SELECT u.email, CONCAT(c.fname, ' ', c.lname) AS fullName, s.region, s.rate, o.date_placed
        FROM orderinfo o
        JOIN customer c ON o.customer_id = c.customer_id
        JOIN users u ON c.user_id = u.id
        JOIN shipping s ON o.shipping_id = s.shipping_id
        WHERE o.orderinfo_id = ?
      `;
  
      db.query(getCustomerSql, [orderId], (err, customerResults) => {
        if (err || !customerResults.length) {
          console.error('Fetch error:', err);
          return res.status(500).json({ message: 'Error getting customer info' });
        }
  
        const { email, fullName, region, rate, date_placed } = customerResults[0];
  
        const getItemsSql = `
          SELECT i.item_id, i.item_name, ol.quantity, i.sell_price AS price
          FROM orderline ol
          JOIN item i ON i.item_id = ol.item_id
          WHERE ol.orderinfo_id = ?
        `;
  
        db.query(getItemsSql, [orderId], async (err, itemResults) => {
          if (err) {
            console.error('Error fetching order items:', err);
            return res.status(500).json({ message: 'Error fetching order items' });
          }
  
          // ✅ Return stock if order is cancelled
          if (newStatus.toLowerCase() === 'cancelled') {
            try {
              await Promise.all(itemResults.map(item => {
                return new Promise((resolve, reject) => {
                  const returnStockSql = `
                    UPDATE stock
                    SET quantity = quantity + ?
                    WHERE item_id = ?
                  `;
                  db.query(returnStockSql, [item.quantity, item.item_id], (err, result) => {
                    if (err) {
                      console.error(`Failed to return stock for item ${item.item_id}:`, err);
                      return reject(err);
                    }
                    console.log(`Restored ${item.quantity} units to item_id ${item.item_id}`);
                    resolve();
                  });
                });
              }));
            } catch (stockErr) {
              return res.status(500).json({ message: 'Order status updated, but stock return failed.' });
            }
          }
  
          // ✅ Prepare email content
          const itemsHtml = itemResults.map(item => {
            const price = parseFloat(item.price);
            const subtotal = price * item.quantity;
            return `
              <tr>
                <td>${item.item_name}</td>
                <td>${item.quantity}</td>
                <td>₱${price.toFixed(2)}</td>
                <td>₱${subtotal.toFixed(2)}</td>
              </tr>
            `;
          }).join('');
  
          const subtotal = itemResults.reduce((sum, i) => sum + i.price * i.quantity, 0);
          const total = (subtotal + parseFloat(rate)).toFixed(2);
  
          const messageHtml = `
            <h3>Hi ${fullName || 'Customer'},</h3>
            <p>Your order <strong>#${orderId}</strong> placed on <strong>${new Date(date_placed).toLocaleDateString()}</strong> has been updated to:</p>
            <p><strong>Status: ${newStatus}</strong></p>
  
            <h4>Order Summary</h4>
            <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
              <thead>
                <tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
  
            <p><strong>Shipping:</strong> ${region} - ₱${parseFloat(rate).toFixed(2)}</p>
            <p><strong>Total:</strong> ₱${total}</p>
  
            <br><p>Thanks for shopping with <strong>Drift n' Dash</strong>!<br>🚗💨</p>
          `;
  
          try {
            await sendEmail({
              email,
              subject: `Your Order #${orderId} Status: ${newStatus}`,
              message: messageHtml
            });
  
            res.json({ message: 'Order updated and email sent.' });
          } catch (emailErr) {
            console.error('Email sending failed:', emailErr);
            res.status(500).json({ message: 'Order updated but email failed.' });
          }
        });
      });
    });
  };
  
  
  const updateOrderStatusGet = async (req, res) => {
    const { orderId, newStatus } = req.params;
  
    // Reuse the existing logic by injecting into req.body
    req.body = { newStatus };
    return updateOrderStatus(req, res);
  };
  

module.exports = {
  createOrder,
  getOrdersByCustomer,
  getShippingOptions,
  updateOrderStatus,
   updateOrderStatusGet

};
