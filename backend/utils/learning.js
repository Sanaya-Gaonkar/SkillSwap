const { db } = require('../database/db');

async function recordLearningActivity(userId, activityType, sourceType, sourceId, xp, details = '') {
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO learning_activities
       (user_id, activity_type, source_type, source_id, xp, details)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, activityType, sourceType, String(sourceId), xp, details]
  );

  if (result.changes > 0) {
    const dates = await db.allAsync(
      `SELECT DISTINCT date(occurred_at) AS activity_date FROM learning_activities
       WHERE user_id = ? ORDER BY activity_date DESC`,
      [userId]
    );
    const today = new Date().toISOString().slice(0, 10);
    if (dates[0]?.activity_date === today) {
      let streak = 1;
      for (let index = 1; index < dates.length; index += 1) {
        const newer = new Date(`${dates[index - 1].activity_date}T00:00:00.000Z`);
        const older = new Date(`${dates[index].activity_date}T00:00:00.000Z`);
        if ((newer - older) / 86400000 !== 1) break;
        streak += 1;
      }
      if (streak >= 7 && streak % 7 === 0) {
        await db.runAsync(
          `INSERT OR IGNORE INTO learning_activities
             (user_id, activity_type, source_type, source_id, xp, details)
           VALUES (?, 'streak_bonus', 'streak', ?, 25, ?)`,
          [userId, `week-${streak}`, `${streak}-day learning streak bonus`]
        );
      }
    }
  }

  return result.changes > 0;
}

module.exports = { recordLearningActivity };
