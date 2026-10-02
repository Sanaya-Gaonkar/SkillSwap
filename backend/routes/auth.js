const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const ALLOWED_PUBLIC_ROLES = ['Student', 'Teacher', 'Corporate Employee', 'Other'];

// Email regex validator
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role = 'Student' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Please enter your email.' });
    }
    if (!isValidEmail(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!ALLOWED_PUBLIC_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Please select a valid account type.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Please enter a password.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await db.getAsync('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return res.status(400).json({ error: 'This email is already registered. Please log in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await db.runAsync(
      `INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, 'active')`,
      [name.trim(), cleanEmail, hashedPassword, role]
    );

    const userId = userResult.lastID;

    // Create initial profile
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`;
    await db.runAsync(
      `INSERT INTO profiles (user_id, avatar, course, year, bio, interests, availability, learning_mode)
       VALUES (?, ?, '', '', 'Excited to learn, teach, and swap skills with the SkillSwap community!', 'Tech, Learning', 'Flexible weekdays', 'Online screen share')`,
      [userId, avatarUrl]
    );

    const token = jwt.sign(
      { id: userId, email: cleanEmail, name: name.trim(), role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account registered successfully! Welcome to SkillSwap.',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        role,
        avatar: avatarUrl
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const identifier = (email || '').trim();

    if (!identifier) {
      return res.status(400).json({ error: 'Please enter your email or username.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Please enter your password.' });
    }

    const cleanEmail = identifier.toLowerCase();
    const user = await db.getAsync(
      `SELECT u.id, u.name, u.email, u.password, u.role, u.status, p.avatar, p.course, p.year,
              p.institute, p.experience_years, p.designation, p.company
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.email = ? OR LOWER(u.name) = ?`,
      [cleanEmail, cleanEmail]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`,
        course: user.course,
        year: user.year,
        institute: user.institute,
        experience_years: user.experience_years,
        designation: user.designation,
        company: user.company
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.getAsync(
      `SELECT u.id, u.name, u.email, u.role, u.status,
              p.avatar, p.course, p.year, p.institute, p.experience_years,
              p.designation, p.company, p.bio, p.interests, p.availability, p.learning_mode
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Get /me error:', err);
    res.status(500).json({ error: 'Failed to retrieve user session.' });
  }
});

module.exports = router;
