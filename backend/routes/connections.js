const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');

// GET /api/connections - Get all connections for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Fetch connections
    const connections = await db.allAsync(
      `SELECT c.id, c.sender_id, c.receiver_id, c.status, c.created_at, c.updated_at,
              sender.name as sender_name, sp.avatar as sender_avatar, sp.course as sender_course, sp.year as sender_year,
              receiver.name as receiver_name, rp.avatar as receiver_avatar, rp.course as receiver_course, rp.year as receiver_year
       FROM connections c
       JOIN users sender ON sender.id = c.sender_id
       LEFT JOIN profiles sp ON sp.user_id = sender.id
       JOIN users receiver ON receiver.id = c.receiver_id
       LEFT JOIN profiles rp ON rp.user_id = receiver.id
       WHERE c.sender_id = ? OR c.receiver_id = ?
       ORDER BY c.updated_at DESC`,
      [currentUserId, currentUserId]
    );

    // Format so frontend easily sees the other partner
    const formatted = await Promise.all(
      connections.map(async (c) => {
        const isSender = c.sender_id === currentUserId;
        const otherUserId = isSender ? c.receiver_id : c.sender_id;
        const otherName = isSender ? c.receiver_name : c.sender_name;
        const otherAvatar = isSender ? c.receiver_avatar : c.sender_avatar;
        const otherCourse = isSender ? c.receiver_course : c.sender_course;
        const otherYear = isSender ? c.receiver_year : c.sender_year;

        // Fetch skills for other user
        const skills = await db.allAsync(
          `SELECT s.id, s.name, us.type
           FROM user_skills us
           JOIN skills s ON s.id = us.skill_id
           WHERE us.user_id = ?`,
          [otherUserId]
        );

        return {
          id: c.id,
          senderId: c.sender_id,
          receiverId: c.receiver_id,
          isSender,
          status: c.status,
          createdAt: c.created_at,
          otherUser: {
            id: otherUserId,
            name: otherName,
            avatar: otherAvatar,
            course: otherCourse,
            year: otherYear,
            teachSkills: skills.filter((s) => s.type === 'teach'),
            learnSkills: skills.filter((s) => s.type === 'learn')
          }
        };
      })
    );

    res.json({
      connections: formatted,
      accepted: formatted.filter((c) => c.status === 'accepted'),
      pendingIncoming: formatted.filter((c) => c.status === 'pending' && !c.isSender),
      pendingOutgoing: formatted.filter((c) => c.status === 'pending' && c.isSender)
    });
  } catch (err) {
    console.error('Error fetching connections:', err);
    res.status(500).json({ error: 'Failed to retrieve connections.' });
  }
});

// POST /api/connections - Send connection request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required.' });
    }

    if (senderId === parseInt(receiverId, 10)) {
      return res.status(400).json({ error: 'You cannot connect with yourself.' });
    }

    // Check existing connection
    const existing = await db.getAsync(
      `SELECT * FROM connections
       WHERE (sender_id = ? AND receiver_id = ?)
          OR (sender_id = ? AND receiver_id = ?)`,
      [senderId, receiverId, receiverId, senderId]
    );

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ error: 'You are already connected with this student.' });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ error: 'A connection request is already pending.' });
      }
      // If previously rejected, update to pending again
      await db.runAsync(
        `UPDATE connections SET sender_id = ?, receiver_id = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [senderId, receiverId, existing.id]
      );
    } else {
      await db.runAsync(
        `INSERT INTO connections (sender_id, receiver_id, status) VALUES (?, ?, 'pending')`,
        [senderId, receiverId]
      );
    }

    // Send notification to receiver
    await createNotification(
      receiverId,
      `${req.user.name} sent you a connection request.`,
      'connection_request',
      '/connections'
    );

    res.status(201).json({ message: 'Connection request sent successfully!' });
  } catch (err) {
    console.error('Error creating connection:', err);
    res.status(500).json({ error: 'Failed to send connection request.' });
  }
});

// PUT /api/connections/:id - Accept or reject connection request
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const connectionId = parseInt(req.params.id, 10);
    const { status } = req.body; // 'accepted' or 'rejected'
    const currentUserId = req.user.id;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or rejected.' });
    }

    const conn = await db.getAsync('SELECT * FROM connections WHERE id = ?', [connectionId]);
    if (!conn) {
      return res.status(404).json({ error: 'Connection request not found.' });
    }

    if (conn.receiver_id !== currentUserId) {
      return res.status(403).json({ error: 'Only the recipient can respond to this connection request.' });
    }

    await db.runAsync(
      `UPDATE connections SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, connectionId]
    );

    if (status === 'accepted') {
      await createNotification(
        conn.sender_id,
        `${req.user.name} accepted your connection request! You can now chat and propose skill exchanges.`,
        'connection_accepted',
        '/connections'
      );
    }

    res.json({ message: `Connection request ${status}.` });
  } catch (err) {
    console.error('Error updating connection:', err);
    res.status(500).json({ error: 'Failed to update connection request.' });
  }
});

module.exports = router;
