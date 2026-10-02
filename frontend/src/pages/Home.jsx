import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import SkillChip from '../components/SkillChip';
import MatchCard from '../components/MatchCard';
import ExchangeModal from '../components/ExchangeModal';
import {
  Search,
  Sparkles,
  Compass,
  Users,
  MessageSquare,
  Calendar,
  History,
  ArrowRight,
  BookOpen
} from 'lucide-react';

export default function Home() {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [mySkills, setMySkills] = useState({ teachSkills: [], learnSkills: [] });
  const [matches, setMatches] = useState([]);
  const [learningSummary, setLearningSummary] = useState(null);
  const [learningGoals, setLearningGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Exchange modal state
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [selectedMatchUser, setSelectedMatchUser] = useState(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        const [skillsData, matchesData] = await Promise.all([
          api.getUserSkills(user.id),
          api.getMatches()
        ]);
        setMySkills(skillsData);
        setMatches(matchesData.matches || []);
        try {
          const [summaryData, goalsData] = await Promise.all([
            api.getLearningSummary(),
            api.getLearningGoals()
          ]);
          setLearningSummary(summaryData);
          setLearningGoals(goalsData.goals || []);
        } catch (err) {
          console.error('Error loading learning progress:', err);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/discover?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/discover');
    }
  };

  const handleConnect = async (targetUserId) => {
    try {
      await api.sendConnectionRequest(targetUserId);
      showToast('Connection request sent!', 'success');
      loadDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openExchangeModal = (matchUser) => {
    setSelectedMatchUser(matchUser);
    setExchangeModalOpen(true);
  };

  return (
    <div className="page-wrapper container" style={{ paddingTop: '1.75rem' }}>
      {/* Welcome Banner (Section 18 & 40) */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #E0F2FE 100%)',
          border: '1px solid #BFDBFE',
          padding: '2rem',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '28px', color: 'var(--dark)' }}>
              Hello, {user?.name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--muted)', marginTop: '0.25rem' }}>
              Find someone to learn from and teach.
            </p>
          </div>

          <Link to="/skills" className="btn btn-outline btn-sm" style={{ backgroundColor: 'var(--white)' }}>
            <Sparkles size={14} color="var(--primary)" /> Manage My Skills
          </Link>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ marginTop: '1.5rem', maxWidth: '650px' }}>
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-input"
              style={{
                backgroundColor: 'var(--white)',
                padding: '0.85rem 1rem 0.85rem 2.85rem',
                fontSize: '15px',
                borderRadius: 'var(--radius-lg)'
              }}
              placeholder="Search skills or students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                position: 'absolute',
                right: '6px',
                padding: '0.5rem 1.15rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              Search
            </button>
          </div>
        </form>

        {/* Your Skills (Section 40) */}
        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dark)' }}>
            Your Skills:
          </span>
          {mySkills.teachSkills.length > 0 || mySkills.learnSkills.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {mySkills.teachSkills.map((s) => (
                <SkillChip key={`teach-${s.skill_id}`} name={s.name} type="teach" size="sm" />
              ))}
              {mySkills.learnSkills.map((s) => (
                <SkillChip key={`learn-${s.skill_id}`} name={s.name} type="learn" size="sm" />
              ))}
            </div>
          ) : (
            <Link to="/skills" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 500 }}>
              + Add your skills to unlock recommendations!
            </Link>
          )}
        </div>
      </div>

      <section className="home-learning-summary card" aria-label="Learning progress">
        <div>
          <span className="home-learning-label"><Sparkles size={14} /> Your progress</span>
          <strong>Level {learningSummary?.level || 1} <span>· {learningSummary?.xp || 0} XP</span></strong>
          <div className="learning-xp-track" role="progressbar" aria-label="Progress to next level" aria-valuemin="0" aria-valuemax="1000" aria-valuenow={learningSummary?.xpIntoLevel || 0}>
            <span style={{ width: `${Math.min(100, ((learningSummary?.xpIntoLevel || 0) / 1000) * 100)}%` }} />
          </div>
        </div>
        <div className="home-learning-streak">
          <span aria-hidden="true">🔥</span>
          <div><strong>{learningSummary?.currentStreak || 0} day streak</strong><span>{learningGoals.filter((goal) => !goal.completed_at).length} active goals</span></div>
        </div>
        <Link to="/learning" className="btn btn-outline btn-sm">Open Learning Hub <ArrowRight size={14} /></Link>
      </section>

      <section className="home-dashboard-metrics" aria-label="Your SkillSwap dashboard">
        <article className="card"><span>Teaching</span><strong>{mySkills.teachSkills.length} skills</strong></article>
        <article className="card"><span>Learning</span><strong>{mySkills.learnSkills.length} skills</strong></article>
        <article className="card"><span>Active exchanges</span><strong>{learningSummary?.metrics?.activeExchanges || 0}</strong></article>
        <article className="card"><span>Completed exchanges</span><strong>{learningSummary?.metrics?.completedExchanges || 0}</strong></article>
        <article className="card home-next-session">
          <span>Upcoming session</span>
          {learningSummary?.metrics?.nextSession ? (
            <strong>
              {new Date(learningSummary.metrics.nextSession.scheduled_at).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
              <small> with {learningSummary.metrics.nextSession.partner_name}</small>
            </strong>
          ) : <strong>Nothing scheduled</strong>}
          <Link to="/sessions">View sessions <ArrowRight size={13} /></Link>
        </article>
      </section>

      {/* Quick Navigation Cards Grid (Section 18) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <Link to="/discover" className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem', textDecoration: 'none' }}>
          <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#EFF6FF', color: 'var(--primary)' }}>
            <Compass size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--dark)', fontSize: '14px' }}>Discover</div>
            <div className="text-small">Browse students</div>
          </div>
        </Link>

        <Link to="/skills" className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem', textDecoration: 'none' }}>
          <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#ECFDF5', color: 'var(--secondary)' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--dark)', fontSize: '14px' }}>My Skills</div>
            <div className="text-small">Teach & Learn</div>
          </div>
        </Link>

        <Link to="/connections" className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem', textDecoration: 'none' }}>
          <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#F3E8FF', color: '#7E22CE' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--dark)', fontSize: '14px' }}>Connections</div>
            <div className="text-small">Learning peers</div>
          </div>
        </Link>

        <Link to="/chat" className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem', textDecoration: 'none' }}>
          <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#B45309' }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--dark)', fontSize: '14px' }}>Chat</div>
            <div className="text-small">Direct messages</div>
          </div>
        </Link>

        <Link to="/history" className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem', textDecoration: 'none' }}>
          <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#E0E7FF', color: '#3730A3' }}>
            <History size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--dark)', fontSize: '14px' }}>History</div>
            <div className="text-small">Learned skills</div>
          </div>
        </Link>

        <Link to="/learning" className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem', textDecoration: 'none' }}>
          <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#EAF5F4', color: 'var(--primary)' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--dark)', fontSize: '14px' }}>Learning Hub</div>
            <div className="text-small">Goals, roadmaps & XP</div>
          </div>
        </Link>
      </div>

      {/* Recommended Matches Section (Section 18 & 40) */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2>Recommended Matches</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
              Transparent matches based on teach/learn overlap, availability, learning mode, and shared interests.
            </p>
          </div>
          <Link to="/discover" className="btn btn-outline btn-sm">
            View All Students <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--muted)' }}>Calculating skill matches...</p>
          </div>
        ) : matches.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '1.25rem' }}>
            {matches.map((m) => (
              <MatchCard
                key={m.user.id}
                match={m}
                onConnect={handleConnect}
                onProposeExchange={openExchangeModal}
              />
            ))}
          </div>
        ) : (
          <div className="card empty-state">
            <BookOpen size={40} className="empty-state-icon" />
            <h3>No matches found yet</h3>
            <p style={{ maxWidth: '400px', margin: '0.5rem auto 1.25rem' }}>
              Add skills you can teach and want to learn on your profile to let SkillSwap calculate peer matches.
            </p>
            <Link to="/skills" className="btn btn-primary btn-sm">
              Add Skills Now
            </Link>
          </div>
        )}
      </div>

      {/* Propose Exchange Modal */}
      <ExchangeModal
        isOpen={exchangeModalOpen}
        onClose={() => setExchangeModalOpen(false)}
        targetUser={selectedMatchUser}
        myTeachSkills={mySkills.teachSkills.map((s) => ({ id: s.skill_id, name: s.name, category: s.category }))}
        targetTeachSkills={
          matches.find((m) => m.user.id === selectedMatchUser?.id)?.teachSkills || []
        }
        onSuccess={loadDashboardData}
      />
    </div>
  );
}
