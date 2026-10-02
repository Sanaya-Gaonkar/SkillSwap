import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Check, Circle, Flame, Goal, Plus, Sparkles, Trash2, Trophy, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const METRICS = [
  { value: 'exchanges', label: 'Skill exchanges completed' },
  { value: 'sessions', label: 'Learning sessions completed' },
  { value: 'students_taught', label: 'Different peers taught' },
  { value: 'roadmap_steps', label: 'Roadmap steps completed' },
  { value: 'positive_reviews', label: 'Positive reviews received' }
];

const ACTIVITY_LABELS = {
  exchange_completed: 'Completed a skill exchange',
  session_completed: 'Completed a learning session',
  skill_taught: 'Shared knowledge with a peer',
  skill_learned: 'Learned a new skill',
  positive_review: 'Received a positive review',
  roadmap_step_completed: 'Completed a roadmap step',
  goal_completed: 'Completed a learning goal',
  streak_bonus: 'Reached a learning streak milestone'
};

export default function LearningHub() {
  const { showToast } = useAuth();
  const [summary, setSummary] = useState(null);
  const [goals, setGoals] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: '', metric: 'exchanges', target: '5', deadline: '' });
  const [skillName, setSkillName] = useState('');

  const loadLearningData = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryData, goalsData, roadmapsData] = await Promise.all([
        api.getLearningSummary(),
        api.getLearningGoals(),
        api.getLearningRoadmaps()
      ]);
      setSummary(summaryData);
      setGoals(goalsData.goals || []);
      setRoadmaps(roadmapsData.roadmaps || []);
    } catch (err) {
      showToast(err.message || 'Could not load your learning progress.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLearningData();
  }, [loadLearningData]);

  const handleCreateGoal = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await api.createLearningGoal({
        ...goalForm,
        target: Number(goalForm.target),
        deadline: goalForm.deadline || null
      });
      setGoalForm({ title: '', metric: 'exchanges', target: '5', deadline: '' });
      showToast('Learning goal created.', 'success');
      await loadLearningData();
    } catch (err) {
      showToast(err.message || 'Could not create the goal.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRoadmap = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const result = await api.createLearningRoadmap(skillName);
      setSkillName('');
      showToast(
        result.method === 'deterministic-template'
          ? 'A starter roadmap was created from a structured learning template.'
          : 'Roadmap created.',
        'success'
      );
      await loadLearningData();
    } catch (err) {
      showToast(err.message || 'Could not create a roadmap.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStepToggle = async (roadmap, step) => {
    const status = step.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateRoadmapStep(roadmap.id, step.id, status);
      if (status === 'completed') showToast('Step completed. You earned 10 XP!', 'success');
      await loadLearningData();
    } catch (err) {
      showToast(err.message || 'Could not update the roadmap step.', 'error');
    }
  };

  const handleDelete = async (kind, id) => {
    try {
      if (kind === 'goal') await api.deleteLearningGoal(id);
      else await api.deleteLearningRoadmap(id);
      showToast(`${kind === 'goal' ? 'Goal' : 'Roadmap'} deleted.`, 'success');
      await loadLearningData();
    } catch (err) {
      showToast(err.message || 'Could not delete this item.', 'error');
    }
  };

  const handleCompleteGoal = async (goal) => {
    try {
      await api.completeLearningGoal(goal.id);
      showToast('Goal completed! You earned 50 XP.', 'success');
      await loadLearningData();
    } catch (err) {
      showToast(err.message || 'Could not complete this goal.', 'error');
    }
  };

  if (loading && !summary) {
    return <div className="page-wrapper container learning-hub"><div className="card" role="status">Loading your learning progress...</div></div>;
  }

  return (
    <div className="page-wrapper container learning-hub">
      <header className="learning-header">
        <div>
          <p className="learning-eyebrow"><Sparkles size={15} /> Your learning journey</p>
          <h1>Learning Hub</h1>
          <p className="learning-intro">Set real goals, make progress one step at a time, and celebrate the work you do with your peers.</p>
        </div>
        <div className="learning-xp-card card">
          <div className="learning-xp-icon"><Zap size={20} /></div>
          <div>
            <strong>Level {summary?.level || 1}</strong>
            <span>{summary?.xp || 0} total XP</span>
          </div>
        </div>
      </header>

      <section className="learning-overview" aria-label="Learning statistics">
        <article className="learning-stat card">
          <Flame size={22} aria-hidden="true" />
          <div><strong>{summary?.currentStreak || 0} days</strong><span>Current streak</span></div>
        </article>
        <article className="learning-stat card">
          <Trophy size={22} aria-hidden="true" />
          <div><strong>{summary?.longestStreak || 0} days</strong><span>Longest streak</span></div>
        </article>
        <article className="learning-stat card">
          <Goal size={22} aria-hidden="true" />
          <div><strong>{goals.filter((goal) => !goal.completed_at).length}</strong><span>Active goals</span></div>
        </article>
        <article className="learning-stat card">
          <BookOpen size={22} aria-hidden="true" />
          <div><strong>{roadmaps.length}</strong><span>Learning roadmaps</span></div>
        </article>
      </section>

      <section className="card learning-section" aria-labelledby="weekly-activity-title">
        <div className="learning-section-heading">
          <div><h2 id="weekly-activity-title">Weekly activity</h2><p>Activity is recorded when you complete learning actions in SkillSwap.</p></div>
          <strong className="learning-level-label">Level {summary?.level || 1}</strong>
        </div>
        <div className="learning-xp-track" role="progressbar" aria-label="Progress to next level" aria-valuemin="0" aria-valuemax={summary?.xpForNextLevel || 1000} aria-valuenow={summary?.xpIntoLevel || 0}>
          <span style={{ width: `${Math.min(100, ((summary?.xpIntoLevel || 0) / (summary?.xpForNextLevel || 1000)) * 100)}%` }} />
        </div>
        <p className="learning-xp-caption">{summary?.xpIntoLevel || 0} / {summary?.xpForNextLevel || 1000} XP toward your next level</p>
        <div className="learning-week" aria-label="Last seven days">
          {(summary?.weeklyActivity || []).map((day) => (
            <div className={`learning-day ${day.active ? 'is-active' : ''}`} key={day.date} title={`${day.date}${day.active ? ': learning activity recorded' : ': no activity yet'}`}>
              <span>{new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</span>
              <i aria-hidden="true" />
            </div>
          ))}
        </div>
      </section>

      <div className="learning-columns">
        <section className="card learning-section" aria-labelledby="goals-title">
          <div className="learning-section-heading"><div><h2 id="goals-title">Personal goals</h2><p>Progress is calculated from your completed activity.</p></div></div>
          <form className="learning-form" onSubmit={handleCreateGoal}>
            <label>Goal name<input className="form-input" maxLength="120" required value={goalForm.title} onChange={(event) => setGoalForm({ ...goalForm, title: event.target.value })} placeholder="Complete 5 skill exchanges" /></label>
            <div className="learning-form-row">
              <label>Measure<select className="form-select" value={goalForm.metric} onChange={(event) => setGoalForm({ ...goalForm, metric: event.target.value })}>{METRICS.map((metric) => <option key={metric.value} value={metric.value}>{metric.label}</option>)}</select></label>
              <label>Target<input className="form-input" type="number" min="1" max="10000" required value={goalForm.target} onChange={(event) => setGoalForm({ ...goalForm, target: event.target.value })} /></label>
            </div>
            <div className="learning-form-row learning-submit-row">
              <label>Deadline (optional)<input className="form-input" type="date" value={goalForm.deadline} onChange={(event) => setGoalForm({ ...goalForm, deadline: event.target.value })} /></label>
              <button className="btn btn-primary" disabled={saving}><Plus size={16} /> Create goal</button>
            </div>
          </form>
          <div className="learning-list">
            {goals.length ? goals.map((goal) => {
              const percent = Math.min(100, Math.round((goal.progress / goal.target) * 100));
              const completed = Boolean(goal.completed_at);
              return (
                <article className="learning-goal" key={goal.id}>
                  <div className="learning-item-title"><strong>{goal.title}</strong><button className="learning-icon-button" type="button" aria-label={`Delete goal ${goal.title}`} onClick={() => handleDelete('goal', goal.id)}><Trash2 size={16} /></button></div>
                  <div className="learning-goal-meta"><span>{goal.progress} / {goal.target}</span>{goal.deadline && <span>Due {new Date(`${goal.deadline}T00:00:00`).toLocaleDateString()}</span>}</div>
                  <div className="learning-xp-track" role="progressbar" aria-label={`Progress for ${goal.title}`} aria-valuemin="0" aria-valuemax={goal.target} aria-valuenow={goal.progress}><span style={{ width: `${percent}%` }} /></div>
                  <div className="learning-goal-footer"><span>{completed ? 'Completed' : `${percent}% complete`}</span>{!completed && goal.progress >= goal.target && <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleCompleteGoal(goal)}>Claim 50 XP</button>}</div>
                </article>
              );
            }) : <p className="learning-empty">Create a goal to make your next learning milestone visible.</p>}
          </div>
        </section>

        <section className="card learning-section" aria-labelledby="roadmaps-title">
          <div className="learning-section-heading"><div><h2 id="roadmaps-title">Learning roadmaps</h2><p>Structured starter paths, with practice tasks for every step.</p></div></div>
          <form className="learning-roadmap-form" onSubmit={handleCreateRoadmap}>
            <label className="sr-only" htmlFor="roadmap-skill">Skill to learn</label>
            <input id="roadmap-skill" className="form-input" maxLength="80" required value={skillName} onChange={(event) => setSkillName(event.target.value)} placeholder="What skill do you want to learn?" />
            <button className="btn btn-primary" disabled={saving}><Plus size={16} /> Create</button>
          </form>
          <p className="learning-note">Starter paths use transparent templates and are not generated by an AI service.</p>
          <div className="learning-list">
            {roadmaps.length ? roadmaps.map((roadmap) => {
              const done = roadmap.steps.filter((step) => step.status === 'completed').length;
              return (
                <article className="learning-roadmap" key={roadmap.id}>
                  <div className="learning-item-title"><div><h3>{roadmap.skill_name}</h3><span>{done} of {roadmap.steps.length} steps complete</span></div><button className="learning-icon-button" type="button" aria-label={`Delete ${roadmap.skill_name} roadmap`} onClick={() => handleDelete('roadmap', roadmap.id)}><Trash2 size={16} /></button></div>
                  {roadmap.recommendedPeer && <p className="learning-peer">Peer who teaches this skill: <Link to={`/profile/${roadmap.recommendedPeer.id}`}>{roadmap.recommendedPeer.name}</Link></p>}
                  <ol className="learning-steps">
                    {roadmap.steps.map((step) => (
                      <li key={step.id} className={step.status === 'completed' ? 'is-completed' : ''}>
                        <button className="learning-step-toggle" type="button" aria-label={`${step.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}: ${step.title}`} onClick={() => handleStepToggle(roadmap, step)}>
                          {step.status === 'completed' ? <Check size={16} /> : <Circle size={16} />}
                        </button>
                        <div><strong>{step.title}</strong><p>{step.description}</p><small><b>Practice:</b> {step.practice_task}</small></div>
                      </li>
                    ))}
                  </ol>
                </article>
              );
            }) : <p className="learning-empty">Choose a skill to create your first roadmap.</p>}
          </div>
        </section>
      </div>

      <div className="learning-columns learning-lower">
        <section className="card learning-section" aria-labelledby="achievements-title">
          <div className="learning-section-heading"><div><h2 id="achievements-title">Achievements</h2><p>Earned through completed learning activity.</p></div></div>
          <div className="learning-achievements">
            {summary?.achievements?.length ? summary.achievements.map((achievement) => (
              <article className="learning-achievement" key={achievement.id}><Trophy size={18} /><div><strong>{achievement.name}</strong><span>{achievement.description}</span></div></article>
            )) : <p className="learning-empty">Your first achievement is waiting—complete an exchange or roadmap step to get started.</p>}
          </div>
        </section>
        <section className="card learning-section" aria-labelledby="activity-title">
          <div className="learning-section-heading"><div><h2 id="activity-title">Your activity</h2><p>Only your own learning activity is shown here.</p></div></div>
          <div className="learning-activity-list">
            {summary?.activities?.length ? summary.activities.slice(0, 8).map((activity) => (
              <article key={`${activity.activity_type}-${activity.source_type}-${activity.source_id}`}><span>{ACTIVITY_LABELS[activity.activity_type] || 'Learning activity'}{activity.details ? ` · ${activity.details}` : ''}</span><strong>+{activity.xp} XP</strong></article>
            )) : <p className="learning-empty">Completed sessions, exchanges, and roadmap steps will appear here.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
