import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  ShieldAlert,
  Users,
  Sparkles,
  ArrowLeftRight,
  AlertTriangle,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminStats()
      .then((res) => setStats(res.stats))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrapper container" style={{ paddingTop: '1.75rem', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <ShieldAlert size={28} color="#DC2626" /> SkillSwap Administrator Console
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '0.25rem' }}>
          Platform metrics, user safety moderation, skill catalog management, and reports.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--muted)' }}>Loading administrator metrics...</p>
        </div>
      ) : (
        <>
          {/* Stats Metrics Cards (Section 30) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-small" style={{ fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Total Members
                </span>
                <Users size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '0.5rem', color: 'var(--dark)' }}>
                {stats?.totalUsers || 0}
              </div>
              <span className="text-small" style={{ color: 'var(--muted)' }}>Active member accounts</span>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-small" style={{ fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Total Skills
                </span>
                <Sparkles size={20} color="var(--secondary)" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '0.5rem', color: 'var(--dark)' }}>
                {stats?.totalSkills || 0}
              </div>
              <span className="text-small" style={{ color: 'var(--muted)' }}>Catalogued across 5 categories</span>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #F59E0B' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-small" style={{ fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Active Exchanges
                </span>
                <ArrowLeftRight size={20} color="#F59E0B" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '0.5rem', color: 'var(--dark)' }}>
                {stats?.activeExchanges || 0}
              </div>
              <span className="text-small" style={{ color: 'var(--muted)' }}>Proposed & In-progress swaps</span>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #DC2626' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-small" style={{ fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Pending Reports
                </span>
                <AlertTriangle size={20} color="#DC2626" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '0.5rem', color: stats?.pendingReports > 0 ? '#DC2626' : 'var(--dark)' }}>
                {stats?.pendingReports || 0}
              </div>
              <span className="text-small" style={{ color: 'var(--muted)' }}>Requires admin resolution</span>
            </div>
          </div>

          {/* Admin Management Hub Cards */}
          <h2 style={{ fontSize: '20px', marginBottom: '1.25rem' }}>Management Tools</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Manage Users */}
            <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#EFF6FF', color: 'var(--primary)' }}>
                  <Users size={22} />
                </div>
                <h3 style={{ fontSize: '18px' }}>Manage Users</h3>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.5, marginBottom: '1.5rem', flex: 1 }}>
                Search and review member accounts, inspect profiles, and enable or disable accounts violating conduct.
              </p>
              <Link to="/admin/users" className="btn btn-outline btn-full btn-sm">
                Open User Management <ArrowRight size={14} />
              </Link>
            </div>

            {/* Manage Skills */}
            <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#ECFDF5', color: 'var(--secondary)' }}>
                  <Sparkles size={22} />
                </div>
                <h3 style={{ fontSize: '18px' }}>Manage Skills</h3>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.5, marginBottom: '1.5rem', flex: 1 }}>
                Curate the platform's reusable skill database. Add new skills, edit categories, or delete outdated tags.
              </p>
              <Link to="/admin/skills" className="btn btn-outline btn-full btn-sm">
                Open Skill Catalog <ArrowRight size={14} />
              </Link>
            </div>

            {/* Manage Reports */}
            <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                  <AlertTriangle size={22} />
                </div>
                <h3 style={{ fontSize: '18px' }}>Manage Reports</h3>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.5, marginBottom: '1.5rem', flex: 1 }}>
                Review misconduct, spam, or missed sessions reported by students. Take action and resolve issues.
              </p>
              <Link to="/admin/reports" className="btn btn-outline btn-full btn-sm">
                Review Reports ({stats?.pendingReports || 0}) <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
