const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats - Overview metrics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await db.getAsync(`SELECT COUNT(*) as count FROM users WHERE role <> 'Admin'`);
    const totalSkills = await db.getAsync(`SELECT COUNT(*) as count FROM skills`);
    const activeExchanges = await db.getAsync(
      `SELECT COUNT(*) as count FROM skill_exchanges WHERE status IN ('proposed', 'accepted')`
    );
    const completedExchanges = await db.getAsync(
      `SELECT COUNT(*) as count FROM skill_exchanges WHERE status = 'completed'`
    );
    const pendingReports = await db.getAsync(
      `SELECT COUNT(*) as count FROM reports WHERE status = 'open'`
    );

    res.json({
      stats: {
        totalUsers: totalUsers?.count || 0,
        totalSkills: totalSkills?.count || 0,
        activeExchanges: activeExchanges?.count || 0,
        completedExchanges: completedExchanges?.count || 0,
        pendingReports: pendingReports?.count || 0
      }
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Failed to retrieve admin stats.' });
  }
});

// GET /api/admin/users - Manage users list with search
router.get('/users', async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.role, u.status, u.created_at,
             p.course, p.year, p.avatar,
             COUNT(DISTINCT us.id) as skill_count,
             COUNT(DISTINCT r.id) as report_count
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN user_skills us ON us.user_id = u.id
      LEFT JOIN reports r ON r.reported_user_id = u.id AND r.status = 'open'
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR p.course LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` GROUP BY u.id ORDER BY u.role DESC, u.created_at DESC`;

    const users = await db.allAsync(query, params);
    res.json({ users });
  } catch (err) {
    console.error('Error fetching admin users:', err);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

// PUT /api/admin/users/:id/status - Enable or disable a user account
router.put('/users/:id/status', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { status } = req.body; // 'active' or 'disabled'

    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or disabled.' });
    }

    const targetUser = await db.getAsync('SELECT * FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (targetUser.role === 'Admin') {
      return res.status(400).json({ error: 'Cannot disable an administrator account.' });
    }

    await db.runAsync('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

    res.json({ message: `User account has been ${status === 'active' ? 'enabled' : 'disabled'}.` });
  } catch (err) {
    console.error('Error updating user status:', err);
    res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// GET /api/admin/skills - Skills with usage statistics
router.get('/skills', async (req, res) => {
  try {
    const skills = await db.allAsync(
      `SELECT s.*,
              COUNT(DISTINCT CASE WHEN us.type = 'teach' THEN us.user_id END) as teachers_count,
              COUNT(DISTINCT CASE WHEN us.type = 'learn' THEN us.user_id END) as learners_count
       FROM skills s
       LEFT JOIN user_skills us ON us.skill_id = s.id
       GROUP BY s.id
       ORDER BY s.category ASC, s.name ASC`
    );

    res.json({ skills });
  } catch (err) {
    console.error('Error fetching admin skills:', err);
    res.status(500).json({ error: 'Failed to retrieve skills list.' });
  }
});

module.exports = router;
