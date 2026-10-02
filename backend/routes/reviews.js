const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');
const { recordLearningActivity } = require('../utils/learning');

// GET /api/reviews/user/:id - List all reviews for a user
router.get('/user/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const reviews = await db.allAsync(
      `SELECT r.*,
              u.name as reviewer_name, p.avatar as reviewer_avatar,
              os.name as offered_skill, rs.name as requested_skill
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       LEFT JOIN profiles p ON p.user_id = u.id
       JOIN skill_exchanges e ON e.id = r.exchange_id
       JOIN skills os ON os.id = e.offered_skill_id
       JOIN skills rs ON rs.id = e.requested_skill_id
       WHERE r.reviewed_user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json({ reviews });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to retrieve reviews.' });
  }
});

// POST /api/reviews - Add a review after a completed exchange
router.post('/', authenticateToken, async (req, res) => {
  try {
    const reviewerId = req.user.id;
    const { exchangeId, rating, comment } = req.body;

    if (!exchangeId || !rating) {
      return res.status(400).json({ error: 'Exchange ID and rating (1-5) are required.' });
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
    }

    const exchange = await db.getAsync('SELECT * FROM skill_exchanges WHERE id = ?', [exchangeId]);
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found.' });
    }

    const completedSession = await db.getAsync(
      `SELECT id FROM sessions WHERE exchange_id = ? AND status = 'completed' LIMIT 1`,
      [exchangeId]
    );

    if (exchange.status !== 'completed' && !completedSession) {
      return res.status(400).json({ error: 'Reviews can only be submitted after a session is completed.' });
    }

    if (exchange.proposer_id !== reviewerId && exchange.receiver_id !== reviewerId) {
      return res.status(403).json({ error: 'You are not a participant in this exchange.' });
    }

    const reviewedUserId = reviewerId === exchange.proposer_id ? exchange.receiver_id : exchange.proposer_id;

    // Check if user already reviewed this exchange
    const existing = await db.getAsync(
      'SELECT id FROM reviews WHERE exchange_id = ? AND reviewer_id = ?',
      [exchangeId, reviewerId]
    );

    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this exchange.' });
    }

    const result = await db.runAsync(
      `INSERT INTO reviews (exchange_id, reviewer_id, reviewed_user_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [exchangeId, reviewerId, reviewedUserId, numRating, comment ? comment.trim() : '']
    );

    // Update rating in learning history
    await db.runAsync(
      `UPDATE learning_history SET rating = ? WHERE exchange_id = ? AND user_id = ?`,
      [numRating, exchangeId, reviewerId]
    );

    // Notify reviewed user
    await createNotification(
      reviewedUserId,
      `${req.user.name} left you a ${numRating}-star review: "${comment ? comment.slice(0, 40) : 'Great exchange!'}"`,
      'review',
      `/profile/${reviewedUserId}`
    );

    if (numRating >= 4) {
      await recordLearningActivity(
        reviewedUserId,
        'positive_review',
        'review',
        result.lastID,
        15,
        `Received a ${numRating}-star review`
      );
    }

    res.status(201).json({
      message: 'Review submitted successfully! Thank you for sharing your feedback.',
      reviewId: result.lastID
    });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

module.exports = router;
