const express = require('express');
const router = express.Router({ mergeParams: true });
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/users/:id/skills
router.get('/', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const skills = await db.allAsync(
      `SELECT us.id as user_skill_id, us.type, us.proficiency,
              s.id as skill_id, s.name, s.category, s.description
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ?
       ORDER BY s.name ASC`,
      [userId]
    );

    res.json({
      teachSkills: skills.filter((s) => s.type === 'teach'),
      learnSkills: skills.filter((s) => s.type === 'learn')
    });
  } catch (err) {
    console.error('Error fetching user skills:', err);
    res.status(500).json({ error: 'Failed to retrieve user skills.' });
  }
});

// POST /api/users/:id/skills - Add a single skill
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (req.user.id !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized to modify skills for this user.' });
    }

    const { skillId, type, proficiency } = req.body;
    if (!skillId || !type) {
      return res.status(400).json({ error: 'Skill ID and type (teach/learn) are required.' });
    }

    await db.runAsync(
      `INSERT INTO user_skills (user_id, skill_id, type, proficiency)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, skill_id, type) DO UPDATE SET
         proficiency = excluded.proficiency`,
      [userId, skillId, type, proficiency || 'Intermediate']
    );

    res.status(201).json({ message: 'Skill added successfully.' });
  } catch (err) {
    console.error('Error adding user skill:', err);
    res.status(500).json({ error: 'Failed to add skill.' });
  }
});

// POST /api/users/:id/skills/custom - Create/use a custom skill and add it to the user
router.post('/custom', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (req.user.id !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized to modify skills for this user.' });
    }

    const { name, type, category = 'Other', description = '', proficiency = 'Intermediate' } = req.body;
    const cleanName = String(name || '').trim();
    if (!cleanName) return res.status(400).json({ error: 'Custom skill name is required.' });
    if (!['teach', 'learn'].includes(type)) return res.status(400).json({ error: 'Skill type must be teach or learn.' });
    const safeCategory = ['Programming', 'Web', 'Design', 'Business', 'Other'].includes(category) ? category : 'Other';

    let skill = await db.getAsync('SELECT id, name, category, description FROM skills WHERE name = ? COLLATE NOCASE', [cleanName]);
    if (!skill) {
      const result = await db.runAsync(
        'INSERT INTO skills (name, category, description) VALUES (?, ?, ?)',
        [cleanName, safeCategory, description.trim()]
      );
      skill = { id: result.lastID, name: cleanName, category: safeCategory, description: description.trim() };
    }

    await db.runAsync(
      `INSERT INTO user_skills (user_id, skill_id, type, proficiency)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, skill_id, type) DO UPDATE SET proficiency = excluded.proficiency`,
      [userId, skill.id, type, proficiency || 'Intermediate']
    );

    res.status(201).json({ message: 'Custom skill added successfully.', skill });
  } catch (err) {
    console.error('Error creating custom skill:', err);
    res.status(500).json({ error: 'Failed to add custom skill.' });
  }
});

// DELETE /api/users/:id/skills/:skillId - Remove a skill
router.delete('/:skillId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const skillId = parseInt(req.params.skillId, 10);
    const { type } = req.query; // optional: specify teach or learn

    if (req.user.id !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized to remove skills for this user.' });
    }

    let query = 'DELETE FROM user_skills WHERE user_id = ? AND skill_id = ?';
    const params = [userId, skillId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    await db.runAsync(query, params);
    res.json({ message: 'Skill removed successfully.' });
  } catch (err) {
    console.error('Error deleting user skill:', err);
    res.status(500).json({ error: 'Failed to delete user skill.' });
  }
});

// PUT /api/users/:id/skills/batch - Batch update teach and learn skills
router.put('/batch', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (req.user.id !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized to modify skills for this user.' });
    }

    const { teachSkillIds = [], learnSkillIds = [] } = req.body;

    // Delete existing user skills
    await db.runAsync('DELETE FROM user_skills WHERE user_id = ?', [userId]);

    // Insert teach skills
    for (const sId of teachSkillIds) {
      await db.runAsync(
        'INSERT INTO user_skills (user_id, skill_id, type, proficiency) VALUES (?, ?, "teach", "Intermediate")',
        [userId, sId]
      );
    }

    // Insert learn skills
    for (const sId of learnSkillIds) {
      await db.runAsync(
        'INSERT INTO user_skills (user_id, skill_id, type, proficiency) VALUES (?, ?, "learn", "Beginner")',
        [userId, sId]
      );
    }

    res.json({ message: 'Skills saved successfully.' });
  } catch (err) {
    console.error('Error batch updating user skills:', err);
    res.status(500).json({ error: 'Failed to save skills.' });
  }
});

module.exports = router;
