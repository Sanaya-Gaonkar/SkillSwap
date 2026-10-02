const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { getLevelBadges, recordLearningActivity } = require('../utils/learning');

const ROADMAPS = {
  javascript: [
    ['JavaScript foundations', 'Learn values, variables, operators, and control flow.', 'Write a small program that converts temperatures.'],
    ['Functions and arrays', 'Practice reusable functions and common array operations.', 'Build a searchable list using map, filter, and reduce.'],
    ['DOM and browser events', 'Connect JavaScript logic to an interactive page.', 'Create a form with client-side validation.'],
    ['Async JavaScript', 'Understand promises, async/await, and fetching data.', 'Fetch a public JSON endpoint and render its results.'],
    ['Build and review a project', 'Combine the concepts into a complete, accessible feature.', 'Build a small task tracker and ask a peer to review it.']
  ],
  react: [
    ['JavaScript and JSX foundations', 'Review modern JavaScript and learn how JSX describes UI.', 'Build a small component that renders a list of skills.'],
    ['Components and props', 'Split an interface into reusable components and pass data through props.', 'Create a reusable profile card with configurable content.'],
    ['State and events', 'Manage interactive UI state and respond to user input.', 'Build a filterable skill catalog.'],
    ['Effects and data fetching', 'Load remote data and synchronize effects safely.', 'Fetch records from an API and add loading and error states.'],
    ['Routing, forms, and project', 'Connect pages, validate forms, and assemble a polished app.', 'Build a small multi-page peer-learning app.']
  ],
  python: [
    ['Python foundations', 'Learn variables, types, expressions, and control flow.', 'Write a command-line unit converter.'],
    ['Collections and functions', 'Use lists, dictionaries, loops, and reusable functions.', 'Create a program that summarizes a set of study scores.'],
    ['Files and error handling', 'Read and write files and handle expected errors.', 'Build a notes tool that saves and loads a text file.'],
    ['Modules and testing', 'Organize code into modules and verify behavior with tests.', 'Add tests for a small utility module.'],
    ['Build a practical project', 'Combine core concepts into a useful, maintainable program.', 'Build a command-line study planner and document how to use it.']
  ]
};

function createSteps(skillName) {
  const key = skillName.toLowerCase().replace(/\.js$/, '').trim();
  const template = ROADMAPS[key] || [
    [`${skillName} foundations`, `Identify the core concepts, vocabulary, and tools used in ${skillName}.`, `Write down five key concepts and explain each in your own words.`],
    [`Guided practice`, `Work through beginner examples and get feedback from a peer when possible.`, `Complete one small beginner exercise in ${skillName}.`],
    [`Core techniques`, `Practice the most common techniques and workflows for ${skillName}.`, `Recreate a small example without following a step-by-step guide.`],
    [`Apply your knowledge`, `Use ${skillName} to solve a practical problem.`, `Build a small project that demonstrates one core use case.`],
    [`Review and share`, `Reflect on what you learned and explain it to another learner.`, `Present your project and note one next step for continued learning.`]
  ];

  return template.map(([title, description, practiceTask]) => ({ title, description, practiceTask }));
}

async function findPeerTeacher(userId, skillName) {
  const skill = await db.getAsync(
    `SELECT u.id, u.name, p.avatar FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     JOIN users u ON u.id = us.user_id
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE us.type = 'teach' AND us.user_id != ? AND u.status = 'active'
       AND s.name = ? COLLATE NOCASE
     ORDER BY u.name LIMIT 1`,
    [userId, skillName]
  );
  return skill || null;
}

