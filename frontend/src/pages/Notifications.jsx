import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  CheckCircle,
  UserPlus,
  MessageSquare,
  ArrowLeftRight,
  Calendar,
  Star,
  CheckCheck
} from 'lucide-react';

export default function Notifications() {
  const { user, setUnreadCount } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const handleMarkRead = async (id, link) => {
    try {
      await api.markNotificationRead(id);
      loadNotifications();
      if (link) navigate(link);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'connection_request':
      case 'connection_accepted':
        return <UserPlus size={18} color="var(--primary)" />;
      case 'message':
        return <MessageSquare size={18} color="#B45309" />;
      case 'exchange_proposal':
      case 'exchange_accepted':
      case 'exchange_rejected':
      case 'exchange_completed':
        return <ArrowLeftRight size={18} color="var(--secondary)" />;
      case 'session_scheduled':
      case 'session_completed':
        return <Calendar size={18} color="#7E22CE" />;
      case 'review':
        return <Star size={18} color="#F59E0B" />;
      default:
        return <Bell size={18} color="var(--primary)" />;
    }
  };

  return (
    <div className="page-wrapper container" style={{ paddingTop: '1.75rem', maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Bell size={28} color="var(--primary)" /> Notifications
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '0.25rem' }}>
            Stay updated on swap proposals, session schedules, and learning connections.
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <button onClick={handleMarkAllRead} className="btn btn-outline btn-sm">
            <CheckCheck size={14} /> Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--muted)' }}>Loading notifications...</p>
        </div>
      ) : notifications.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((notif) => {
            const isUnread = !notif.is_read;
            return (
              <div
                key={notif.id}
                onClick={() => handleMarkRead(notif.id, notif.link)}
                className="card card-hover"
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  backgroundColor: isUnread ? '#EFF6FF' : 'var(--white)',
                  borderLeft: isUnread ? '4px solid var(--primary)' : '1px solid var(--border)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.04)', flexShrink: 0 }}>
                    {getIconForType(notif.type)}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: isUnread ? 600 : 400, color: 'var(--dark)' }}>
                      {notif.message}
                    </p>
                    <span className="text-small" style={{ color: 'var(--muted)', marginTop: '2px', display: 'block' }}>
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {isUnread && (
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                      flexShrink: 0
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card empty-state">
          <Bell size={40} className="empty-state-icon" />
          <h3>No notifications</h3>
          <p className="text-small" style={{ marginTop: '0.25rem' }}>
            You're all caught up! Updates about your connections and swaps will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
