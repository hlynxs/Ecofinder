const connection = require('../config/database');

exports.createReview = async (req, res) => {
  const { orderinfo_id, customer_id, item_id, rating, review_text } = req.body;

  // Validate required fields
  if (!orderinfo_id || !customer_id || !item_id || !rating) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields (orderinfo_id, customer_id, item_id, or rating).",
    });
  }

  try {
    // First check if this specific order+item+customer already has a review
    const [existing] = await connection.promise().query(
      `SELECT review_id FROM reviews 
       WHERE orderinfo_id = ? AND customer_id = ? AND item_id = ? 
       LIMIT 1`,
      [orderinfo_id, customer_id, item_id]
    );

    if (existing.length > 0) {
      // Update existing review for this specific order
      await connection.promise().query(
        `UPDATE reviews SET 
         rating = ?, 
         review_text = ?, 
         updated_at = NOW() 
         WHERE review_id = ?`,
        [rating, review_text, existing[0].review_id]
      );
      
      return res.json({ 
        success: true, 
        message: "Review updated successfully for this order.",
        action: "updated"
      });
    } else {
      // Create new review for this order
      await connection.promise().query(
        `INSERT INTO reviews 
         (orderinfo_id, customer_id, item_id, rating, review_text, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [orderinfo_id, customer_id, item_id, rating, review_text]
      );
      
      return res.json({ 
        success: true, 
        message: "New review submitted successfully for this order.",
        action: "created"
      });
    }
  } catch (err) {
    console.error("Review operation failed:", err);
    
    // Handle specific error cases
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: "You've already submitted a review for this specific order item.",
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Failed to process review",
      error: err.message
    });
  }
};

  exports.getReviewsByCustomer = (req, res) => {
    const customerId = req.params.id;
  
    const sql = `
      SELECT 
        r.review_id,
        r.orderinfo_id,     -- <-- ADD THIS
        r.item_id,          -- <-- AND THIS
        r.rating,
        r.review_text,
        r.created_at,
        i.item_name
      FROM reviews r
      JOIN item i ON r.item_id = i.item_id
      WHERE r.customer_id = ?
      ORDER BY r.created_at DESC
    `;
  
    connection.query(sql, [customerId], (err, results) => {
      if (err) {
        console.error("Failed to fetch reviews:", err);
        return res.status(500).json({ success: false, message: "Failed to load reviews." });
      }
  
      res.json({ success: true, data: results });
    });
  };
  

exports.checkReviewExists = (req, res) => {
  const { customer_id, orderinfo_id, item_id } = req.query;

  const sql = `
    SELECT 1 FROM reviews 
    WHERE customer_id = ? AND orderinfo_id = ? AND item_id = ? 
    LIMIT 1
  `;

  connection.query(sql, [customer_id, orderinfo_id, item_id], (err, results) => {
    if (err) {
      console.error('Check review exists error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    res.json({ success: true, reviewed: results.length > 0 });
  });
};

exports.updateReview = (req, res) => {
  const { review_id } = req.params;
  const { rating, review_text } = req.body;

  const sql = `
    UPDATE reviews 
    SET rating = ?, review_text = ?, updated_at = NOW()
    WHERE review_id = ?
  `;

  connection.query(sql, [rating, review_text, review_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Review updated successfully' });
  });
};

exports.getReviewById = (req, res) => {
  const { review_id } = req.params;

  const sql = `
    SELECT * FROM reviews
    WHERE review_id = ?
  `;

  connection.query(sql, [review_id], (err, results) => {
    if (err) {
      console.error('Failed to fetch review:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch review' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.json({ success: true, data: results[0] });
  });
};


exports.deleteReview = (req, res) => {
  const { review_id } = req.params;

  const sql = `DELETE FROM reviews WHERE review_id = ?`;

  connection.query(sql, [review_id], (err, result) => {
    if (err) {
      console.error("Failed to delete review:", err);
      return res.status(500).json({ success: false, message: "Failed to delete review" });
    }

    res.json({ success: true, message: "Review deleted successfully" });
  });
};


exports.getReviewsByItem = (req, res) => {
  const { item_id } = req.params;

  const sql = `
    SELECT 
      r.rating, 
      r.review_text, 
      r.created_at,
      c.fname, 
      c.lname
    FROM reviews r
    JOIN customer c ON r.customer_id = c.customer_id
    WHERE r.item_id = ?
    ORDER BY r.created_at DESC
  `;

  connection.query(sql, [item_id], (err, results) => {
    if (err) {
      console.error("Failed to fetch reviews for item:", err);
      return res.status(500).json({ success: false, message: "Failed to load item reviews." });
    }

    res.json({ success: true, data: results });
  });
};
