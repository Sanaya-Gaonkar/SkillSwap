const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// POST /api/reports - User submits a report
router.post('/', authenticateToken, async (req, res) => {
  try {
    const reportedBy = req.user.id;
    const { reportedUserId, reason, description } = req.body;

    if (!reportedUserId || !reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reported student and reason are required.' });
    }

    if (reportedBy === parseInt(reportedUserId, 10)) {
      return res.status(400).json({ error: 'You cannot report yourself.' });
    }

    const result = await db.runAsync(
      `INSERT INTO reports (reported_by, reported_user_id, reason, description, status)
       VALUES (?, ?, ?, ?, 'open')`,
      [reportedBy, reportedUserId, reason.trim(), description ? description.trim() : '']
    );

    res.status(201).json({
      message: 'Report submitted successfully. Our admin team will review it promptly.',
      reportId: result.lastID
    });
  } catch (err) {
    console.error('Error submitting report:', err);
    res.status(500).json({ error: 'Failed to submit report.' });
  }
});

// GET /api/reports - Admin lists all reports
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const reports = await db.allAsync(
      `SELECT rep.*,
              reporter.name as reporter_name, reporter.email as reporter_email,
              reported.name as reported_user_name, reported.email as reported_user_email,
              reported.status as reported_user_status
       FROM reports rep
       JOIN users reporter ON reporter.id = rep.reported_by
       JOIN users reported ON reported.id = rep.reported_user_id
       ORDER BY rep.created_at DESC`
    );

    res.json({ reports });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to retrieve reports.' });
  }
});

// PUT /api/reports/:id - Admin resolves a report
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    const { status } = req.body; // 'resolved' or 'open'

    if (!['resolved', 'open'].includes(status)) {
      return res.status(400).json({ error: 'Status must be open or resolved.' });
    }

    await db.runAsync(
      `UPDATE reports
       SET status = ?, resolved_at = ${status === 'resolved' ? 'CURRENT_TIMESTAMP' : 'NULL'}
       WHERE id = ?`,
      [status, reportId]
    );

    res.json({ message: `Report marked as ${status}.` });
  } catch (err) {
    console.error('Error resolving report:', err);
    res.status(500).json({ error: 'Failed to update report.' });
  }
});

module.exports = router;
