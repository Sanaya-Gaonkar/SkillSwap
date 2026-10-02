import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function Login() {
  const { login, showToast } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const authenticatedUser = await login(email, password);
      navigate(authenticatedUser.role === 'Admin' ? '/admin' : '/home');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
        background: 'transparent'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.25rem',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Header with Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Logo size="large" />
          <h2 style={{ fontSize: '22px', marginTop: '1.25rem', marginBottom: '0.35rem' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Log in to keep learning, teaching and swapping.
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--error)',
              color: 'var(--error-text)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              marginBottom: '1.25rem',
              border: '1px solid #FECACA'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email input */}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className="search-bar">
              <Mail size={16} className="search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password input with show/hide */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  showToast('To reset password in demo, use password: password123', 'info');
                }}
                style={{ fontSize: '12px', color: 'var(--primary)' }}
              >
                Forgot password?
              </a>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.875rem', color: 'var(--muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.5rem' }}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted)'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="remember" style={{ fontSize: '13px', color: 'var(--muted)', cursor: 'pointer' }}>
              Remember me
            </label>
          </div>

          {/* Primary Button */}
          <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg">
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        {/* Bottom Switch */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '0.5rem' }}>
            New to SkillSwap?
          </p>
          <Link to="/register" className="btn btn-outline btn-full btn-sm">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
