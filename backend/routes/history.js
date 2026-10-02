const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/learning-history - Get current user's learning history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const history = await db.allAsync(
      `SELECT lh.*,
              s.name as skill_name, s.category as skill_category,
              partner.name as partner_name, pp.avatar as partner_avatar,
              pp.course as partner_course, pp.year as partner_year,
              rev.rating as user_given_rating, rev.comment as user_given_comment
       FROM learning_history lh
       JOIN skills s ON s.id = lh.skill_id
       JOIN users partner ON partner.id = lh.partner_id
       LEFT JOIN profiles pp ON pp.user_id = partner.id
       LEFT JOIN reviews rev ON rev.exchange_id = lh.exchange_id AND rev.reviewer_id = lh.user_id
       WHERE lh.user_id = ?
       ORDER BY lh.learned_on DESC, lh.id DESC`,
      [currentUserId]
    );

    res.json({ history });
  } catch (err) {
    console.error('Error fetching learning history:', err);
    res.status(500).json({ error: 'Failed to retrieve learning history.' });
  }
});

module.exports = router;
