import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, X } from 'lucide-react';

export default function ReportModal({
  isOpen,
  onClose,
  targetUser
}) {
  const { showToast } = useAuth();
  const [reason, setReason] = useState('Inappropriate conduct');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.submitReport({
        reportedUserId: targetUser.id,
        reason,
        description: description.trim()
      });
      showToast('Report submitted for admin review. Thank you for keeping SkillSwap safe.', 'info');
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
            <AlertTriangle size={20} color="#DC2626" />
            <h3 style={{ fontSize: '18px', color: '#991B1B' }}>Report Student</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '1.25rem' }}>
          Help us maintain a respectful and productive peer learning environment. Reports are reviewed by platform administrators.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Reason for Report:</label>
            <select className="form-select" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="Inappropriate conduct">Inappropriate conduct / language</option>
              <option value="No-show for scheduled session">No-show for scheduled session without notice</option>
              <option value="Spam / advertising">Spam or commercial advertising</option>
              <option value="Harassment">Harassment or unwelcome messages</option>
              <option value="Fake skill profile">Misleading or false skill claims</option>
              <option value="Other">Other policy violation</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Explanation / Details:</label>
            <textarea
              className="form-textarea"
              placeholder="Describe what occurred during the exchange or chat..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-danger btn-sm">
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
