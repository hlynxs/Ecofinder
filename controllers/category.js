// controllers/category.js
const db = require('../config/database');

const getAllCategories = (req, res) => {
  const sql = `SELECT category_id, description FROM category WHERE deleted_at IS NULL OR deleted_at IS NULL`;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });

    res.json({
      success: true,
      data: results
    });
  });
};

module.exports = {
  getAllCategories
};