async function getMetricTotal(userId, metric) {
  const count = async (sql, params = [userId]) => {
    const row = await db.getAsync(sql, params);
    return row?.total || 0;
  };

  switch (metric) {
    case 'exchanges':
      return count(
        `SELECT COUNT(*) AS total FROM skill_exchanges
         WHERE status = 'completed' AND (proposer_id = ? OR receiver_id = ? )`,
        [userId, userId]
      );
    case 'sessions':
      return count(
        `SELECT COUNT(*) AS total FROM sessions s
         JOIN skill_exchanges e ON e.id = s.exchange_id
         WHERE s.status = 'completed' AND (e.proposer_id = ? OR e.receiver_id = ?)`,
        [userId, userId]
      );
    case 'students_taught':
      return count(
        `SELECT COUNT(DISTINCT CASE WHEN e.proposer_id = ? THEN e.receiver_id ELSE e.proposer_id END) AS total
         FROM skill_exchanges e
         WHERE e.status = 'completed' AND (e.proposer_id = ? OR e.receiver_id = ?)`,
        [userId, userId, userId]
      );
    case 'roadmap_steps':
      return count(
        `SELECT COUNT(*) AS total FROM roadmap_steps rs
         JOIN learning_roadmaps lr ON lr.id = rs.roadmap_id
         WHERE lr.user_id = ? AND rs.status = 'completed'`
      );
    case 'positive_reviews':
      return count(
        `SELECT COUNT(*) AS total FROM reviews WHERE reviewed_user_id = ? AND rating >= 4`
      );
    default:
      return 0;
  }
}

async function getGoalProgress(userId, goal) {
  const total = await getMetricTotal(userId, goal.metric);
  return Math.min(Math.max(total - (goal.baseline || 0), 0), goal.target);
}

router.use(authenticateToken);

