import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SkillChip from '../components/SkillChip';
import ScheduleSessionModal from '../components/ScheduleSessionModal';
import ReviewModal from '../components/ReviewModal';
import {
  ArrowLeftRight,
  CheckCircle,
  Calendar,
  Star,
  Clock,
  Check,
  X,
  Plus,
  ArrowRight
} from 'lucide-react';

export default function Exchanges() {
  const { user, showToast } = useAuth();
  const [exchanges, setExchanges] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'proposed', 'accepted', 'completed'
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedExchangeForSession, setSelectedExchangeForSession] = useState(null);
  const [selectedExchangeForReview, setSelectedExchangeForReview] = useState(null);

  const loadExchanges = async () => {
    try {
      setLoading(true);
      const res = await api.getExchanges();
      setExchanges(res.exchanges || []);
    } catch (err) {
      console.error('Error fetching exchanges:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExchanges();
  }, [user]);

  const handleUpdateStatus = async (exchangeId, newStatus) => {
    try {
      await api.updateExchangeStatus(exchangeId, newStatus);
      showToast(
        newStatus === 'completed'
          ? 'Skill exchange marked as completed! You can now leave a review.'
          : `Exchange proposal ${newStatus}!`,
        'success'
      );
      loadExchanges();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredExchanges = exchanges.filter((ex) => {
    if (filter === 'all') return true;
    return ex.status === filter;
  });

  return (
    <div className="page-wrapper container" style={{ paddingTop: '1.75rem', maxWidth: '950px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ArrowLeftRight size={28} color="var(--primary)" /> Two-Way Skill Exchanges
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '0.25rem' }}>
            Mutual learning agreements: you teach what you know, they teach what you want to learn.
          </p>
        </div>

        <Link to="/discover" className="btn btn-primary btn-sm">
          <Plus size={16} /> Propose New Swap
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['all', 'proposed', 'accepted', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`btn btn-sm ${filter === tab ? 'btn-primary' : 'btn-outline'}`}
            style={{ textTransform: 'capitalize' }}
          >
            {tab} ({tab === 'all' ? exchanges.length : exchanges.filter((e) => e.status === tab).length})
          </button>
        ))}
      </div>

      {/* Exchanges List */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--muted)' }}>Loading your skill exchanges...</p>
        </div>
      ) : filteredExchanges.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredExchanges.map((ex) => {
            const isProposer = ex.isProposer;
            const partner = ex.myPartner;
            const canRespond = !isProposer && ex.status === 'proposed';
            const hasReviewed = ex.reviews?.some((r) => r.reviewer_id === user?.id);

            return (
              <div key={ex.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Header: Partner + Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={partner.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${partner.name}`}
                      alt={partner.name}
                      style={{ width: '44px', height: '44px', borderRadius: '50%' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Link to={`/profile/${partner.id}`} style={{ fontWeight: 700, fontSize: '16px', color: 'var(--dark)' }}>
                          {partner.name}
                        </Link>
                        <span className="text-small" style={{ color: 'var(--muted)' }}>
                          {isProposer ? '(You initiated)' : '(Incoming proposal)'}
                        </span>
                      </div>
                      <span className="text-small">
                        Created {new Date(ex.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span className={`badge-status ${ex.status}`}>
                    {ex.status === 'proposed' ? 'Proposal Pending' : ex.status}
                  </span>
                </div>

                {/* Two-Way Knowledge Swap Visualizer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    backgroundColor: '#F8FAFC',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  {/* Side A: You Teach */}
                  <div style={{ flex: '1 1 200px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--teal-chip-text)', display: 'block', marginBottom: '0.35rem' }}>
                      {isProposer ? 'You Teach:' : `${partner.name} Teaches:`}
                    </span>
                    <SkillChip name={ex.offered_skill_name} type="teach" size="md" />
                  </div>

                  {/* Circular Swap Icon */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '50%', backgroundColor: '#EFF6FF', color: 'var(--primary)' }}>
                    <ArrowLeftRight size={22} />
                  </div>

                  {/* Side B: They Teach */}
                  <div style={{ flex: '1 1 200px', textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--coral-chip-text)', display: 'block', marginBottom: '0.35rem' }}>
                      {isProposer ? `${partner.name} Teaches:` : 'You Teach:'}
                    </span>
                    <SkillChip name={ex.requested_skill_name} type="learn" size="md" />
                  </div>
                </div>

                {/* Notes if any */}
                {ex.notes && (
                  <p style={{ fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                    "{ex.notes}"
                  </p>
                )}

                {/* Actions per status (Section 25 Exact Flow) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <Link to={`/exchanges/${ex.id}`} className="btn btn-outline btn-sm">
                    View Full Flow Details <ArrowRight size={13} />
                  </Link>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {/* If Proposed and current user is receiver */}
                    {canRespond && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(ex.id, 'accepted')}
                          className="btn btn-secondary btn-sm"
                        >
                          <Check size={14} /> Accept Proposal
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(ex.id, 'rejected')}
                          className="btn btn-outline btn-sm"
                          style={{ color: '#EF4444' }}
                        >
                          <X size={14} /> Decline
                        </button>
                      </>
                    )}

                    {/* If Accepted */}
                    {ex.status === 'accepted' && (
                      <>
                        <button
                          onClick={() => setSelectedExchangeForSession(ex)}
                          className="btn btn-outline btn-sm"
                        >
                          <Calendar size={14} /> Schedule Session
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(ex.id, 'completed')}
                          className="btn btn-primary btn-sm"
                        >
                          <CheckCircle size={14} /> Mark as Completed
                        </button>
                      </>
                    )}

                    {/* If Completed */}
                    {ex.status === 'completed' && (
                      <>
                        {hasReviewed ? (
                          <span style={{ fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Review Submitted
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedExchangeForReview({ ...ex, partner })}
                            className="btn btn-secondary btn-sm"
                          >
                            <Star size={14} /> Rate & Review Partner
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card empty-state">
          <ArrowLeftRight size={40} className="empty-state-icon" />
          <h3>No {filter !== 'all' ? filter : ''} exchanges found</h3>
          <p style={{ maxWidth: '420px', margin: '0.5rem auto 1.25rem' }}>
            Two-way skill swaps let you teach what you know in return for learning what you want.
          </p>
          <Link to="/discover" className="btn btn-primary btn-sm">
            Find Students to Swap With
          </Link>
        </div>
      )}

      {/* Schedule Session Modal */}
      <ScheduleSessionModal
        isOpen={!!selectedExchangeForSession}
        onClose={() => setSelectedExchangeForSession(null)}
        exchange={selectedExchangeForSession}
        onSuccess={loadExchanges}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={!!selectedExchangeForReview}
        onClose={() => setSelectedExchangeForReview(null)}
        exchange={selectedExchangeForReview}
        onSuccess={loadExchanges}
      />
    </div>
  );
}
