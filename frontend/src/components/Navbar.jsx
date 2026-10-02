import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import ShareAppButton from './ShareAppButton';
import {
  Compass,
  MessageSquare,
  Users,
  Bell,
  Sparkles,
  Calendar,
  History,
  LayoutDashboard,
  BookOpen,
  ChevronDown,
  LogOut as LogoutIcon,
  Settings
} from 'lucide-react';

function AccountMenu({ user, logout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className="account-menu-trigger"
        aria-label="Open profile menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <img
          src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`}
          alt=""
        />
        <span className="account-menu-name">{user.name.split(' ')[0]}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="account-menu-dropdown" role="menu">
          <Link to="/profile/edit" role="menuitem" onClick={() => setOpen(false)}>
            <Settings size={16} /> Profile settings
          </Link>
          <button type="button" role="menuitem" onClick={handleLogout}>
            <LogoutIcon size={16} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

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
                <div className="nav-primary-links">
                  <NavLink to="/admin" end className={({ isActive }) => `nav-link admin-only ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={16} /> Admin Portal
                  </NavLink>
                </div>
                <div className="nav-quick-actions">
                  <ShareAppButton iconOnly />
                  <AccountMenu user={user} logout={logout} />
                </div>
              </nav>
            ) : (
              <nav className="nav-links student-nav" aria-label="Main navigation">
                <div className="nav-primary-links">
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
                        <span className="nav-notification-count">{unreadCount}</span>
                      )}
                    </div>
                  </NavLink>
                </div>
                <div className="nav-quick-actions">
                  <ShareAppButton iconOnly />
                  <AccountMenu user={user} logout={logout} />
                </div>
              </nav>
            )
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShareAppButton iconOnly />
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