router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.id;
    const timezoneOffset = req.query.timezoneOffset === undefined
      ? 0
      : Number(req.query.timezoneOffset);
    if (!Number.isInteger(timezoneOffset) || timezoneOffset < -840 || timezoneOffset > 840) {
      return res.status(400).json({ error: 'Timezone offset must be a whole number of minutes between -840 and 840.' });
    }
    const timezoneModifier = `${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset} minutes`;
    const activities = await db.allAsync(
      `SELECT activity_type, source_type, source_id, xp, details, occurred_at
       FROM learning_activities WHERE user_id = ? ORDER BY occurred_at DESC LIMIT 30`,
      [userId]
    );
    const xpRow = await db.getAsync(
      'SELECT COALESCE(SUM(xp), 0) AS total FROM learning_activities WHERE user_id = ?',
      [userId]
    );
    const activityDates = await db.allAsync(
      `SELECT DISTINCT date(occurred_at, ?) AS activity_date FROM learning_activities
       WHERE user_id = ? ORDER BY activity_date DESC`,
      [timezoneModifier, userId]
    );
    const dates = activityDates.map((row) => row.activity_date);
    const today = new Date(Date.now() + timezoneOffset * 60000).toISOString().slice(0, 10);
    const yesterdayDate = new Date(`${today}T00:00:00.000Z`);
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);

    let currentStreak = 0;
    let longestStreak = 0;
    let running = 0;
    let previousDate = null;
    for (const date of [...dates].reverse()) {
      const currentDate = new Date(`${date}T00:00:00.000Z`);
      if (previousDate) {
        const gap = (currentDate - previousDate) / 86400000;
        running = gap === 1 ? running + 1 : 1;
      } else {
        running = 1;
      }
      longestStreak = Math.max(longestStreak, running);
      previousDate = currentDate;
    }
    if (dates[0] === today || dates[0] === yesterday) {
      currentStreak = 1;
      for (let index = 1; index < dates.length; index += 1) {
        const newer = new Date(`${dates[index - 1]}T00:00:00.000Z`);
        const older = new Date(`${dates[index]}T00:00:00.000Z`);
        if ((newer - older) / 86400000 !== 1) break;
        currentStreak += 1;
      }
    }

    const weekDates = [];
    const now = new Date(`${today}T00:00:00.000Z`);
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setUTCDate(date.getUTCDate() - offset);
      const dateKey = date.toISOString().slice(0, 10);
      weekDates.push({ date: dateKey, active: dates.includes(dateKey) });
    }

    const totalXp = xpRow.total;
    const completedExchanges = await db.getAsync(
      `SELECT COUNT(*) AS total FROM skill_exchanges
       WHERE status = 'completed' AND (proposer_id = ? OR receiver_id = ?)`,
      [userId, userId]
    );
    const activeExchanges = await db.getAsync(
      `SELECT COUNT(*) AS total FROM skill_exchanges
       WHERE status IN ('proposed', 'accepted') AND (proposer_id = ? OR receiver_id = ?)`,
      [userId, userId]
    );
    const upcomingSessions = await db.getAsync(
      `SELECT COUNT(*) AS total FROM sessions s
       JOIN skill_exchanges e ON e.id = s.exchange_id
       WHERE s.status = 'scheduled' AND datetime(s.scheduled_at) >= datetime('now')
         AND (e.proposer_id = ? OR e.receiver_id = ?)`,
      [userId, userId]
    );
    const nextSession = await db.getAsync(
      `SELECT s.id, s.scheduled_at, os.name AS offered_skill, rs.name AS requested_skill,
              CASE WHEN e.proposer_id = ? THEN receiver.name ELSE proposer.name END AS partner_name
       FROM sessions s
       JOIN skill_exchanges e ON e.id = s.exchange_id
       JOIN users proposer ON proposer.id = e.proposer_id
       JOIN users receiver ON receiver.id = e.receiver_id
       JOIN skills os ON os.id = e.offered_skill_id
       JOIN skills rs ON rs.id = e.requested_skill_id
       WHERE s.status = 'scheduled' AND datetime(s.scheduled_at) >= datetime('now')
         AND (e.proposer_id = ? OR e.receiver_id = ?)
       ORDER BY datetime(s.scheduled_at) LIMIT 1`,
      [userId, userId, userId]
    );
    const completedSteps = await db.getAsync(
      `SELECT COUNT(*) AS total FROM roadmap_steps rs
       JOIN learning_roadmaps lr ON lr.id = rs.roadmap_id
       WHERE lr.user_id = ? AND rs.status = 'completed'`,
      [userId]
    );
    const positiveReviews = await db.getAsync(
      'SELECT COUNT(*) AS total FROM learning_activities WHERE user_id = ? AND activity_type = ?',
      [userId, 'positive_review']
    );
    const achievements = [];
    if (completedExchanges.total >= 1) achievements.push({ id: 'first-swap', name: 'First Swap', description: 'Complete your first skill exchange.' });
    if (completedExchanges.total >= 3) achievements.push({ id: 'skill-mentor', name: 'Skill Mentor', description: 'Complete three skill exchanges.' });
    if (completedExchanges.total >= 10) achievements.push({ id: 'community-builder', name: 'Community Builder', description: 'Complete ten skill exchanges.' });
    if (completedSteps.total >= 10) achievements.push({ id: 'fast-learner', name: 'Fast Learner', description: 'Complete ten roadmap steps.' });
    if (currentStreak >= 7) achievements.push({ id: 'seven-day-streak', name: '7 Day Streak', description: 'Learn on seven consecutive days.' });
    if (positiveReviews.total >= 5) {
      achievements.push({ id: 'knowledge-sharer', name: 'Knowledge Sharer', description: 'Receive five positive peer reviews.' });
    }
    achievements.push(...getLevelBadges(totalXp).map((badge) => ({
      id: `level-${badge.level}`,
      name: badge.name,
      description: badge.description,
      type: 'level'
    })));

    res.json({
      xp: totalXp,
      level: Math.floor(totalXp / 1000) + 1,
      xpIntoLevel: totalXp % 1000,
      xpForNextLevel: 1000,
      metrics: {
        activeExchanges: activeExchanges.total,
        completedExchanges: completedExchanges.total,
        upcomingSessions: upcomingSessions.total,
        nextSession
      },
      currentStreak,
      longestStreak,
      weeklyActivity: weekDates,
      levelBadges: getLevelBadges(totalXp),
      achievements,
      activities
    });
  } catch (err) {
    console.error('Error retrieving learning summary:', err);
    res.status(500).json({ error: 'Failed to retrieve learning summary.' });
  }
});

