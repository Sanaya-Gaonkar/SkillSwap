const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/profile/:userId
router.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const profile = await db.getAsync(
      `SELECT p.*, u.name, u.email, u.role
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = ?`,
      [userId]
    );

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const skills = await db.allAsync(
      `SELECT s.id, s.name, s.category, us.type, us.proficiency
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ?
       ORDER BY s.name ASC`,
      [userId]
    );

    res.json({
      profile: {
        ...profile,
        teachSkills: skills.filter((s) => s.type === 'teach'),
        learnSkills: skills.filter((s) => s.type === 'learn')
      }
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// PUT /api/profile/:userId
router.put('/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);

    if (req.user.id !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Not authorized to edit this profile.' });
    }

    const targetUser = await db.getAsync('SELECT role FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const {
      name,
      avatar,
      course,
      year,
      institute,
      experience_years,
      designation,
      company,
      bio,
      interests,
      availability,
      learning_mode
    } = req.body;

    const cleanCourse = typeof course === 'string' ? course.trim() : '';
    const cleanYear = typeof year === 'string' ? year.trim() : '';
    const cleanInstitute = typeof institute === 'string' ? institute.trim() : '';
    const cleanDesignation = typeof designation === 'string' ? designation.trim() : '';
    const cleanCompany = typeof company === 'string' ? company.trim() : '';
    const hasExperience = typeof experience_years === 'number'
      || (typeof experience_years === 'string' && experience_years.trim() !== '');
    const cleanExperience = hasExperience ? Number(experience_years) : null;

    if (targetUser.role === 'Student' && (!cleanCourse || !cleanYear)) {
      return res.status(400).json({ error: 'Course and college year are required for student profiles.' });
    }
    if (targetUser.role === 'Teacher' && (!cleanCourse || !hasExperience || !Number.isInteger(cleanExperience) || cleanExperience < 0)) {
      return res.status(400).json({ error: 'Course taught and years of experience are required for teacher profiles.' });
    }
    if (targetUser.role === 'Corporate Employee' && (!cleanDesignation || !hasExperience || !Number.isInteger(cleanExperience) || cleanExperience < 0)) {
      return res.status(400).json({ error: 'Designation and years of experience are required for corporate employee profiles.' });
    }

    if (name && name.trim()) {
      await db.runAsync('UPDATE users SET name = ? WHERE id = ?', [name.trim(), userId]);
    }

    await db.runAsync(
      `INSERT INTO profiles (user_id, avatar, course, year, institute, experience_years, designation, company, bio, interests, availability, learning_mode, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         avatar = excluded.avatar,
         course = excluded.course,
         year = excluded.year,
         institute = excluded.institute,
         experience_years = excluded.experience_years,
         designation = excluded.designation,
         company = excluded.company,
         bio = excluded.bio,
         interests = excluded.interests,
         availability = excluded.availability,
         learning_mode = excluded.learning_mode,
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'user')}`,
        cleanCourse,
        cleanYear,
        cleanInstitute,
        cleanExperience,
        cleanDesignation,
        cleanCompany,
        bio || '',
        interests || '',
        availability || '',
        learning_mode || ''
      ]
    );

    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;
