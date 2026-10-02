import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Users, Search, ArrowLeft, Shield, AlertTriangle, CheckCircle, Ban } from 'lucide-react';

export default function AdminUsers() {
  const { showToast } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminUsers({ search });
      setUsers(res.users || []);
    } catch (err) {
      console.error('Error fetching admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search]);

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await api.updateUserStatus(userId, nextStatus);
      showToast(`User account has been ${nextStatus === 'active' ? 'enabled' : 'disabled'}!`, 'info');
      loadUsers();
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
          <h1 style={{ fontSize: '24px' }}>User Management</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Review registered members, monitor reports, and manage access statuses.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by member name, email, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table / List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            Loading member accounts...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Student</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Course / Year</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Skills Count</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isActive = u.status === 'active';
                  const isAdmin = u.role === 'Admin';
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <img
                            src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name}`}
                            alt={u.name}
                            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                          />
                          <div>
                            <Link to={`/profile/${u.id}`} style={{ fontWeight: 600, color: 'var(--dark)' }}>
                              {u.name}
                            </Link>
                            <div className="text-small" style={{ color: 'var(--muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {u.course || '—'} {u.year ? `(${u.year})` : ''}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontWeight: isAdmin ? 700 : 500, color: isAdmin ? '#DC2626' : 'var(--dark)' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {u.skill_count} skills
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`badge-status ${isActive ? 'accepted' : 'rejected'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {!isAdmin && (
                          <button
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            className={`btn btn-sm ${isActive ? 'btn-outline' : 'btn-secondary'}`}
                            style={{ fontSize: '11px', padding: '0.25rem 0.6rem' }}
                          >
                            {isActive ? (
                              <>
                                <Ban size={12} color="#EF4444" /> Disable
                              </>
                            ) : (
                              <>
                                <CheckCircle size={12} /> Enable
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
