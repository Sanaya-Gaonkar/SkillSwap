const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');
const { recordLearningActivity } = require('../utils/learning');

// GET /api/exchanges - List all exchanges for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const exchanges = await db.allAsync(
      `SELECT e.*,
              p.name as proposer_name, pp.avatar as proposer_avatar,
              r.name as receiver_name, rp.avatar as receiver_avatar,
              os.name as offered_skill_name, os.category as offered_skill_category,
              rs.name as requested_skill_name, rs.category as requested_skill_category
       FROM skill_exchanges e
       JOIN users p ON p.id = e.proposer_id
       LEFT JOIN profiles pp ON pp.user_id = p.id
       JOIN users r ON r.id = e.receiver_id
       LEFT JOIN profiles rp ON rp.user_id = r.id
       JOIN skills os ON os.id = e.offered_skill_id
       JOIN skills rs ON rs.id = e.requested_skill_id
       WHERE e.proposer_id = ? OR e.receiver_id = ?
       ORDER BY e.updated_at DESC`,
      [currentUserId, currentUserId]
    );

    // Attach latest session and reviews info
    for (const ex of exchanges) {
      ex.sessions = await db.allAsync(
        'SELECT * FROM sessions WHERE exchange_id = ? ORDER BY scheduled_at ASC',
        [ex.id]
      );
      ex.reviews = await db.allAsync(
        'SELECT * FROM reviews WHERE exchange_id = ?',
        [ex.id]
      );
      ex.isProposer = ex.proposer_id === currentUserId;
      ex.myPartner = ex.isProposer
        ? { id: ex.receiver_id, name: ex.receiver_name, avatar: ex.receiver_avatar }
        : { id: ex.proposer_id, name: ex.proposer_name, avatar: ex.proposer_avatar };
    }

    res.json({ exchanges });
  } catch (err) {
    console.error('Error fetching exchanges:', err);
    res.status(500).json({ error: 'Failed to retrieve skill exchanges.' });
  }
});

// GET /api/exchanges/:id - Get details of a single exchange
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const exchangeId = parseInt(req.params.id, 10);

    const exchange = await db.getAsync(
      `SELECT e.*,
              p.name as proposer_name, pp.avatar as proposer_avatar, pp.course as proposer_course,
              r.name as receiver_name, rp.avatar as receiver_avatar, rp.course as receiver_course,
              os.name as offered_skill_name, os.category as offered_skill_category,
              rs.name as requested_skill_name, rs.category as requested_skill_category
       FROM skill_exchanges e
       JOIN users p ON p.id = e.proposer_id
       LEFT JOIN profiles pp ON pp.user_id = p.id
       JOIN users r ON r.id = e.receiver_id
       LEFT JOIN profiles rp ON rp.user_id = r.id
       JOIN skills os ON os.id = e.offered_skill_id
       JOIN skills rs ON rs.id = e.requested_skill_id
       WHERE e.id = ? AND (e.proposer_id = ? OR e.receiver_id = ? OR ? = 'Admin')`,
      [exchangeId, currentUserId, currentUserId, req.user.role]
    );

    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found or access denied.' });
    }

    const sessions = await db.allAsync(
      'SELECT * FROM sessions WHERE exchange_id = ? ORDER BY scheduled_at DESC',
      [exchangeId]
    );

    const reviews = await db.allAsync(
      `SELECT rev.*, u.name as reviewer_name, p.avatar as reviewer_avatar
       FROM reviews rev
       JOIN users u ON u.id = rev.reviewer_id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE rev.exchange_id = ?`,
      [exchangeId]
    );

    const isProposer = exchange.proposer_id === currentUserId;
    const hasReviewed = reviews.some((r) => r.reviewer_id === currentUserId);

    res.json({
      exchange: {
        ...exchange,
        sessions,
        reviews,
        isProposer,
        hasReviewed,
        partner: isProposer
          ? { id: exchange.receiver_id, name: exchange.receiver_name, avatar: exchange.receiver_avatar }
          : { id: exchange.proposer_id, name: exchange.proposer_name, avatar: exchange.proposer_avatar }
      }
    });
  } catch (err) {
    console.error('Error fetching exchange detail:', err);
    res.status(500).json({ error: 'Failed to retrieve exchange details.' });
  }
});

// POST /api/exchanges - Propose a two-way skill exchange
router.post('/', authenticateToken, async (req, res) => {
  try {
    const proposerId = req.user.id;
    const { receiverId, offeredSkillId, requestedSkillId, notes } = req.body;

    if (!receiverId || !offeredSkillId || !requestedSkillId) {
      return res.status(400).json({ error: 'Receiver, offered skill, and requested skill are all required.' });
    }

    const rId = parseInt(receiverId, 10);
    if (proposerId === rId) {
      return res.status(400).json({ error: 'You cannot propose an exchange with yourself.' });
    }

    // Insert skill exchange
    const result = await db.runAsync(
      `INSERT INTO skill_exchanges (proposer_id, receiver_id, offered_skill_id, requested_skill_id, notes, status)
       VALUES (?, ?, ?, ?, ?, 'proposed')`,
      [proposerId, rId, offeredSkillId, requestedSkillId, notes || '']
    );

    const exchangeId = result.lastID;

    // Get skill names for friendly notification
    const offeredSkill = await db.getAsync('SELECT name FROM skills WHERE id = ?', [offeredSkillId]);
    const requestedSkill = await db.getAsync('SELECT name FROM skills WHERE id = ?', [requestedSkillId]);

    // Send notification to receiver
    await createNotification(
      rId,
      `${req.user.name} proposed a skill swap: Teaching "${offeredSkill?.name}" in exchange for learning "${requestedSkill?.name}".`,
      'exchange_proposal',
      `/exchanges/${exchangeId}`
    );

    res.status(201).json({
      message: 'Skill exchange proposal sent successfully!',
      exchangeId
    });
  } catch (err) {
    console.error('Error proposing exchange:', err);
    res.status(500).json({ error: 'Failed to send exchange proposal.' });
  }
});

