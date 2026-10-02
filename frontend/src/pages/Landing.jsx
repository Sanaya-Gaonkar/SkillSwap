import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import {
  Sparkles,
  BookOpen,
  ArrowLeftRight,
  Users,
  CheckCircle,
  GraduationCap,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <section
        style={{
          padding: '4rem 1.25rem 5rem',
          textAlign: 'center'
        }}
      >
        <div className="container" style={{ maxWidth: '850px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '0.35rem 1rem', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, marginBottom: '1.5rem' }}>
            <Sparkles size={16} /> Student Peer-to-Peer Learning Platform
          </div>

          <h1 style={{ fontSize: '42px', fontWeight: 800, color: 'var(--dark)', letterSpacing: '-1px', marginBottom: '1rem', lineHeight: 1.2 }}>
            Learn what you want. <br />
            <span style={{ color: 'var(--primary)' }}>Teach what you know.</span> <br />
            <span style={{ color: 'var(--secondary)' }}>Swap with peers.</span>
          </h1>

          <p style={{ fontSize: '18px', color: 'var(--muted)', maxWidth: '650px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
            SkillSwap connects college students for direct knowledge exchange. No costly courses, no rigid timetables—just real hands-on learning with peers.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Log In to Account
            </Link>
          </div>

          {/* Quick Concept Pill */}
          <div style={{ marginTop: '2.5rem', display: 'inline-flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', color: 'var(--muted)', fontSize: '13px', fontWeight: 500 }}>
            <span>✓ 100% Free Peer Learning</span>
            <span>✓ Verified Student Community</span>
            <span>✓ Flexible 1-on-1 Sessions</span>
          </div>
        </div>
      </section>

      {/* Core Philosophy Section (Section 2 & 44) */}
      <section style={{ padding: '4rem 1.25rem', backgroundColor: 'rgba(255,255,255,0.52)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3rem' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>The SkillSwap Philosophy</h2>
            <p style={{ color: 'var(--muted)' }}>
              Your skills have value. Exchange them.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {/* Learn */}
            <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '1rem' }}>
                <BookOpen size={24} />
              </div>
              <h3 style={{ fontSize: '18px', marginBottom: '0.5rem' }}>1. Learn</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
                Find fellow students who can teach what you want to master—whether it's Python, UI/UX, Spanish, or Financial Modelling.
              </p>
            </div>

            {/* Teach */}
            <div className="card" style={{ borderTop: '4px solid var(--secondary)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)', marginBottom: '1rem' }}>
                <GraduationCap size={24} />
              </div>
              <h3 style={{ fontSize: '18px', marginBottom: '0.5rem' }}>2. Teach</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
                Share the practical knowledge you already have. Mentoring others solidifies your own understanding and builds leadership.
              </p>
            </div>

            {/* Swap */}
            <div className="card" style={{ borderTop: '4px solid #DA8465' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FFEDE6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DA8465', marginBottom: '1rem' }}>
                <ArrowLeftRight size={24} />
              </div>
              <h3 style={{ fontSize: '18px', marginBottom: '0.5rem' }}>3. Swap</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
                Exchange knowledge through a fair, two-way proposal. You teach for 45 minutes, they teach for 45 minutes—everyone wins.
              </p>
            </div>

            {/* Connect */}
            <div className="card" style={{ borderTop: '4px solid #6A9F95' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#E6F4F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6A9F95', marginBottom: '1rem' }}>
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '18px', marginBottom: '0.5rem' }}>4. Connect</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
                Build meaningful academic and career connections with peers across departments, years, and colleges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Banner */}
      <section style={{ backgroundColor: 'rgba(247,250,249,0.48)', padding: '4rem 1.25rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '750px' }}>
          <h2 style={{ fontSize: '26px', marginBottom: '1rem' }}>
            "Everyone has something to teach. Everyone has something to learn."
          </h2>
          <p style={{ color: 'var(--muted)', marginBottom: '2rem', fontSize: '15px' }}>
            Join hundreds of college students trading skills in programming, graphic design, business, and academics.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Your Student Profile
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', backgroundColor: 'rgba(255,255,255,0.52)', padding: '2rem 1.25rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <Logo size="small" />
          <p className="text-small" style={{ color: 'var(--muted)' }}>
            SkillSwap — Student-Focused Collaborative Learning Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
