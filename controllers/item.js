const db = require('../config/database');

// --------------------
// PUBLIC ENDPOINTS
// --------------------

// Get all items for public view
const getAllItems = (req, res) => {
  const sql = `
    SELECT item_name, sell_price, image 
    FROM item 
    WHERE deleted_at IS NULL AND category_id IN (
      SELECT category_id FROM category WHERE deleted_at IS NULL
    )
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err });
    res.json({ status: 'success', data: results });
  });
};

// Get items by category (for public view)
const getItemsByCategory = (req, res) => {
  const categoryId = req.params.categoryId;
  const sql = `
    SELECT item_name, sell_price, image 
    FROM item 
    WHERE deleted_at IS NULL 
      AND category_id = ? 
      AND category_id IN (
        SELECT category_id FROM category WHERE deleted_at IS NULL
      )
  `;
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
      i.item_id,
      i.item_name,
      i.description,
      i.cost_price,
      i.sell_price,
      i.image,
      i.category_id,
      i.created_at,
      i.updated_at,
      s.quantity,
      c.description AS category_name
    FROM item i
    INNER JOIN stock s ON i.item_id = s.item_id
    LEFT JOIN category c ON i.category_id = c.category_id
    WHERE i.deleted_at IS NULL AND (c.deleted_at IS NULL OR c.category_id IS NULL)
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err });
    return res.status(200).json({ success: true, data: rows });
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
  const imagePath = req.file ? req.file.filename : null;

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

const updateItem = (req, res) => {
  const id = req.params.id;
  const { description, cost_price, sell_price, quantity, category_id } = req.body;
  const imagePath = req.file ? req.file.filename : null;

  if (!description || !cost_price || !sell_price || !category_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let itemSql, itemValues;

  if (imagePath) {
    // If new image uploaded
    itemSql = `
      UPDATE item
      SET description = ?, cost_price = ?, sell_price = ?, image = ?, category_id = ?
      WHERE item_id = ?
    `;
    itemValues = [description, cost_price, sell_price, imagePath, category_id, id];
  } else {
    // No image uploaded, don't overwrite the old one
    itemSql = `
      UPDATE item
      SET description = ?, cost_price = ?, sell_price = ?, category_id = ?
      WHERE item_id = ?
    `;
    itemValues = [description, cost_price, sell_price, category_id, id];
  }

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


const deleteItem = (req, res) => {
  const id = req.params.id;

  // First, delete the item from the stock table (if foreign key constraint exists)
  const deleteStockSql = `DELETE FROM stock WHERE item_id = ?`;
  db.execute(deleteStockSql, [id], (err1) => {
    if (err1) {
      return res.status(500).json({ error: 'Error deleting stock', details: err1 });
    }

    // Then delete the item from the item table
    const deleteItemSql = `DELETE FROM item WHERE item_id = ?`;
    db.execute(deleteItemSql, [id], (err2) => {
      if (err2) {
        return res.status(500).json({ error: 'Error deleting item', details: err2 });
      }

      return res.status(200).json({ success: true, message: 'Item hard-deleted' });
    });
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
