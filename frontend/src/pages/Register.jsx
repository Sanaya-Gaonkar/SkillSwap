import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { User, Mail, Lock, CheckCircle2, Briefcase } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        role
      });
      // Guide user to add skills after registration as specified in section 15
      navigate('/skills');
    } catch (err) {
      setError(err.message || 'Registration failed.');
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
          maxWidth: '460px',
          width: '100%',
          padding: '2.25rem',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Logo size="large" />
          <h2 style={{ fontSize: '22px', marginTop: '1.25rem', marginBottom: '0.35rem' }}>
            Create an Account
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Join SkillSwap and start learning, teaching, and swapping skills.
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
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="search-bar">
              <User size={16} className="search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ashwet Pilankar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">College / Personal Email</label>
            <div className="search-bar">
              <Mail size={16} className="search-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="ashwet@skillswap.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>


          {/* Account Type */}
          <div className="form-group">
            <label className="form-label">Account Type</label>
            <div className="search-bar">
              <Briefcase size={16} className="search-icon" />
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)} style={{ paddingLeft: '2.75rem' }}>
                <option value="Student">Student</option>
                <option value="Teacher">Teacher / Educator</option>
                <option value="Corporate Employee">Corporate Employee</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="search-bar">
              <Lock size={16} className="search-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="search-bar">
              <Lock size={16} className="search-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Flow note (Section 15) */}
          <div style={{ backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem', marginBottom: '1.25rem', fontSize: '12px', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>Next step: We'll guide you to select what you can teach and what you want to learn!</span>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg">
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '0.5rem' }}>
            Already have an account?
          </p>
          <Link to="/login" className="btn btn-outline btn-full btn-sm">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
