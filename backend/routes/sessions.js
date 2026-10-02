const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');
const { recordLearningActivity } = require('../utils/learning');

// GET /api/sessions - List sessions for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const sessions = await db.allAsync(
      `SELECT s.*,
              e.proposer_id, e.receiver_id, e.status as exchange_status,
              os.name as offered_skill, rs.name as requested_skill,
              proposer.name as proposer_name, receiver.name as receiver_name,
              EXISTS(SELECT 1 FROM reviews r WHERE r.exchange_id = s.exchange_id AND r.reviewer_id = ?) as has_reviewed
       FROM sessions s
       JOIN skill_exchanges e ON e.id = s.exchange_id
       JOIN skills os ON os.id = e.offered_skill_id
       JOIN skills rs ON rs.id = e.requested_skill_id
       JOIN users proposer ON proposer.id = e.proposer_id
       JOIN users receiver ON receiver.id = e.receiver_id
       WHERE e.proposer_id = ? OR e.receiver_id = ?
       ORDER BY s.scheduled_at DESC`,
      [currentUserId, currentUserId, currentUserId]
    );

    const formatted = sessions.map((sess) => {
      const isProposer = sess.proposer_id === currentUserId;
      const partnerName = isProposer ? sess.receiver_name : sess.proposer_name;
      const partnerId = isProposer ? sess.receiver_id : sess.proposer_id;
      return {
        ...sess,
        partnerName,
        partnerId
      };
    });

    res.json({ sessions: formatted });
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ error: 'Failed to retrieve sessions.' });
  }
});

// POST /api/sessions - Schedule a session for an accepted exchange
router.post('/', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { exchangeId, scheduledAt, mode, locationOrLink, notes } = req.body;

    if (!exchangeId || !scheduledAt) {
      return res.status(400).json({ error: 'Exchange ID and scheduled date/time are required.' });
    }

    const exchange = await db.getAsync(
      'SELECT * FROM skill_exchanges WHERE id = ?',
      [exchangeId]
    );

    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found.' });
    }

    if (exchange.proposer_id !== currentUserId && exchange.receiver_id !== currentUserId) {
      return res.status(403).json({ error: 'You are not a participant in this exchange.' });
    }

    if (exchange.status !== 'accepted') {
      return res.status(400).json({ error: 'Can only schedule sessions for accepted exchanges.' });
    }

    const result = await db.runAsync(
      `INSERT INTO sessions (exchange_id, scheduled_at, mode, location_or_link, notes, status)
       VALUES (?, ?, ?, ?, ?, 'scheduled')`,
      [
        exchangeId,
        scheduledAt,
        mode || 'Online',
        locationOrLink || 'Online Video Call',
        notes || 'Peer skill exchange session'
      ]
    );

    const partnerId = currentUserId === exchange.proposer_id ? exchange.receiver_id : exchange.proposer_id;
    await createNotification(
      partnerId,
      `${req.user.name} scheduled a learning session for ${new Date(scheduledAt).toLocaleString()}. Mode: ${mode || 'Online'}.`,
      'session_scheduled',
      `/sessions`
    );

    res.status(201).json({
      message: 'Session scheduled successfully!',
      sessionId: result.lastID
    });
  } catch (err) {
    console.error('Error scheduling session:', err);
    res.status(500).json({ error: 'Failed to schedule session.' });
  }
});

// PUT /api/sessions/:id - Update session status (e.g. started, completed)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    const { status, locationOrLink, notes } = req.body;
    const currentUserId = req.user.id;

    const session = await db.getAsync(
      `SELECT s.*, e.proposer_id, e.receiver_id
       FROM sessions s
       JOIN skill_exchanges e ON e.id = s.exchange_id
       WHERE s.id = ?`,
      [sessionId]
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (session.proposer_id !== currentUserId && session.receiver_id !== currentUserId && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized to update this session.' });
    }

    if (status && !['scheduled', 'started', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid session status.' });
    }

    await db.runAsync(
      `UPDATE sessions
       SET status = COALESCE(?, status),
           location_or_link = COALESCE(?, location_or_link),
           notes = COALESCE(?, notes)
       WHERE id = ?`,
      [status || null, locationOrLink || null, notes || null, sessionId]
    );

    if (status === 'completed') {
      await Promise.all([
        recordLearningActivity(session.proposer_id, 'session_completed', 'session', sessionId, 30, 'Completed a learning session'),
        recordLearningActivity(session.receiver_id, 'session_completed', 'session', sessionId, 30, 'Completed a learning session')
      ]);
      const partnerId = currentUserId === session.proposer_id ? session.receiver_id : session.proposer_id;
      await createNotification(
        partnerId,
        `${req.user.name} marked the session as completed! You can now rate and leave feedback for your learning partner.`,
        'session_completed',
        `/exchanges/${session.exchange_id}`
      );
    }

    res.json({ message: 'Session updated successfully.' });
  } catch (err) {
    console.error('Error updating session:', err);
    res.status(500).json({ error: 'Failed to update session.' });
  }
});

module.exports = router;
