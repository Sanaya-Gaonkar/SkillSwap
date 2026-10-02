import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import {
  Calendar,
  Video,
  MapPin,
  Clock,
  CheckCircle,
  ExternalLink,
  Play,
  ArrowRight
} from 'lucide-react';

export default function Sessions() {
  const { user, showToast } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewSession, setReviewSession] = useState(null);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await api.getSessions();
      setSessions(res.sessions || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [user]);

  const handleUpdateStatus = async (sessionId, status) => {
    try {
      await api.updateSession(sessionId, { status });
      showToast(`Session marked as ${status}!`, 'success');
      loadSessions();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page-wrapper container" style={{ paddingTop: '1.75rem', maxWidth: '850px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Calendar size={28} color="var(--primary)" /> Learning Sessions
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '0.25rem' }}>
            Track your 1-on-1 scheduled peer learning calls, campus meetings, and completion statuses.
          </p>
        </div>

        <Link to="/exchanges" className="btn btn-outline btn-sm">
          View Active Exchanges
        </Link>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--muted)' }}>Loading scheduled sessions...</p>
        </div>
      ) : sessions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {sessions.map((sess) => (
            <div key={sess.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: '16px' }}>
                    {new Date(sess.scheduled_at).toLocaleString()}
                  </span>
                </div>
                <span className={`badge-status ${sess.status}`}>
                  {sess.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <span className="text-small" style={{ fontWeight: 600, color: 'var(--muted)', display: 'block' }}>Learning Partner:</span>
                  <Link to={`/profile/${sess.partnerId}`} style={{ fontWeight: 600, color: 'var(--dark)' }}>
                    {sess.partnerName}
                  </Link>
                </div>

                <div>
                  <span className="text-small" style={{ fontWeight: 600, color: 'var(--muted)', display: 'block' }}>Swap Focus:</span>
                  <span style={{ fontSize: '13px' }}>{sess.offered_skill} ⇋ {sess.requested_skill}</span>
                </div>

                <div>
                  <span className="text-small" style={{ fontWeight: 600, color: 'var(--muted)', display: 'block' }}>Mode & Venue:</span>
                  <span style={{ fontSize: '13px' }}>
                    {sess.mode === 'Online' ? '🌐 Online Video Call' : '📍 In-Person Meeting'}
                  </span>
                </div>
              </div>

              {sess.location_or_link && (
                <div style={{ fontSize: '13px', color: 'var(--dark)' }}>
                  <strong>Link / Location:</strong>{' '}
                  {sess.location_or_link.startsWith('http') ? (
                    <a href={sess.location_or_link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
                      {sess.location_or_link} <ExternalLink size={12} style={{ display: 'inline' }} />
                    </a>
                  ) : (
                    <span>{sess.location_or_link}</span>
                  )}
                </div>
              )}

              {sess.notes && (
                <p style={{ fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                  Notes: {sess.notes}
                </p>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <Link to={`/exchanges/${sess.exchange_id}`} className="btn btn-outline btn-sm">
                  View Skill Swap <ArrowRight size={13} />
                </Link>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {sess.mode === 'Online' && sess.location_or_link?.startsWith('http') && new Date(sess.scheduled_at) <= new Date() && sess.status !== 'completed' && (
                    <a
                      href={sess.location_or_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      <Video size={14} /> Join Meeting
                    </a>
                  )}
                  {sess.mode === 'Online' && sess.location_or_link?.startsWith('http') && new Date(sess.scheduled_at) > new Date() && (
                    <span className="text-small" role="status">Join available at the scheduled time</span>
                  )}

                  {sess.status === 'scheduled' && (
                    <button
                      onClick={() => handleUpdateStatus(sess.id, 'started')}
                      className="btn btn-outline btn-sm"
                    >
                      <Play size={13} /> Start Session
                    </button>
                  )}

                  {sess.status !== 'completed' && (
                    <button
                      onClick={() => handleUpdateStatus(sess.id, 'completed')}
                      className="btn btn-secondary btn-sm"
                    >
                      <CheckCircle size={14} /> Complete Session
                    </button>
                  )}

                  {sess.status === 'completed' && !sess.has_reviewed && (
                    <button
                      onClick={() => setReviewSession({ id: sess.exchange_id, partner: { id: sess.partnerId, name: sess.partnerName } })}
                      className="btn btn-secondary btn-sm"
                    >
                      <span aria-hidden="true">★</span> Rate & Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty-state">
          <Calendar size={40} className="empty-state-icon" />
          <h3>No sessions scheduled yet</h3>
          <p style={{ maxWidth: '400px', margin: '0.5rem auto 1.25rem' }}>
            Once you and a peer agree on a skill exchange, schedule a session to meet online or on campus!
          </p>
          <Link to="/exchanges" className="btn btn-primary btn-sm">
            View Skill Exchanges
          </Link>
        </div>
      )}

      <ReviewModal
        isOpen={Boolean(reviewSession)}
        onClose={() => setReviewSession(null)}
        exchange={reviewSession}
        onSuccess={() => {
          setReviewSession(null);
          loadSessions();
        }}
      />
    </div>
  );
}
