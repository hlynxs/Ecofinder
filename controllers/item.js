const db = require('../config/database');

// --------------------
// PUBLIC ENDPOINTS
// --------------------

// Get all items for public view
const getAllItems = (req, res) => {
  const sql = `SELECT item_name, sell_price, image FROM item WHERE deleted_at IS NULL`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err });
    res.json({ status: 'success', data: results });
  });
};

// Get items by category (for public view)
const getItemsByCategory = (req, res) => {
  const categoryId = req.params.categoryId;
  const sql = `SELECT item_name, sell_price, image FROM item WHERE deleted_at IS NULL AND category_id = ?`;
  db.query(sql, [categoryId], (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err });
    res.json({ status: 'success', data: results });
  });
};

// --------------------
// ADMIN FUNCTIONS
// --------------------

// Admin: Get all items with stock and category name
const getAllItemsWithStock = (req, res) => {
  const sql = `
    SELECT 
      i.*, 
      s.quantity, 
      c.description AS category_name 
    FROM item i 
    INNER JOIN stock s ON i.item_id = s.item_id 
    LEFT JOIN category c ON i.category_id = c.category_id
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err });
    return res.status(200).json({ success: true, rows: rows, data: rows });
  });
};


// Admin: Get single item with stock
const getSingleItem = (req, res) => {
  const sql = `
    SELECT i.*, s.quantity
    FROM item i
    INNER JOIN stock s ON i.item_id = s.item_id
    WHERE i.item_id = ?
  `;
  const values = [parseInt(req.params.id)];
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err });
    return res.status(200).json({ success: true, result });
  });
};

// Admin: Create item and stock
const createItem = (req, res) => {
  const { description, cost_price, sell_price, quantity, category_id } = req.body;
  const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : null;

  if (!description || !cost_price || !sell_price || !category_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const itemSql = `
    INSERT INTO item (description, cost_price, sell_price, image, category_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  const itemValues = [description, cost_price, sell_price, imagePath, category_id];

  db.execute(itemSql, itemValues, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error inserting item', details: err });
    }

    const itemId = result.insertId;
    const stockSql = `INSERT INTO stock (item_id, quantity) VALUES (?, ?)`;
    const stockValues = [itemId, quantity];

    db.execute(stockSql, stockValues, (err2, stockResult) => {
      if (err2) {
        return res.status(500).json({ error: 'Error inserting stock', details: err2 });
      }

      return res.status(201).json({
        success: true,
        itemId,
        image: imagePath,
        category_id,
        quantity,
      });
    });
  });
};

// Admin: Update item and stock
const updateItem = (req, res) => {
  const id = req.params.id;
  const { description, cost_price, sell_price, quantity, category_id } = req.body;
  const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : null;

  if (!description || !cost_price || !sell_price || !category_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const itemSql = `
    UPDATE item
    SET description = ?, cost_price = ?, sell_price = ?, image = ?, category_id = ?
    WHERE item_id = ?
  `;
  const itemValues = [description, cost_price, sell_price, imagePath, category_id, id];

  db.execute(itemSql, itemValues, (err) => {
    if (err) return res.status(500).json({ error: 'Error updating item', details: err });

    const stockSql = `UPDATE stock SET quantity = ? WHERE item_id = ?`;
    const stockValues = [quantity, id];

    db.execute(stockSql, stockValues, (err2) => {
      if (err2) return res.status(500).json({ error: 'Error updating stock', details: err2 });

      return res.status(200).json({ success: true, message: 'Item updated' });
    });
  });
};

// Admin: Soft delete item (recommended)
const deleteItem = (req, res) => {
  const id = req.params.id;
  const sql = `UPDATE item SET deleted_at = NOW() WHERE item_id = ?`;

  db.execute(sql, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Error deleting item', details: err });

    return res.status(200).json({ success: true, message: 'Item soft-deleted' });
  });
};

// --------------------
// EXPORTS
// --------------------
module.exports = {
  // Public 
  getAllItems,
  getItemsByCategory,

  // Admin
  getAllItemsWithStock,
  getSingleItem,
  createItem,
  updateItem,
  deleteItem,
};
