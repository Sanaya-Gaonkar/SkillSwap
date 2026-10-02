const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');

// GET /api/messages/conversations/recent - Get all chat conversations for logged-in user
router.get('/conversations/recent', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get list of users with whom current user is connected or has messages
    const partners = await db.allAsync(
      `SELECT DISTINCT u.id, u.name, p.avatar, p.course, p.year
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id IN (
         SELECT receiver_id FROM messages WHERE sender_id = ?
         UNION
         SELECT sender_id FROM messages WHERE receiver_id = ?
         UNION
         SELECT receiver_id FROM connections WHERE sender_id = ? AND status = 'accepted'
         UNION
         SELECT sender_id FROM connections WHERE receiver_id = ? AND status = 'accepted'
       ) AND u.id != ?`,
      [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId]
    );

    const conversations = [];

    for (const partner of partners) {
      // Get last message
      const lastMsg = await db.getAsync(
        `SELECT content, sent_at, sender_id
         FROM messages
         WHERE (sender_id = ? AND receiver_id = ?)
            OR (sender_id = ? AND receiver_id = ?)
         ORDER BY sent_at DESC LIMIT 1`,
        [currentUserId, partner.id, partner.id, currentUserId]
      );

      conversations.push({
        partner,
        lastMessage: lastMsg ? lastMsg.content : 'Connected! Start a conversation.',
        lastMessageTime: lastMsg ? lastMsg.sent_at : null,
        isOutgoing: lastMsg ? lastMsg.sender_id === currentUserId : false
      });
    }

    // Sort by last message time
    conversations.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });

    res.json({ conversations });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Failed to retrieve conversations.' });
  }
});

// GET /api/messages/:userId - Get chat messages with a specific user
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = parseInt(req.params.userId, 10);

    const targetUser = await db.getAsync(
      `SELECT u.id, u.name, p.avatar, p.course, p.year
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = ?`,
      [targetUserId]
    );

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const messages = await db.allAsync(
      `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.sent_at,
              u.name as sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id = ? AND m.receiver_id = ?)
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.sent_at ASC`,
      [currentUserId, targetUserId, targetUserId, currentUserId]
    );

    res.json({
      targetUser,
      messages
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

// POST /api/messages - Send a message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required.' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty.' });
    }

    const rId = parseInt(receiverId, 10);
    if (senderId === rId) {
      return res.status(400).json({ error: 'Cannot send message to yourself.' });
    }

    const result = await db.runAsync(
      `INSERT INTO messages (sender_id, receiver_id, content, sent_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [senderId, rId, content.trim()]
    );

    const newMessage = await db.getAsync(
      `SELECT m.*, u.name as sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.id = ?`,
      [result.lastID]
    );

    // Notify receiver
    await createNotification(
      rId,
      `New message from ${req.user.name}: "${content.trim().slice(0, 45)}${content.length > 45 ? '...' : ''}"`,
      'message',
      `/chat/${senderId}`
    );

    res.status(201).json({
      message: 'Message sent.',
      chatMessage: newMessage
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

module.exports = router;
