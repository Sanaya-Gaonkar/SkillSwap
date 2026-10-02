import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SkillChip from '../components/SkillChip';
import ScheduleSessionModal from '../components/ScheduleSessionModal';
import ReviewModal from '../components/ReviewModal';
import {
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  Calendar,
  Star,
  Check,
  X,
  Clock,
  Video,
  MapPin,
  ExternalLink
} from 'lucide-react';

export default function ExchangeDetail() {
  const { id } = useParams();
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const loadExchange = async () => {
    try {
      setLoading(true);
      const res = await api.getExchangeById(id);
      setExchange(res.exchange);
    } catch (err) {
      console.error('Error fetching exchange detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExchange();
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      await api.updateExchangeStatus(exchange.id, newStatus);
      showToast(
        newStatus === 'completed'
          ? 'Exchange marked as completed! Learning history updated.'
          : `Exchange proposal ${newStatus}!`,
        'success'
      );
      loadExchange();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSessionComplete = async (sessionId) => {
    try {
      await api.updateSession(sessionId, { status: 'completed' });
      showToast('Session marked as completed! You can now mark the full exchange as complete.', 'success');
      loadExchange();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>Loading skill exchange details...</p>
      </div>
    );
  }

  if (!exchange) {
    return (
      <div className="page-wrapper container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <h2>Exchange not found</h2>
        <Link to="/exchanges" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Exchanges
        </Link>
      </div>
    );
  }

  const isProposer = exchange.isProposer;
  const partner = exchange.partner;
  const canRespond = !isProposer && exchange.status === 'proposed';
  const hasReviewed = exchange.hasReviewed;

  // Step calculations for Section 25 Flow
  const isProposed = true;
  const isAccepted = exchange.status === 'accepted' || exchange.status === 'completed';
  const hasScheduledSession = exchange.sessions && exchange.sessions.length > 0;
  const hasCompletedSession = exchange.sessions && exchange.sessions.some((s) => s.status === 'completed');
  const isCompleted = exchange.status === 'completed';

  return (
    <div className="page-wrapper container" style={{ paddingTop: '1.75rem', maxWidth: '850px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link to="/exchanges" className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ fontSize: '24px' }}>Skill Exchange Journey</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Follow the complete peer-to-peer learning and teaching flow.
          </p>
        </div>
      </div>

      {/* Main Exchange Card */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src={partner.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${partner.name}`}
              alt={partner.name}
              style={{ width: '48px', height: '48px', borderRadius: '50%' }}
            />
            <div>
              <Link to={`/profile/${partner.id}`} style={{ fontWeight: 700, fontSize: '16px', color: 'var(--dark)' }}>
                {partner.name}
              </Link>
              <p className="text-small">{isProposer ? 'Partner Receiver' : 'Partner Proposer'}</p>
            </div>
          </div>

          <span className={`badge-status ${exchange.status}`} style={{ fontSize: '12px', padding: '0.35rem 0.85rem' }}>
            {exchange.status.toUpperCase()}
          </span>
        </div>

        {/* 2-Way Swap Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            padding: '1.25rem',
            backgroundColor: '#F8FAFC',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            marginBottom: '1rem'
          }}
        >
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--teal-chip-text)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
              {isProposer ? 'You Offer to Teach:' : `${partner.name} Offers to Teach:`}
            </span>
            <SkillChip name={exchange.offered_skill_name} type="teach" size="md" />
            <p className="text-small" style={{ marginTop: '0.35rem' }}>Category: {exchange.offered_skill_category}</p>
          </div>

          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--coral-chip-text)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
              {isProposer ? `You Request to Learn from ${partner.name}:` : 'They Request to Learn from You:'}
            </span>
            <SkillChip name={exchange.requested_skill_name} type="learn" size="md" />
            <p className="text-small" style={{ marginTop: '0.35rem' }}>Category: {exchange.requested_skill_category}</p>
          </div>
        </div>

        {exchange.notes && (
          <p style={{ fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic', marginBottom: '1.25rem' }}>
            Notes: "{exchange.notes}"
          </p>
        )}

        {/* Action triggers */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {canRespond && (
            <>
              <button
                onClick={() => handleUpdateStatus('accepted')}
                className="btn btn-secondary"
              >
                <Check size={16} /> Accept Exchange Proposal
              </button>
              <button
                onClick={() => handleUpdateStatus('rejected')}
                className="btn btn-outline"
                style={{ color: '#EF4444' }}
              >
                <X size={16} /> Decline
              </button>
            </>
          )}

          {exchange.status === 'accepted' && (
            <>
              <button onClick={() => setSessionModalOpen(true)} className="btn btn-outline">
                <Calendar size={16} /> Schedule Session
              </button>
              <button onClick={() => handleUpdateStatus('completed')} className="btn btn-primary">
                <CheckCircle2 size={16} /> Mark Exchange as Completed
              </button>
            </>
          )}

          {exchange.status === 'completed' && !hasReviewed && (
            <button onClick={() => setReviewModalOpen(true)} className="btn btn-secondary">
              <Star size={16} /> Leave Partner Review & Rating
            </button>
          )}
        </div>
      </div>

      {/* Visual Flow Stepper (Section 25) */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '1rem' }}>
          SkillSwap Flow Progress (Section 25)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={20} color="var(--secondary)" />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              1. Offer & Request Skills + Send Proposal
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={20} color={isAccepted ? 'var(--secondary)' : '#D1D5DB'} />
            <span style={{ fontSize: '14px', fontWeight: isAccepted ? 600 : 400, color: isAccepted ? 'var(--dark)' : 'var(--muted)' }}>
              2. Peer Review & Acceptance
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={20} color={hasScheduledSession ? 'var(--secondary)' : '#D1D5DB'} />
            <span style={{ fontSize: '14px', fontWeight: hasScheduledSession ? 600 : 400, color: hasScheduledSession ? 'var(--dark)' : 'var(--muted)' }}>
              3. Schedule Learning Session (Online/Offline)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={20} color={isCompleted ? 'var(--secondary)' : '#D1D5DB'} />
            <span style={{ fontSize: '14px', fontWeight: isCompleted ? 600 : 400, color: isCompleted ? 'var(--dark)' : 'var(--muted)' }}>
              4. Complete Session & Mark Exchange as Completed
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={20} color={hasReviewed ? 'var(--secondary)' : '#D1D5DB'} />
            <span style={{ fontSize: '14px', fontWeight: hasReviewed ? 600 : 400, color: hasReviewed ? 'var(--dark)' : 'var(--muted)' }}>
              5. Rate & Review + Learning History Auto-Updated
            </span>
          </div>
        </div>
      </div>

      {/* Sessions Section */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--primary)" /> Scheduled Sessions ({exchange.sessions?.length || 0})
          </h3>
          {exchange.status === 'accepted' && (
            <button onClick={() => setSessionModalOpen(true)} className="btn btn-outline btn-sm">
              + New Session
            </button>
          )}
        </div>

        {exchange.sessions && exchange.sessions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {exchange.sessions.map((sess) => (
              <div
                key={sess.id}
                style={{
                  padding: '1rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>
                      {new Date(sess.scheduled_at).toLocaleString()}
                    </span>
                    <span className={`badge-status ${sess.status}`}>
                      {sess.status}
                    </span>
                  </div>
                  <p className="text-small" style={{ marginTop: '3px' }}>
                    Mode: {sess.mode} • Location/Link: {sess.location_or_link}
                  </p>
                  {sess.notes && (
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                      Agenda: {sess.notes}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {sess.mode === 'Online' && sess.location_or_link.startsWith('http') && (
                    <a
                      href={sess.location_or_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      <Video size={13} /> Join Call <ExternalLink size={11} />
                    </a>
                  )}
                  {sess.status !== 'completed' && (
                    <button
                      onClick={() => handleSessionComplete(sess.id)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Check size={13} /> Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-small" style={{ color: 'var(--muted)' }}>
            No sessions scheduled yet. Use "+ New Session" to coordinate date and mode.
          </p>
        )}
      </div>

      {/* Reviews Section */}
      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '1rem' }}>
          Exchange Reviews ({exchange.reviews?.length || 0})
        </h3>
        {exchange.reviews && exchange.reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {exchange.reviews.map((r) => (
              <div key={r.id} style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600 }}>{r.reviewer_name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} fill={i < r.rating ? '#F59E0B' : '#E5E7EB'} color={i < r.rating ? '#F59E0B' : '#E5E7EB'} />
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: '13px' }}>"{r.comment}"</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-small" style={{ color: 'var(--muted)' }}>
            No reviews yet. When the exchange is marked as completed, both students can leave reviews.
          </p>
        )}
      </div>

      {/* Modals */}
      <ScheduleSessionModal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        exchange={exchange}
        onSuccess={loadExchange}
      />

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        exchange={exchange}
        onSuccess={loadExchange}
      />
    </div>
  );
}
