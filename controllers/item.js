const db = require('../config/database');

const getAllItems = (req, res) => {
  const sql = `
    SELECT item_name, sell_price, image 
    FROM item 
    WHERE deleted_at IS NULL
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err });
    res.json({ status: 'success', data: results });
  });
};

const getItemsByCategory = (req, res) => {
  const categoryId = req.params.categoryId;

  const sql = `
    SELECT item_name, sell_price, image 
    FROM item 
    WHERE deleted_at IS NULL AND category_id = ?
  `;
  db.query(sql, [categoryId], (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err });
    res.json({ status: 'success', data: results });
  });
};

module.exports = {
  getAllItems,
  getItemsByCategory
};
