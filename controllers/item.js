const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', (req, res) => {
    const sql = `
      SELECT item_name, sell_price, image 
      FROM item 
      WHERE deleted_at IS NULL
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ status: 'error', message: err });
      res.json({ status: 'success', data: results });
    });
  });
  
module.exports = router;