// PUT /api/exchanges/:id - Accept, reject, or complete exchange
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const exchangeId = parseInt(req.params.id, 10);
    const { status } = req.body; // 'accepted', 'rejected', 'completed'
    const currentUserId = req.user.id;

    if (!['accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid exchange status.' });
    }

    const exchange = await db.getAsync(
      `SELECT e.*, os.name as offered_skill, rs.name as requested_skill
       FROM skill_exchanges e
       JOIN skills os ON os.id = e.offered_skill_id
       JOIN skills rs ON rs.id = e.requested_skill_id
       WHERE e.id = ?`,
      [exchangeId]
    );

    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found.' });
    }

    if (exchange.status === 'completed') {
      return res.status(400).json({ error: 'This exchange has already been completed.' });
    }

    if (status === 'completed') {
      if (exchange.status !== 'accepted') {
        return res.status(400).json({ error: 'Only accepted exchanges can be completed.' });
      }
      const completedSession = await db.getAsync(
        `SELECT id FROM sessions WHERE exchange_id = ? AND status = 'completed' LIMIT 1`,
        [exchangeId]
      );
      if (!completedSession) {
        return res.status(400).json({ error: 'Complete a learning session before completing this exchange.' });
      }
    }

    // Authorization checks
    if (status === 'accepted' || status === 'rejected') {
      if (exchange.receiver_id !== currentUserId && req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Only the recipient can accept or reject the proposal.' });
      }
    }

    if (status === 'completed') {
      if (exchange.proposer_id !== currentUserId && exchange.receiver_id !== currentUserId && req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Only participants can mark this exchange as completed.' });
      }
    }

    await db.runAsync(
      `UPDATE skill_exchanges SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, exchangeId]
    );

    // Notifications and Learning History updates
    if (status === 'accepted') {
      await createNotification(
        exchange.proposer_id,
        `${req.user.name} accepted your skill exchange proposal for ${exchange.offered_skill} ⇋ ${exchange.requested_skill}! You can now schedule a session.`,
        'exchange_accepted',
        `/exchanges/${exchangeId}`
      );
    } else if (status === 'rejected') {
      await createNotification(
        exchange.proposer_id,
        `${req.user.name} declined the skill exchange proposal.`,
        'exchange_rejected',
        '/exchanges'
      );
    } else if (status === 'completed') {
      const today = new Date().toISOString().split('T')[0];

      // Proposer learned requested skill from receiver
      await db.runAsync(
        `INSERT INTO learning_history (user_id, skill_id, exchange_id, partner_id, learned_on)
         VALUES (?, ?, ?, ?, ?)`,
        [exchange.proposer_id, exchange.requested_skill_id, exchangeId, exchange.receiver_id, today]
      );

      // Receiver learned offered skill from proposer
      await db.runAsync(
        `INSERT INTO learning_history (user_id, skill_id, exchange_id, partner_id, learned_on)
         VALUES (?, ?, ?, ?, ?)`,
        [exchange.receiver_id, exchange.offered_skill_id, exchangeId, exchange.proposer_id, today]
      );

      await Promise.all([
        recordLearningActivity(exchange.proposer_id, 'exchange_completed', 'exchange', exchangeId, 80, 'Completed a skill exchange'),
        recordLearningActivity(exchange.receiver_id, 'exchange_completed', 'exchange', exchangeId, 80, 'Completed a skill exchange'),
        recordLearningActivity(exchange.proposer_id, 'skill_taught', 'exchange', exchangeId, 15, `Shared ${exchange.offered_skill}`),
        recordLearningActivity(exchange.receiver_id, 'skill_taught', 'exchange', exchangeId, 15, `Shared ${exchange.requested_skill}`),
        recordLearningActivity(exchange.proposer_id, 'skill_learned', 'exchange', exchangeId, 15, `Learned ${exchange.requested_skill}`),
        recordLearningActivity(exchange.receiver_id, 'skill_learned', 'exchange', exchangeId, 15, `Learned ${exchange.offered_skill}`)
      ]);

      // Notify both participants to review
      const otherUserId = currentUserId === exchange.proposer_id ? exchange.receiver_id : exchange.proposer_id;
      await createNotification(
        otherUserId,
        `Your skill exchange has been marked as completed! Please rate and review your learning partner.`,
        'exchange_completed',
        `/exchanges/${exchangeId}`
      );
      await createNotification(
        currentUserId,
        `Skill exchange completed! Don't forget to rate and leave feedback for your learning partner.`,
        'exchange_completed',
        `/exchanges/${exchangeId}`
      );
    }

    res.json({ message: `Exchange status updated to ${status}.` });
  } catch (err) {
    console.error('Error updating exchange:', err);
    res.status(500).json({ error: 'Failed to update exchange.' });
  }
});

module.exports = router;
