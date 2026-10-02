const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { getLevelBadges } = require('../utils/learning');

// Optional auth helper to get user id if logged in
function getUserIdFromReq(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../middleware/auth');
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded.id;
    } catch (e) {
      return null;
    }
  }
  return null;
}

// GET /api/users/filters - Current profile values for the Discover filters.
router.get('/filters', async (req, res) => {
  try {
    const [courses, years, availability] = await Promise.all([
      db.allAsync(
        `SELECT DISTINCT TRIM(p.course) AS value FROM profiles p
         JOIN users u ON u.id = p.user_id
         WHERE u.status = 'active' AND u.role <> 'Admin'
           AND p.course IS NOT NULL AND TRIM(p.course) <> ''
         ORDER BY value`
      ),
      db.allAsync(
        `SELECT DISTINCT TRIM(p.year) AS value FROM profiles p
         JOIN users u ON u.id = p.user_id
         WHERE u.status = 'active' AND u.role <> 'Admin'
           AND p.year IS NOT NULL AND TRIM(p.year) <> ''
         ORDER BY value`
      ),
      db.allAsync(
        `SELECT DISTINCT TRIM(p.availability) AS value FROM profiles p
         JOIN users u ON u.id = p.user_id
         WHERE u.status = 'active' AND u.role <> 'Admin'
           AND p.availability IS NOT NULL AND TRIM(p.availability) <> ''
         ORDER BY value`
      )
    ]);
    res.json({
      courses: courses.map((item) => item.value),
      years: years.map((item) => item.value),
      availability: availability.map((item) => item.value)
    });
  } catch (err) {
    console.error('Error fetching discover filter options:', err);
    res.status(500).json({ error: 'Failed to retrieve discover filter options.' });
  }
});

// GET /api/users - Discover students with search and filters
router.get('/', async (req, res) => {
  try {
    const { search, skill, course, year, availability, skillType = 'teach', minRating } = req.query;
    const currentUserId = getUserIdFromReq(req);
    if (!['teach', 'learn'].includes(skillType)) {
      return res.status(400).json({ error: 'Skill type must be teach or learn.' });
    }
    const ratingThreshold = minRating === undefined || minRating === '' ? null : Number(minRating);
    if (ratingThreshold !== null && (![3, 4, 5].includes(ratingThreshold))) {
      return res.status(400).json({ error: 'Minimum rating must be 3, 4, or 5.' });
    }

    let query = `
      SELECT u.id, u.name, u.email, u.role, u.status,
             p.avatar, p.course, p.year, p.bio, p.availability, p.learning_mode,
             ROUND(AVG(r.rating), 1) as avg_rating,
             COUNT(DISTINCT r.id) as review_count
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN reviews r ON r.reviewed_user_id = u.id
      WHERE u.status = 'active' AND u.role <> 'Admin'
    `;
    const params = [];

    if (currentUserId) {
      query += ` AND u.id != ?`;
      params.push(currentUserId);
    }

    if (course && course !== 'All') {
      query += ` AND p.course LIKE ?`;
      params.push(`%${course}%`);
    }

    if (year && year !== 'All') {
      query += ` AND p.year LIKE ?`;
      params.push(`%${year}%`);
    }

    if (availability && availability !== 'All') {
      query += ` AND p.availability = ?`;
      params.push(availability);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (
        u.name LIKE ? OR
        p.course LIKE ? OR
        p.bio LIKE ? OR
        u.id IN (
          SELECT us.user_id FROM user_skills us
          JOIN skills s ON s.id = us.skill_id
          WHERE s.name LIKE ?
        )
      )`;
      params.push(term, term, term, term);
    }

    if (skill && skill !== 'All') {
      query += ` AND u.id IN (
        SELECT us.user_id FROM user_skills us
        JOIN skills s ON s.id = us.skill_id
        WHERE s.name = ? COLLATE NOCASE AND us.type = ?
      )`;
      params.push(skill, skillType);
    }

    query += ` GROUP BY u.id`;
    if (ratingThreshold !== null) {
      query += ` HAVING AVG(r.rating) >= ?`;
      params.push(ratingThreshold);
    }
    query += ` ORDER BY u.name COLLATE NOCASE ASC`;

    const users = await db.allAsync(query, params);

    // Fetch skills for all returned users
    for (const u of users) {
      const skills = await db.allAsync(
        `SELECT s.id, s.name, s.category, us.type, us.proficiency
         FROM user_skills us
         JOIN skills s ON s.id = us.skill_id
         WHERE us.user_id = ?
         ORDER BY s.name ASC`,
        [u.id]
      );
      u.teachSkills = skills.filter((s) => s.type === 'teach');
      u.learnSkills = skills.filter((s) => s.type === 'learn');

      // Check connection status with current user
      if (currentUserId) {
        const connection = await db.getAsync(
          `SELECT id, sender_id, receiver_id, status FROM connections
           WHERE (sender_id = ? AND receiver_id = ?)
              OR (sender_id = ? AND receiver_id = ?)`,
          [currentUserId, u.id, u.id, currentUserId]
        );
        u.connection = connection || null;
      }
    }

    res.json({ users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to retrieve students.' });
  }
});

// GET /api/users/:id - Single student profile details
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const currentUserId = getUserIdFromReq(req);

    const user = await db.getAsync(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.created_at,
              p.avatar, p.course, p.year, p.institute, p.experience_years,
              p.designation, p.company, p.bio, p.interests, p.availability, p.learning_mode
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const skills = await db.allAsync(
      `SELECT s.id, s.name, s.category, us.type, us.proficiency
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ?
       ORDER BY s.name ASC`,
      [userId]
    );

    const teachSkills = skills.filter((s) => s.type === 'teach');
    const learnSkills = skills.filter((s) => s.type === 'learn');

    // Fetch reviews
    const reviews = await db.allAsync(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.id as reviewer_id, u.name as reviewer_name, p.avatar as reviewer_avatar
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE r.reviewed_user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : null;

    // Completed exchanges count
    const completedExchanges = await db.getAsync(
      `SELECT COUNT(*) as count FROM skill_exchanges
       WHERE (proposer_id = ? OR receiver_id = ?) AND status = 'completed'`,
      [userId, userId]
    );
    const learningXp = await db.getAsync(
      'SELECT COALESCE(SUM(xp), 0) AS total FROM learning_activities WHERE user_id = ?',
      [userId]
    );

    let connection = null;
    if (currentUserId && currentUserId !== userId) {
      connection = await db.getAsync(
        `SELECT id, sender_id, receiver_id, status FROM connections
         WHERE (sender_id = ? AND receiver_id = ?)
            OR (sender_id = ? AND receiver_id = ?)`,
        [currentUserId, userId, userId, currentUserId]
      );
    }

    res.json({
      user: {
        ...user,
        teachSkills,
        learnSkills,
        reviews,
        avgRating,
        completedExchanges: completedExchanges?.count || 0,
        levelBadges: getLevelBadges(learningXp.total),
        connection
      }
    });
  } catch (err) {
    console.error('Error fetching student details:', err);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// PUT /api/users/:id - Update user basic info
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (req.user.id !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'You are not authorized to update this user.' });
    }

    const { name } = req.body;
    if (name) {
      await db.runAsync(`UPDATE users SET name = ? WHERE id = ?`, [name.trim(), userId]);
    }

    res.json({ message: 'User updated successfully.' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

module.exports = router;
