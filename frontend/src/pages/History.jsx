import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SkillChip from '../components/SkillChip';
import { History as HistoryIcon, Star, Calendar, ArrowRight, Award } from 'lucide-react';

export default function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getLearningHistory();
      setHistory(res.history || []);
    } catch (err) {
      console.error('Error fetching learning history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper container" style={{ paddingTop: '1.75rem', maxWidth: '850px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <HistoryIcon size={28} color="var(--primary)" /> Learning History
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '0.25rem' }}>
          Your verified record of skills acquired through peer-to-peer exchanges on SkillSwap.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--muted)' }}>Loading learning history...</p>
        </div>
      ) : history.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.map((item) => (
            <div
              key={item.id}
              className="card card-hover"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                borderLeft: '4px solid var(--secondary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: '#ECFDF5', color: 'var(--secondary)' }}>
                  <Award size={28} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--dark)' }}>
                      {item.skill_name}
                    </span>
                    <SkillChip name={item.skill_category} type="neutral" size="sm" />
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    Learned from{' '}
                    <Link to={`/profile/${item.partner_id}`} style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {item.partner_name}
                    </Link>{' '}
                    • {new Date(item.learned_on).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {item.rating ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FEF3C7', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', color: '#92400E', fontWeight: 600, fontSize: '12px' }}>
                    <Star size={14} fill="#F59E0B" color="#F59E0B" />
                    <span>{item.rating} / 5 Stars</span>
                  </div>
                ) : (
                  <span className="text-small" style={{ color: 'var(--muted)' }}>Completed</span>
                )}

                <Link to={`/exchanges/${item.exchange_id}`} className="btn btn-outline btn-sm">
                  View Swap Details <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty-state">
          <Award size={40} className="empty-state-icon" />
          <h3>No completed learning history yet</h3>
          <p style={{ maxWidth: '400px', margin: '0.5rem auto 1.25rem' }}>
            Complete your first two-way skill exchange with a peer to build up your verifiable learning portfolio!
          </p>
          <Link to="/discover" className="btn btn-primary btn-sm">
            Find Skills to Learn
          </Link>
        </div>
      )}
    </div>
  );
}
