import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, X } from 'lucide-react';

export default function ScheduleSessionModal({
  isOpen,
  onClose,
  exchange,
  onSuccess
}) {
  const { showToast } = useAuth();
  const [scheduledAt, setScheduledAt] = useState('');
  const [mode, setMode] = useState('Online');
  const [locationOrLink, setLocationOrLink] = useState('https://meet.google.com/skillswap-session');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !exchange) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduledAt) {
      showToast('Please select a date and time for the session.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.scheduleSession({
        exchangeId: exchange.id,
        scheduledAt,
        mode,
        locationOrLink: locationOrLink.trim(),
        notes: notes.trim()
      });
      showToast('Learning session scheduled successfully!', 'success');
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '18px' }}>Schedule Learning Session</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '1.25rem' }}>
          Set a mutual time to connect and teach each other for this skill swap.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Date & Time:</label>
            <input
              type="datetime-local"
              className="form-input"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Session Mode:</label>
            <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="Online">Online (Video call / Screen sharing)</option>
              <option value="Offline">Offline (Campus library / Lab / Cafe)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              {mode === 'Online' ? 'Meeting Link (Google Meet / Zoom / Discord):' : 'Meeting Location (Campus / Room):'}
            </label>
            <input
              type="text"
              className="form-input"
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              placeholder={mode === 'Online' ? 'https://meet.google.com/xyz' : 'Central Library, Study Room B'}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Agenda / Prep Notes:</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. 1st half: Python dictionaries walkthrough; 2nd half: Figma auto-layout exercises."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
              {submitting ? 'Scheduling...' : 'Schedule Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
