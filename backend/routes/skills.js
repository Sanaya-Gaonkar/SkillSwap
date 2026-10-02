const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// GET /api/skills - List all skills
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM skills WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search && search.trim()) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ' ORDER BY name ASC';
    const skills = await db.allAsync(query, params);
    res.json({ skills });
  } catch (err) {
    console.error('Error fetching skills:', err);
    res.status(500).json({ error: 'Failed to retrieve skills.' });
  }
});

// POST /api/skills - Admin add new skill
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, category, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Skill name is required.' });
    }
    if (!category) {
      return res.status(400).json({ error: 'Skill category is required.' });
    }

    const cleanName = name.trim();
    const existing = await db.getAsync('SELECT id FROM skills WHERE name = ? COLLATE NOCASE', [cleanName]);
    if (existing) {
      return res.status(400).json({ error: 'A skill with this name already exists.' });
    }

    const result = await db.runAsync(
      'INSERT INTO skills (name, category, description) VALUES (?, ?, ?)',
      [cleanName, category, description || '']
    );

    res.status(201).json({
      message: 'Skill created successfully.',
      skill: { id: result.lastID, name: cleanName, category, description: description || '' }
    });
  } catch (err) {
    console.error('Error adding skill:', err);
    res.status(500).json({ error: 'Failed to create skill.' });
  }
});

// PUT /api/skills/:id - Admin update skill
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const skillId = parseInt(req.params.id, 10);
    const { name, category, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Skill name is required.' });
    }

    await db.runAsync(
      'UPDATE skills SET name = ?, category = ?, description = ? WHERE id = ?',
      [name.trim(), category, description || '', skillId]
    );

    res.json({ message: 'Skill updated successfully.' });
  } catch (err) {
    console.error('Error updating skill:', err);
    res.status(500).json({ error: 'Failed to update skill.' });
  }
});

// DELETE /api/skills/:id - Admin delete skill
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const skillId = parseInt(req.params.id, 10);
    await db.runAsync('DELETE FROM skills WHERE id = ?', [skillId]);
    res.json({ message: 'Skill removed successfully.' });
  } catch (err) {
    console.error('Error deleting skill:', err);
    res.status(500).json({ error: 'Failed to delete skill. It may be linked to active exchanges.' });
  }
});

module.exports = router;
