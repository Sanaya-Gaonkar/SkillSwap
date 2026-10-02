const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/matches - Calculate and return rule-based skill matches for current logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get current user's profile and skills
    const currentUser = await db.getAsync(
      `SELECT u.id, u.name, p.course, p.year, p.availability, p.learning_mode, p.interests
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = ?`,
      [currentUserId]
    );

    const mySkills = await db.allAsync(
      `SELECT us.type, s.id as skill_id, s.name, s.category
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ?`,
      [currentUserId]
    );

    const myTeachSkillIds = new Set(mySkills.filter((s) => s.type === 'teach').map((s) => s.skill_id));
    const myLearnSkillIds = new Set(mySkills.filter((s) => s.type === 'learn').map((s) => s.skill_id));

    // Get all other active students
    const otherUsers = await db.allAsync(
      `SELECT u.id, u.name,
              p.avatar, p.course, p.year, p.bio, p.availability, p.learning_mode, p.interests,
              ROUND(AVG(r.rating), 1) as avg_rating,
              COUNT(DISTINCT r.id) as review_count
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN reviews r ON r.reviewed_user_id = u.id
       WHERE u.id != ? AND u.status = 'active' AND u.role = 'Student'
       GROUP BY u.id`,
      [currentUserId]
    );

    const userIds = [currentUserId, ...otherUsers.map((user) => user.id)];
    const goalRows = userIds.length > 1
      ? await db.allAsync(
        `SELECT user_id, title FROM learning_goals
         WHERE completed_at IS NULL AND user_id IN (${userIds.map(() => '?').join(', ')})`,
        userIds
      )
      : [];
    const goalsByUser = new Map();
    for (const goal of goalRows) {
      if (!goalsByUser.has(goal.user_id)) goalsByUser.set(goal.user_id, []);
      goalsByUser.get(goal.user_id).push(goal.title);
    }
    const previousExchanges = await db.allAsync(
      `SELECT CASE WHEN proposer_id = ? THEN receiver_id ELSE proposer_id END AS partner_id
       FROM skill_exchanges
       WHERE status = 'completed' AND (proposer_id = ? OR receiver_id = ?)`,
      [currentUserId, currentUserId, currentUserId]
    );
    const previousPartnerIds = new Set(previousExchanges.map((exchange) => exchange.partner_id));

    const calculatedMatches = [];

    for (const other of otherUsers) {
      // Get other user's skills
      const otherSkills = await db.allAsync(
        `SELECT us.type, s.id as skill_id, s.name, s.category
         FROM user_skills us
         JOIN skills s ON s.id = us.skill_id
         WHERE us.user_id = ?`,
        [other.id]
      );

      const otherTeachSkills = otherSkills.filter((s) => s.type === 'teach');
      const otherLearnSkills = otherSkills.filter((s) => s.type === 'learn');

      // 1. What current user wants that other can teach:
      const iCanLearnFromThem = otherTeachSkills.filter((s) => myLearnSkillIds.has(s.skill_id));

      // 2. What other user wants that current user can teach:
      const theyCanLearnFromMe = otherLearnSkills.filter((s) => myTeachSkillIds.has(s.skill_id));

      const iLearnCount = iCanLearnFromThem.length;
      const theyLearnCount = theyCanLearnFromMe.length;

      if (iLearnCount === 0 && theyLearnCount === 0) continue;

      const availabilityTokens = (value) => (value || '').toLowerCase().match(/\b(weekday|weekend|morning|afternoon|evening)\b/g) || [];
      const myAvailability = new Set(availabilityTokens(currentUser.availability));
      const theirAvailability = availabilityTokens(other.availability);
      const availabilityCompatible = theirAvailability.some((token) => myAvailability.has(token));
      const modeCompatible = Boolean(
        currentUser.learning_mode &&
        other.learning_mode &&
        currentUser.learning_mode.toLowerCase().includes('online') &&
        other.learning_mode.toLowerCase().includes('online')
      );
      const interestTokens = (value) => (value || '')
        .toLowerCase()
        .split(/[,;|]/)
        .map((interest) => interest.trim())
        .filter(Boolean);
      const theirInterests = new Set(interestTokens(other.interests));
      const sharedInterests = interestTokens(currentUser.interests).filter((interest) => theirInterests.has(interest));
      const matchSkillNames = [...iCanLearnFromThem, ...theyCanLearnFromMe].map((skill) => skill.name.toLowerCase());
      const goalTitles = [
        ...(goalsByUser.get(currentUserId) || []),
        ...(goalsByUser.get(other.id) || [])
      ];
      const relatedGoalSkill = matchSkillNames.find((skillName) => {
        if (skillName.length <= 2) return false;
        return goalTitles.some((title) => title.toLowerCase().includes(skillName));
      });
      const sharedCourse = Boolean(currentUser.course && other.course &&
        currentUser.course.trim().toLowerCase() === other.course.trim().toLowerCase());
      const sharedYear = Boolean(currentUser.year && other.year &&
        currentUser.year.trim().toLowerCase() === other.year.trim().toLowerCase());
      const mySkillIds = new Set(mySkills.map((skill) => skill.skill_id));
      const commonSkills = otherSkills
        .filter((skill) => mySkillIds.has(skill.skill_id))
        .map((skill) => ({ id: skill.skill_id, name: skill.name, category: skill.category }));

      const isTwoWay = iLearnCount > 0 && theyLearnCount > 0;
      let matchScore = isTwoWay
        ? 68 + Math.min(4, iLearnCount + theyLearnCount - 2) * 7
        : 48 + (Math.max(iLearnCount, theyLearnCount) - 1) * 6;
      const matchReasons = [];
      if (iLearnCount > 0) {
        matchReasons.push(`You can learn ${iCanLearnFromThem.map((skill) => skill.name).join(', ')} from ${other.name}.`);
      }
      if (theyLearnCount > 0) {
        matchReasons.push(`You can teach ${theyCanLearnFromMe.map((skill) => skill.name).join(', ')} to ${other.name}.`);
      }
      if (availabilityCompatible) {
        matchScore += 10;
        matchReasons.push('Your availability includes compatible times.');
      }
      if (modeCompatible) {
        matchScore += 5;
        matchReasons.push('You both prefer online learning.');
      }
      if (sharedInterests.length > 0) {
        matchScore += 3;
        matchReasons.push(`You share interests in ${sharedInterests.slice(0, 3).join(', ')}.`);
      }
      if (relatedGoalSkill) {
        matchScore += 3;
        matchReasons.push(`A current learning goal mentions ${relatedGoalSkill}.`);
      }
      if (sharedCourse) {
        matchScore += 2;
        matchReasons.push(`You both study ${other.course}.`);
      }
      if (sharedYear) {
        matchScore += 1;
        matchReasons.push(`You are both in ${other.year}.`);
      }
      if (previousPartnerIds.has(other.id)) {
        matchScore += 2;
        matchReasons.push('You have completed an exchange together before.');
      }
      matchScore = Math.min(99, matchScore);
      const matchTag = isTwoWay ? 'Two-Way Skill Match' : 'Skill Match';

      // Check connection status
      const connection = await db.getAsync(
        `SELECT id, sender_id, receiver_id, status FROM connections
         WHERE (sender_id = ? AND receiver_id = ?)
            OR (sender_id = ? AND receiver_id = ?)`,
        [currentUserId, other.id, other.id, currentUserId]
      );

      // Save or update match in database
      await db.runAsync(
        `INSERT INTO skill_matches (user_id, matched_user_id, match_percentage, details, calculated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, matched_user_id) DO UPDATE SET
           match_percentage = excluded.match_percentage,
           details = excluded.details,
           calculated_at = CURRENT_TIMESTAMP`,
        [
          currentUserId,
          other.id,
          matchScore,
          JSON.stringify({
            iCanLearnFromThem: iCanLearnFromThem.map((s) => s.name),
            theyCanLearnFromMe: theyCanLearnFromMe.map((s) => s.name),
            commonSkills: commonSkills.map((s) => s.name),
            sharedInterests
          })
        ]
      );

      calculatedMatches.push({
        user: other,
        teachSkills: otherTeachSkills,
        learnSkills: otherLearnSkills,
        iCanLearnFromThem,
        theyCanLearnFromMe,
        matchPercentage: matchScore,
        matchTag,
        isTwoWay,
        commonSkills,
        availabilityCompatible,
        sharedInterests,
        matchReasons,
        explanation: matchReasons.join(' '),
        connection: connection || null
      });
    }

    // Sort by match percentage descending
    calculatedMatches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json({ matches: calculatedMatches });
  } catch (err) {
    console.error('Error calculating matches:', err);
    res.status(500).json({ error: 'Failed to calculate matches.' });
  }
});

module.exports = router;
