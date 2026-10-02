import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="page-wrapper container" style={{ paddingTop: '5rem', textAlign: 'center' }}>
      <HelpCircle size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
      <h1 style={{ fontSize: '32px', marginBottom: '0.5rem' }}>Page Not Found</h1>
      <p style={{ color: 'var(--muted)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
        The page you requested does not exist or has been moved.
      </p>
      <Link to="/home" className="btn btn-primary">
        Return to Home Dashboard
      </Link>
    </div>
  );
}