router.get('/goals', async (req, res) => {
  try {
    const goals = await db.allAsync(
      'SELECT * FROM learning_goals WHERE user_id = ? ORDER BY completed_at IS NULL DESC, created_at DESC',
      [req.user.id]
    );
    const withProgress = await Promise.all(goals.map(async (goal) => ({
      ...goal,
      progress: await getGoalProgress(req.user.id, goal)
    })));
    res.json({ goals: withProgress });
  } catch (err) {
    console.error('Error retrieving learning goals:', err);
    res.status(500).json({ error: 'Failed to retrieve learning goals.' });
  }
});

router.post('/goals', async (req, res) => {
  try {
    const { title, metric, target, deadline } = req.body;
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    const targetCount = Number(target);
    const allowedMetrics = ['exchanges', 'sessions', 'students_taught', 'roadmap_steps', 'positive_reviews'];
    if (!cleanTitle || cleanTitle.length > 120) {
      return res.status(400).json({ error: 'Goal title must be between 1 and 120 characters.' });
    }
    if (!allowedMetrics.includes(metric)) {
      return res.status(400).json({ error: 'Select a valid goal progress measure.' });
    }
    if (!Number.isInteger(targetCount) || targetCount < 1 || targetCount > 10000) {
      return res.status(400).json({ error: 'Goal target must be a whole number between 1 and 10000.' });
    }
    if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      return res.status(400).json({ error: 'Deadline must use the YYYY-MM-DD format.' });
    }

    const baseline = await getMetricTotal(req.user.id, metric);
    const result = await db.runAsync(
      'INSERT INTO learning_goals (user_id, title, metric, target, baseline, deadline) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, cleanTitle, metric, targetCount, baseline, deadline || null]
    );
    const goal = await db.getAsync('SELECT * FROM learning_goals WHERE id = ?', [result.lastID]);
    res.status(201).json({ goal: { ...goal, progress: await getGoalProgress(req.user.id, goal) } });
  } catch (err) {
    console.error('Error creating learning goal:', err);
    res.status(500).json({ error: 'Failed to create learning goal.' });
  }
});

