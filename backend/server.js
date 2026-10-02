require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./database/db');

// Route imports
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const profileRoutes = require('./routes/profile');
const skillsRoutes = require('./routes/skills');
const userSkillsRoutes = require('./routes/userSkills');
const matchesRoutes = require('./routes/matches');
const connectionsRoutes = require('./routes/connections');
const messagesRoutes = require('./routes/messages');
const exchangesRoutes = require('./routes/exchanges');
const sessionsRoutes = require('./routes/sessions');
const reviewsRoutes = require('./routes/reviews');
const historyRoutes = require('./routes/history');
const notificationsRoutes = require('./routes/notifications');
const reportsRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const learningRoutes = require('./routes/learning');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/users/:id/skills', userSkillsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/exchanges', exchangesRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/learning-history', historyRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/learning', learningRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'SkillSwap API', version: '1.0.0' });
});

// Serve frontend build if present
const frontendDist = path.resolve(__dirname, '../frontend/dist');
if (require('fs').existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Friendly global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
});

// Initialize database and start server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  SkillSwap Backend API running on port ${PORT}`);
      console.log(`  Base URL: http://localhost:${PORT}`);
      console.log(`===============================================`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database on startup:', err);
    process.exit(1);
  });
