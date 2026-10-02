import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, CheckCircle, ArrowLeft, Clock } from 'lucide-react';

export default function AdminReports() {
  const { showToast } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await api.getReports();
      setReports(res.reports || []);
    } catch (err) {
      console.error('Error fetching admin reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolve = async (reportId, status) => {
    try {
      await api.resolveReport(reportId, status);
      showToast(`Report marked as ${status}!`, 'success');
      loadReports();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page-wrapper container" style={{ paddingTop: '1.75rem', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link to="/admin" className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ fontSize: '24px' }}>Community Reports & Moderation</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Review peer reports regarding conduct, missed sessions, and platform safety.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--muted)' }}>Loading reports...</p>
        </div>
      ) : reports.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reports.map((rep) => {
            const isOpen = rep.status === 'open';
            return (
              <div
                key={rep.id}
                className="card"
                style={{
                  borderLeft: isOpen ? '4px solid #DC2626' : '4px solid var(--secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} color={isOpen ? '#DC2626' : 'var(--secondary)'} />
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>
                      Reason: {rep.reason}
                    </span>
                  </div>
                  <span className={`badge-status ${isOpen ? 'rejected' : 'completed'}`}>
                    {rep.status.toUpperCase()}
                  </span>
                </div>

                {/* Details box */}
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <span className="text-small" style={{ fontWeight: 600, color: 'var(--muted)', display: 'block' }}>Reported By:</span>
                    <span style={{ fontWeight: 600 }}>{rep.reporter_name}</span> ({rep.reporter_email})
                  </div>

                  <div>
                    <span className="text-small" style={{ fontWeight: 600, color: 'var(--muted)', display: 'block' }}>Reported Member:</span>
                    <Link to={`/profile/${rep.reported_user_id}`} style={{ fontWeight: 600, color: '#DC2626' }}>
                      {rep.reported_user_name}
                    </Link>{' '}
                    ({rep.reported_user_email})
                  </div>

                  <div>
                    <span className="text-small" style={{ fontWeight: 600, color: 'var(--muted)', display: 'block' }}>Reported On:</span>
                    <span style={{ fontSize: '12px' }}>{new Date(rep.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {rep.description && (
                  <div>
                    <span className="text-small" style={{ fontWeight: 600, color: 'var(--muted)', display: 'block' }}>Explanation:</span>
                    <p style={{ fontSize: '13px', color: 'var(--dark)', marginTop: '2px', lineHeight: 1.5 }}>
                      "{rep.description}"
                    </p>
                  </div>
                )}

                {/* Resolve Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.65rem' }}>
                  {isOpen ? (
                    <button
                      onClick={() => handleResolve(rep.id, 'resolved')}
                      className="btn btn-secondary btn-sm"
                    >
                      <CheckCircle size={14} /> Mark as Resolved
                    </button>
                  ) : (
                    <button
                      onClick={() => handleResolve(rep.id, 'open')}
                      className="btn btn-outline btn-sm"
                    >
                      Reopen Report
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card empty-state">
          <CheckCircle size={40} color="var(--secondary)" className="empty-state-icon" />
          <h3>No reports filed</h3>
          <p className="text-small" style={{ marginTop: '0.25rem' }}>
            The community is peaceful! Member reports will show here.
          </p>
        </div>
      )}
    </div>
  );
}
