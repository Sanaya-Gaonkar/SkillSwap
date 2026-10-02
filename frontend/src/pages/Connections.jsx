import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SkillChip from '../components/SkillChip';
import ExchangeModal from '../components/ExchangeModal';
import {
  Users,
  UserCheck,
  Check,
  X,
  MessageSquare,
  ArrowLeftRight,
  Clock,
  Compass
} from 'lucide-react';

export default function Connections() {
  const { user, showToast } = useAuth();
  const [data, setData] = useState({ connections: [], accepted: [], pendingIncoming: [], pendingOutgoing: [] });
  const [loading, setLoading] = useState(true);

  // Exchange modal
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [targetSwapUser, setTargetSwapUser] = useState(null);
  const [myTeachSkills, setMyTeachSkills] = useState([]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const res = await api.getConnections();
      setData(res);

      if (user?.id) {
        const mySkillsRes = await api.getUserSkills(user.id);
        setMyTeachSkills(mySkillsRes.teachSkills.map((s) => ({ id: s.skill_id, name: s.name, category: s.category })));
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, [user]);

  const handleRespond = async (connectionId, status) => {
    try {
      await api.updateConnectionStatus(connectionId, status);
      showToast(`Connection request ${status}!`, status === 'accepted' ? 'success' : 'info');
      loadConnections();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenSwap = (otherUser) => {
    setTargetSwapUser(otherUser);
    setExchangeModalOpen(true);
  };

  return (
    <div className="page-wrapper container" style={{ paddingTop: '1.75rem', maxWidth: '950px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Users size={28} color="var(--primary)" /> Peer Connections
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '0.25rem' }}>
            Manage your student connections, pending requests, and learning partners.
          </p>
        </div>

        <Link to="/discover" className="btn btn-outline btn-sm">
          <Compass size={15} /> Find More Students
        </Link>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--muted)' }}>Loading connections...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Pending Incoming Requests */}
          {data.pendingIncoming.length > 0 && (
            <div>
              <h2 style={{ fontSize: '18px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Clock size={18} /> Received Requests ({data.pendingIncoming.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {data.pendingIncoming.map((item) => (
                  <div key={item.id} className="card" style={{ borderLeft: '4px solid #F59E0B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <img
                        src={item.otherUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.otherUser.name}`}
                        alt={item.otherUser.name}
                        style={{ width: '44px', height: '44px', borderRadius: '50%' }}
                      />
                      <div>
                        <Link to={`/profile/${item.otherUser.id}`} style={{ fontWeight: 700, color: 'var(--dark)' }}>
                          {item.otherUser.name}
                        </Link>
                        <p className="text-small">{item.otherUser.course} • {item.otherUser.year}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button
                        onClick={() => handleRespond(item.id, 'accepted')}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                      >
                        <Check size={14} /> Accept
                      </button>
                      <button
                        onClick={() => handleRespond(item.id, 'rejected')}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#EF4444' }}
                      >
                        <X size={14} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Outgoing Requests */}
          {data.pendingOutgoing.length > 0 && (
            <div>
              <h3 style={{ fontSize: '16px', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                Sent Requests ({data.pendingOutgoing.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                {data.pendingOutgoing.map((item) => (
                  <div key={item.id} className="card" style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <img
                        src={item.otherUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.otherUser.name}`}
                        alt={item.otherUser.name}
                        style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                      />
                      <div>
                        <Link to={`/profile/${item.otherUser.id}`} style={{ fontWeight: 600, color: 'var(--dark)' }}>
                          {item.otherUser.name}
                        </Link>
                        <p className="text-small">Pending response...</p>
                      </div>
                    </div>
                    <span className="badge-status pending">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connected Learning Peers (Accepted) */}
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '1rem' }}>
              Connected Peers ({data.accepted.length})
            </h2>

            {data.accepted.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {data.accepted.map((item) => (
                  <div key={item.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                      <img
                        src={item.otherUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.otherUser.name}`}
                        alt={item.otherUser.name}
                        style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--secondary)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <Link to={`/profile/${item.otherUser.id}`} style={{ fontWeight: 700, fontSize: '15px', color: 'var(--dark)' }}>
                          {item.otherUser.name}
                        </Link>
                        <p className="text-small">{item.otherUser.course} • {item.otherUser.year}</p>
                      </div>
                      <span className="badge-status accepted">Connected</span>
                    </div>

                    {/* Skill preview */}
                    <div style={{ marginBottom: '1rem', flex: 1 }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--teal-chip-text)', display: 'block', marginBottom: '0.25rem' }}>
                        Can Teach:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {item.otherUser.teachSkills?.slice(0, 3).map((s) => (
                          <SkillChip key={s.id} name={s.name} type="teach" size="sm" />
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                      <Link
                        to={`/chat/${item.otherUser.id}`}
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1 }}
                      >
                        <MessageSquare size={13} /> Chat
                      </Link>
                      <button
                        onClick={() => handleOpenSwap(item.otherUser)}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1.2 }}
                      >
                        <ArrowLeftRight size={13} /> Propose Swap
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card empty-state">
                <Users size={40} className="empty-state-icon" />
                <h3>No active connections yet</h3>
                <p style={{ maxWidth: '400px', margin: '0.5rem auto 1.25rem' }}>
                  Explore other students on the Discover page and send a connection request to start messaging and proposing skill swaps.
                </p>
                <Link to="/discover" className="btn btn-primary btn-sm">
                  Discover Students
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Propose Exchange Modal */}
      <ExchangeModal
        isOpen={exchangeModalOpen}
        onClose={() => setExchangeModalOpen(false)}
        targetUser={targetSwapUser}
        myTeachSkills={myTeachSkills}
        targetTeachSkills={targetSwapUser?.teachSkills || []}
        onSuccess={() => showToast('Proposal sent to connected peer!', 'success')}
      />
    </div>
  );
}
