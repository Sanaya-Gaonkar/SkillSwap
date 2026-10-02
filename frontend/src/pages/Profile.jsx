import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SkillChip from '../components/SkillChip';
import ExchangeModal from '../components/ExchangeModal';
import ReportModal from '../components/ReportModal';
import {
  UserCheck,
  UserPlus,
  MessageSquare,
  ArrowLeftRight,
  Edit3,
  Star,
  Clock,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Calendar,
  Layers,
  Award
} from 'lucide-react';

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, showToast } = useAuth();
  const navigate = useNavigate();

  // If no id param is given, show current user profile
  const targetId = id ? parseInt(id, 10) : currentUser?.id;
  const isMe = currentUser && currentUser.id === targetId;

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [myTeachSkills, setMyTeachSkills] = useState([]);

  const loadProfile = async () => {
    if (!targetId) return;
    try {
      setLoading(true);
      const res = await api.getUserById(targetId);
      setProfileUser(res.user);

      if (currentUser?.id) {
        const mySkillsRes = await api.getUserSkills(currentUser.id);
        setMyTeachSkills(mySkillsRes.teachSkills.map((s) => ({ id: s.skill_id, name: s.name, category: s.category })));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [targetId, currentUser]);

  const handleConnect = async () => {
    try {
      await api.sendConnectionRequest(targetId);
      showToast('Connection request sent!', 'success');
      loadProfile();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>Loading profile...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="page-wrapper container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <h2>Profile not found</h2>
        <Link to="/discover" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Discover
        </Link>
      </div>
    );
  }

  const isConnected = profileUser.connection?.status === 'accepted';
  const isPending = profileUser.connection?.status === 'pending';
  const experienceLabel = profileUser.experience_years !== null && profileUser.experience_years !== undefined
    ? `${profileUser.experience_years} ${profileUser.experience_years === 1 ? 'year' : 'years'} experience`
    : null;
  const profileDetails = profileUser.role === 'Teacher'
    ? [profileUser.course, experienceLabel]
    : profileUser.role === 'Corporate Employee'
      ? [profileUser.designation, experienceLabel]
      : [profileUser.course, profileUser.year];
  const organization = profileUser.role === 'Corporate Employee' ? profileUser.company : profileUser.institute;

  return (
    <div className="page-wrapper container" style={{ paddingTop: '1.75rem', maxWidth: '850px' }}>
      {/* Profile Card Header (Section 16 & 43) */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
          {/* Avatar */}
          <img
            src={profileUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${profileUser.name}`}
            alt={profileUser.name}
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: 'var(--light-bg)',
              border: '3px solid var(--primary)',
              boxShadow: 'var(--shadow-md)'
            }}
          />

          <div>
            <h1 style={{ fontSize: '26px', color: 'var(--dark)' }}>{profileUser.name}</h1>
            <p style={{ fontSize: '15px', color: 'var(--muted)', marginTop: '0.25rem' }}>
              {[profileUser.role || 'Member', ...profileDetails, organization].filter(Boolean).join(' • ')}
            </p>
          </div>

          {/* Rating & Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#D97706', fontWeight: 600 }}>
              <Star size={18} fill="#F59E0B" color="#F59E0B" />
              <span>{profileUser.avgRating ? `${profileUser.avgRating} / 5` : 'No reviews yet'}</span>
              {profileUser.reviews && profileUser.reviews.length > 0 && (
                <span className="text-small" style={{ color: 'var(--muted)' }}>
                  ({profileUser.reviews.length} reviews)
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--muted)' }}>
              <Layers size={16} />
              <span>{profileUser.completedExchanges || 0} completed swaps</span>
            </div>
          </div>

          {/* Action Buttons: Own vs Other (Section 43) */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
            {isMe ? (
              <Link to="/profile/edit" className="btn btn-primary">
                <Edit3 size={16} /> Edit Profile
              </Link>
            ) : (
              <>
                {isConnected ? (
                  <button className="btn btn-outline" disabled style={{ color: 'var(--secondary)' }}>
                    <UserCheck size={16} /> Connected
                  </button>
                ) : isPending ? (
                  <button className="btn btn-outline" disabled style={{ color: 'var(--muted)' }}>
                    <Clock size={16} /> Request Pending
                  </button>
                ) : (
                  <button onClick={handleConnect} className="btn btn-primary">
                    <UserPlus size={16} /> Connect
                  </button>
                )}

                <Link
                  to={`/chat/${profileUser.id}`}
                  className="btn btn-outline"
                  title="Direct Message"
                >
                  <MessageSquare size={16} /> Message
                </Link>

                <button
                  onClick={() => setExchangeModalOpen(true)}
                  className="btn btn-secondary"
                  title="Propose a 2-way skill exchange"
                >
                  <ArrowLeftRight size={16} /> Propose Skill Exchange
                </button>

                <button
                  onClick={() => setReportModalOpen(true)}
                  className="btn btn-ghost btn-sm"
                  title="Report user"
                  style={{ color: '#9CA3AF' }}
                >
                  <AlertTriangle size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {profileUser.levelBadges?.length > 0 && (
        <section className="card profile-achievements" aria-labelledby="profile-achievements-title">
          <h2 id="profile-achievements-title">Learning badges</h2>
          <div className="profile-badge-list">
            {profileUser.levelBadges.map((badge) => (
              <article className={`profile-level-badge level-${badge.level}`} key={badge.level}>
                <Award size={20} aria-hidden="true" />
                <div><strong>{badge.name}</strong><span>{badge.description}</span></div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* About Me Section (Section 16 & 43) */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '0.75rem' }}>About Me</h3>
        <p style={{ color: 'var(--dark)', lineHeight: 1.6, fontSize: '14px' }}>
          {profileUser.bio || 'This student has not written a bio yet.'}
        </p>

        {/* Availability & Learning Mode details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block' }}>
              Availability
            </span>
            <span style={{ fontSize: '13px', color: 'var(--dark)', fontWeight: 500 }}>
              {profileUser.availability || 'Flexible'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block' }}>
              Learning Preference
            </span>
            <span style={{ fontSize: '13px', color: 'var(--dark)', fontWeight: 500 }}>
              {profileUser.learning_mode || 'Online screen sharing & discussions'}
            </span>
          </div>
        </div>
      </div>

      {/* Skills Sections (Section 16 & 43) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Skills I Can Teach */}
        <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--teal-chip-text)', marginBottom: '1rem' }}>
            <Sparkles size={18} /> Skills I Can Teach
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {profileUser.teachSkills && profileUser.teachSkills.length > 0 ? (
              profileUser.teachSkills.map((s) => (
                <SkillChip key={s.id} name={s.name} type="teach" proficiency={s.proficiency} />
              ))
            ) : (
              <span className="text-small" style={{ color: 'var(--muted)' }}>No teaching skills listed</span>
            )}
          </div>
        </div>

        {/* Skills I Want To Learn */}
        <div className="card" style={{ borderLeft: '4px solid #DA8465' }}>
          <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--coral-chip-text)', marginBottom: '1rem' }}>
            <BookOpen size={18} /> Skills I Want To Learn
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {profileUser.learnSkills && profileUser.learnSkills.length > 0 ? (
              profileUser.learnSkills.map((s) => (
                <SkillChip key={s.id} name={s.name} type="learn" proficiency={s.proficiency} />
              ))
            ) : (
              <span className="text-small" style={{ color: 'var(--muted)' }}>No learning goals listed</span>
            )}
          </div>
        </div>
      </div>

      {/* Reviews & Ratings Section (Section 27) */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '18px' }}>
            Reviews & Feedback ({profileUser.reviews ? profileUser.reviews.length : 0})
          </h3>
          {profileUser.avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D97706', fontWeight: 600 }}>
              <Star size={16} fill="#F59E0B" color="#F59E0B" />
              <span>{profileUser.avgRating} average</span>
            </div>
          )}
        </div>

        {profileUser.reviews && profileUser.reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {profileUser.reviews.map((rev) => (
              <div
                key={rev.id}
                style={{
                  padding: '1rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img
                      src={rev.reviewer_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${rev.reviewer_name}`}
                      alt={rev.reviewer_name}
                      style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                    />
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{rev.reviewer_name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        fill={i < rev.rating ? '#F59E0B' : '#E5E7EB'}
                        color={i < rev.rating ? '#F59E0B' : '#E5E7EB'}
                      />
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--dark)', lineHeight: 1.5 }}>
                  "{rev.comment}"
                </p>
                <span className="text-small" style={{ color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                  {new Date(rev.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', padding: '1rem' }}>
            No reviews yet. Complete a skill exchange to receive your first peer review!
          </p>
        )}
      </div>

      {/* Propose Exchange Modal */}
      <ExchangeModal
        isOpen={exchangeModalOpen}
        onClose={() => setExchangeModalOpen(false)}
        targetUser={profileUser}
        myTeachSkills={myTeachSkills}
        targetTeachSkills={profileUser.teachSkills || []}
        onSuccess={loadProfile}
      />

      {/* Report User Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetUser={profileUser}
      />
    </div>
  );
}
