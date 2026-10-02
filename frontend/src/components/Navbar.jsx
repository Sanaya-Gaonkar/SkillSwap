import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import ShareAppButton from './ShareAppButton';
import {
  Compass,
  MessageSquare,
  Users,
  Bell,
  Sparkles,
  LogOut,
  ShieldAlert,
  Calendar,
  History,
  LayoutDashboard,
  BookOpen
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, unreadCount } = useAuth();
  const isAdmin = user?.role === 'Admin';

  return (
    <>
      <header className={`navbar ${isAdmin ? 'navbar-admin' : ''}`}>
        <div className="container nav-container">
          <Logo size="medium" to={user ? (isAdmin ? '/admin' : '/home') : '/'} />

          {user ? (
            isAdmin ? (
              <nav className="nav-links admin-nav" aria-label="Administrator navigation">
                <NavLink to="/admin" end className={({ isActive }) => `nav-link admin-only ${isActive ? 'active' : ''}`}>
                  <LayoutDashboard size={16} /> Admin Portal
                </NavLink>
                <ShareAppButton />
                <Link
                  to={`/profile/${user.id}`}
                  className="admin-profile-link"
                  aria-label="Open administrator profile"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                  />
                  <span>{user.name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="btn btn-ghost btn-sm admin-logout"
                  title="Log out"
                  type="button"
                >
                  <LogOut size={16} />
                  <span>Log out</span>
                </button>
              </nav>
            ) : (
              <nav className="nav-links">
                <NavLink to="/home" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Home
                </NavLink>
                <NavLink to="/discover" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Compass size={16} /> Discover
                </NavLink>
                <NavLink to="/skills" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Sparkles size={16} /> My Skills
                </NavLink>
                <NavLink to="/connections" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Users size={16} /> Connections
                </NavLink>
                <NavLink to="/exchanges" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Exchanges
                </NavLink>
                <NavLink to="/sessions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Calendar size={16} /> Sessions
                </NavLink>
                <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <History size={16} /> History
                </NavLink>
                <NavLink to="/learning" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <BookOpen size={16} /> Learning
                </NavLink>
                <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <MessageSquare size={16} /> Chat
                </NavLink>
                <NavLink to="/notifications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <div style={{ position: 'relative', display: 'inline-flex' }}>
                    <Bell size={16} />
                    {unreadCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -8,
                          backgroundColor: '#EF4444',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: '700',
                          borderRadius: '9999px',
                          padding: '1px 5px',
                          lineHeight: 1
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </NavLink>

                <ShareAppButton />
                <Link
                  to={`/profile/${user.id}`}
                  className="user-profile-link"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                  />
                  <span>{user.name.split(' ')[0]}</span>
                </Link>

                <button
                  onClick={logout}
                  className="btn btn-ghost btn-sm nav-logout"
                  title="Log out"
                  type="button"
                >
                  <LogOut size={16} />
                  <span>Log out</span>
                </button>
              </nav>
            )
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShareAppButton />
              <Link to="/login" className="btn btn-outline btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
