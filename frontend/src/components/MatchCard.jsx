import React from 'react';
import { Link } from 'react-router-dom';
import SkillChip from './SkillChip';
import { ArrowLeftRight, CheckCircle2, UserPlus, MessageSquare, Zap } from 'lucide-react';

export default function MatchCard({
  match,
  onConnect,
  onProposeExchange
}) {
  const {
    user,
    matchPercentage,
    matchTag,
    iCanLearnFromThem,
    theyCanLearnFromMe,
    connection,
    isTwoWay,
    matchReasons = []
  } = match;

  const isStrong = matchPercentage >= 80;

  return (
    <div
      className="card card-hover"
      style={{
        borderLeft: isStrong ? '4px solid var(--secondary)' : '4px solid var(--primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem'
      }}
    >
      {/* Top bar: User info + Match Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
            alt={user.name}
            style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid #E2E8F0' }}
          />
          <div>
            <Link to={`/profile/${user.id}`} style={{ fontWeight: 700, fontSize: '15px', color: 'var(--dark)' }}>
              {user.name}
            </Link>
            <p className="text-small" style={{ color: 'var(--muted)' }}>
              {user.role || 'Member'} • {user.course || 'No course'} • {user.year || 'Year not set'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`badge-match ${isStrong ? 'strong' : ''}`}>
            <Zap size={13} /> {matchPercentage}% Match
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: isStrong ? 'var(--secondary)' : 'var(--primary)' }}>
            {matchTag}
          </span>
        </div>
      </div>

      {/* Two-Way Swap Overlap Box */}
      <div
        style={{
          backgroundColor: isTwoWay ? 'var(--light-bg)' : '#F9FAFB',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}
      >
        {iCanLearnFromThem && iCanLearnFromThem.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', width: '130px', flexShrink: 0 }}>
              You learn from them:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {iCanLearnFromThem.map((s) => (
                <SkillChip key={s.id || s.name} name={s.name} type="learn" size="sm" />
              ))}
            </div>
          </div>
        )}

        {theyCanLearnFromMe && theyCanLearnFromMe.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', width: '130px', flexShrink: 0 }}>
              They learn from you:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {theyCanLearnFromMe.map((s) => (
                <SkillChip key={s.id || s.name} name={s.name} type="teach" size="sm" />
              ))}
            </div>
          </div>
        )}
      </div>

      {matchReasons?.length > 0 && (
        <div className="match-reasons">
          <strong>Why this match</strong>
          <ul>
            {matchReasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        </div>
      )}
      {match.commonSkills?.length > 0 && (
        <div className="match-common-skills">
          <strong>Also in common</strong>
          {match.commonSkills.map((skill) => <span key={skill.id}>{skill.name}</span>)}
        </div>
      )}

      {/* Availability / Mode note */}
      {user.availability && (
        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
          🕒 <strong>Available:</strong> {user.availability}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
        <Link to={`/profile/${user.id}`} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
          View Profile
        </Link>

        {connection?.status === 'accepted' ? (
          <>
            <Link to={`/chat/${user.id}`} className="btn btn-outline btn-sm" title="Message student">
              <MessageSquare size={13} /> Message
            </Link>
            <button
              onClick={() => onProposeExchange && onProposeExchange(user)}
              className="btn btn-secondary btn-sm"
            >
              <ArrowLeftRight size={13} /> Propose Swap
            </button>
          </>
        ) : connection?.status === 'pending' ? (
          <button className="btn btn-outline btn-sm" disabled style={{ color: 'var(--muted)' }}>
            Request Pending
          </button>
        ) : (
          <button
            onClick={() => onConnect && onConnect(user.id)}
            className="btn btn-primary btn-sm"
          >
            <UserPlus size={13} /> Connect
          </button>
        )}
      </div>
    </div>
  );
}
