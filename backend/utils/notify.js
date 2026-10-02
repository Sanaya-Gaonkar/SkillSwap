const { db } = require('../database/db');

async function createNotification(userId, message, type, link = null) {
  try {
    await db.runAsync(
      `INSERT INTO notifications (user_id, message, type, link, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
      [userId, message, type, link]
    );
  } catch (err) {
    console.error('Error creating notification:', err.message);
  }
}

module.exports = {
  createNotification
};
