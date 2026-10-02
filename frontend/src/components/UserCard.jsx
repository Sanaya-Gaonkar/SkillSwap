import React from 'react';
import { Link } from 'react-router-dom';
import SkillChip from './SkillChip';
import { UserCheck, UserPlus, Clock, Star, MessageSquare } from 'lucide-react';

export default function UserCard({
  user,
  currentUserId,
  onConnect,
  onProposeExchange
}) {
  const isMe = currentUserId === user.id;
  const connection = user.connection;

  return (
    <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header: Avatar, Name, Course */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
        <img
          src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
          alt={user.name}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--light-bg)',
            border: '2px solid #E2E8F0',
            flexShrink: 0
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <Link
              to={`/profile/${user.id}`}
              style={{
                fontWeight: 700,
                fontSize: '15px',
                color: 'var(--dark)',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              {user.name}
            </Link>
            {user.avg_rating !== null && user.avg_rating !== undefined && (
              <span aria-label={`${user.avg_rating} out of 5 from ${user.review_count || 0} reviews`} style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px', fontWeight: 600, color: '#D97706' }}>
                <Star size={13} fill="#F59E0B" color="#F59E0B" />
                {user.avg_rating} <span style={{ color: 'var(--muted)', fontSize: '10px', fontWeight: 500 }}>({user.review_count || 0})</span>
              </span>
            )}
          </div>
          <p className="text-small" style={{ color: 'var(--muted)', marginTop: '1px' }}>
            {user.role || 'Member'} • {user.course || 'No course'} {user.year ? `• ${user.year}` : ''}
          </p>
        </div>
      </div>

      {/* Bio excerpt */}
      {user.bio && (
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '1rem', flex: '0 0 auto', lineHeight: 1.4 }}>
          {user.bio.length > 90 ? `${user.bio.slice(0, 90)}...` : user.bio}
        </p>
      )}

      {/* Skills Sections */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--teal-chip-text)', display: 'block', marginBottom: '0.35rem' }}>
            Can Teach:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {user.teachSkills && user.teachSkills.length > 0 ? (
              user.teachSkills.map((s) => (
                <SkillChip key={s.id} name={s.name} type="teach" size="sm" />
              ))
            ) : (
              <span className="text-small" style={{ color: '#9CA3AF' }}>None listed yet</span>
            )}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--coral-chip-text)', display: 'block', marginBottom: '0.35rem' }}>
            Wants to Learn:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {user.learnSkills && user.learnSkills.length > 0 ? (
              user.learnSkills.map((s) => (
                <SkillChip key={s.id} name={s.name} type="learn" size="sm" />
              ))
            ) : (
              <span className="text-small" style={{ color: '#9CA3AF' }}>None listed yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <Link to={`/profile/${user.id}`} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
          View Profile
        </Link>

        {!isMe && (
          <>
            {connection?.status === 'accepted' ? (
              <Link to={`/chat/${user.id}`} className="btn btn-secondary btn-sm" title="Chat with connected student">
                <MessageSquare size={14} /> Chat
              </Link>
            ) : connection?.status === 'pending' ? (
              <button className="btn btn-outline btn-sm" disabled style={{ color: 'var(--muted)', background: '#F3F4F6' }}>
                <Clock size={13} /> Pending
              </button>
            ) : (
              <button
                onClick={() => onConnect && onConnect(user.id)}
                className="btn btn-primary btn-sm"
              >
                <UserPlus size={13} /> Connect
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
