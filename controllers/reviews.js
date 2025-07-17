const connection = require('../config/database');

exports.createReview = (req, res) => {
    const { orderinfo_id, customer_id, item_id, rating, review_text } = req.body;
  
    const sql = `
      INSERT INTO reviews (orderinfo_id, customer_id, item_id, rating, review_text, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
  
    db.query(sql, [orderinfo_id, customer_id, item_id, rating, review_text], (err, result) => {
      if (err) {
        console.error("Failed to insert review:", err);
        return res.status(500).json({ success: false, message: "Failed to submit review." });
      }
  
      res.json({ success: true, message: "Review submitted successfully!" });
    });
  };