router.delete('/goals/:id', async (req, res) => {
  try {
    const result = await db.runAsync(
      'DELETE FROM learning_goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!result.changes) return res.status(404).json({ error: 'Learning goal not found.' });
    res.json({ message: 'Learning goal deleted.' });
  } catch (err) {
    console.error('Error deleting learning goal:', err);
    res.status(500).json({ error: 'Failed to delete learning goal.' });
  }
});

router.post('/goals/:id/complete', async (req, res) => {
  try {
    const goal = await db.getAsync(
      'SELECT * FROM learning_goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!goal) return res.status(404).json({ error: 'Learning goal not found.' });
    const progress = await getGoalProgress(req.user.id, goal);
    if (progress < goal.target) {
      return res.status(400).json({ error: 'Keep going—this goal has not reached its target yet.' });
    }
    if (!goal.completed_at) {
      await recordLearningActivity(req.user.id, 'goal_completed', 'goal', goal.id, 50, goal.title);
      await db.runAsync(
        'UPDATE learning_goals SET completed_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
        [goal.id, req.user.id]
      );
    }
    res.json({ message: 'Goal completed! You earned 50 XP.' });
  } catch (err) {
    console.error('Error completing learning goal:', err);
    res.status(500).json({ error: 'Failed to complete learning goal.' });
  }
});

router.get('/roadmaps', async (req, res) => {
  try {
    const roadmaps = await db.allAsync(
      'SELECT * FROM learning_roadmaps WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    for (const roadmap of roadmaps) {
      roadmap.steps = await db.allAsync(
        'SELECT * FROM roadmap_steps WHERE roadmap_id = ? ORDER BY position',
        [roadmap.id]
      );
      roadmap.recommendedPeer = await findPeerTeacher(req.user.id, roadmap.skill_name);
    }
    res.json({ roadmaps });
  } catch (err) {
    console.error('Error retrieving learning roadmaps:', err);
    res.status(500).json({ error: 'Failed to retrieve learning roadmaps.' });
  }
});

router.post('/roadmaps', async (req, res) => {
  try {
    const skillName = typeof req.body.skillName === 'string' ? req.body.skillName.trim() : '';
    if (!skillName || skillName.length > 80) {
      return res.status(400).json({ error: 'Skill name must be between 1 and 80 characters.' });
    }
    const duplicate = await db.getAsync(
      `SELECT id FROM learning_roadmaps WHERE user_id = ? AND skill_name = ? COLLATE NOCASE`,
      [req.user.id, skillName]
    );
    if (duplicate) return res.status(409).json({ error: 'You already have a roadmap for this skill.' });

    const result = await db.runAsync(
      'INSERT INTO learning_roadmaps (user_id, skill_name) VALUES (?, ?)',
      [req.user.id, skillName]
    );
    const steps = createSteps(skillName);
    for (const [index, step] of steps.entries()) {
      await db.runAsync(
        `INSERT INTO roadmap_steps (roadmap_id, position, title, description, practice_task)
         VALUES (?, ?, ?, ?, ?)`,
        [result.lastID, index + 1, step.title, step.description, step.practiceTask]
      );
    }
    const roadmap = await db.getAsync('SELECT * FROM learning_roadmaps WHERE id = ?', [result.lastID]);
    roadmap.steps = await db.allAsync('SELECT * FROM roadmap_steps WHERE roadmap_id = ? ORDER BY position', [result.lastID]);
    roadmap.recommendedPeer = await findPeerTeacher(req.user.id, skillName);
    res.status(201).json({ roadmap, method: 'deterministic-template' });
  } catch (err) {
    console.error('Error creating learning roadmap:', err);
    res.status(500).json({ error: 'Failed to create learning roadmap.' });
  }
});

router.put('/roadmaps/:roadmapId/steps/:stepId', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Step status must be pending or completed.' });
    }
    const step = await db.getAsync(
      `SELECT rs.* FROM roadmap_steps rs
       JOIN learning_roadmaps lr ON lr.id = rs.roadmap_id
       WHERE rs.id = ? AND lr.id = ? AND lr.user_id = ?`,
      [req.params.stepId, req.params.roadmapId, req.user.id]
    );
    if (!step) return res.status(404).json({ error: 'Roadmap step not found.' });
    if (step.status !== status) {
      await db.runAsync(
        'UPDATE roadmap_steps SET status = ?, completed_at = ? WHERE id = ?',
        [status, status === 'completed' ? new Date().toISOString() : null, step.id]
      );
    }
    if (status === 'completed') {
      await recordLearningActivity(req.user.id, 'roadmap_step_completed', 'roadmap_step', step.id, 10, step.title);
    }
    const updated = await db.getAsync('SELECT * FROM roadmap_steps WHERE id = ?', [step.id]);
    res.json({ step: updated });
  } catch (err) {
    console.error('Error updating roadmap step:', err);
    res.status(500).json({ error: 'Failed to update roadmap step.' });
  }
});

router.delete('/roadmaps/:id', async (req, res) => {
  try {
    const result = await db.runAsync(
      'DELETE FROM learning_roadmaps WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!result.changes) return res.status(404).json({ error: 'Learning roadmap not found.' });
    res.json({ message: 'Learning roadmap deleted.' });
  } catch (err) {
    console.error('Error deleting learning roadmap:', err);
    res.status(500).json({ error: 'Failed to delete learning roadmap.' });
  }
});

module.exports = router;
