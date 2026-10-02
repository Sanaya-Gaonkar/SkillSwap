import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, MessageSquare, User, Bell, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ShareAppButton from './ShareAppButton';

export default function MobileNav() {
  const { user, unreadCount, logout } = useAuth();
  if (!user) return null;

  if (user.role === 'Admin') {
    return (
      <nav className="mobile-nav admin-mobile-nav" aria-label="Administrator mobile navigation">
        <NavLink to="/admin" end className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Admin</span>
        </NavLink>
        <NavLink to={`/profile/${user.id}`} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <User size={20} />
          <span>Profile</span>
        </NavLink>
        <ShareAppButton mobile />
        <button type="button" onClick={logout} className="mobile-nav-item">
          <LogOut size={20} />
          <span>Log out</span>
        </button>
      </nav>
    );
  }

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <NavLink to="/home" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
        <Home size={20} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/discover" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
        <Compass size={20} />
        <span>Discover</span>
      </NavLink>
      <NavLink to="/chat" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
        <MessageSquare size={20} />
        <span>Chat</span>
      </NavLink>
      <NavLink to="/notifications" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
        <div style={{ position: 'relative' }}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: -3, right: -6, backgroundColor: '#EF4444', color: 'white', fontSize: '9px', fontWeight: 'bold', borderRadius: '9999px', padding: '1px 4px' }}>
              {unreadCount}
            </span>
          )}
        </div>
        <span>Alerts</span>
      </NavLink>
      <NavLink to={`/profile/${user.id}`} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
        <User size={20} />
        <span>Profile</span>
      </NavLink>
      <ShareAppButton mobile />
      <button type="button" onClick={logout} className="mobile-nav-item">
        <LogOut size={20} />
        <span>Log out</span>
      </button>
    </nav>
  );
}
