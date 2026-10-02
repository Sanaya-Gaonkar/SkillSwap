const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications - Get all notifications for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const notifications = await db.allAsync(
      `SELECT * FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [currentUserId]
    );

    const unreadCountRow = await db.getAsync(
      `SELECT COUNT(*) as count FROM notifications
       WHERE user_id = ? AND is_read = 0`,
      [currentUserId]
    );

    res.json({
      notifications,
      unreadCount: unreadCountRow?.count || 0
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const notificationId = parseInt(req.params.id, 10);

    await db.runAsync(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, currentUserId]
    );

    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Error updating notification:', err);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    await db.runAsync(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [currentUserId]
    );

    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ error: 'Failed to mark all notifications as read.' });
  }
});

module.exports = router;
