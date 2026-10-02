import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftRight, X } from 'lucide-react';

export default function ExchangeModal({
  isOpen,
  onClose,
  targetUser,
  myTeachSkills = [],
  targetTeachSkills = [],
  onSuccess
}) {
  const { showToast } = useAuth();
  const [offeredSkillId, setOfferedSkillId] = useState(myTeachSkills[0]?.id || '');
  const [requestedSkillId, setRequestedSkillId] = useState(targetTeachSkills[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!offeredSkillId || !requestedSkillId) {
      showToast('Please select both a skill to offer and a skill to learn.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.proposeExchange({
        receiverId: targetUser.id,
        offeredSkillId: parseInt(offeredSkillId, 10),
        requestedSkillId: parseInt(requestedSkillId, 10),
        notes: notes.trim()
      });
      showToast('Two-way skill exchange proposal sent successfully!', 'success');
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
            <ArrowLeftRight size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '18px' }}>Propose Skill Swap</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '1.25rem' }}>
          SkillSwap is built on mutual learning! You teach something to <strong>{targetUser.name}</strong>, and they teach something to you.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Offered Skill */}
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--teal-chip-text)' }}>
              1. Skill You Will Teach (from your skills):
            </label>
            {myTeachSkills.length > 0 ? (
              <select
                className="form-select"
                value={offeredSkillId}
                onChange={(e) => setOfferedSkillId(e.target.value)}
                required
              >
                <option value="" disabled>-- Select a skill you teach --</option>
                {myTeachSkills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            ) : (
              <p style={{ fontSize: '12px', color: '#EF4444' }}>
                You have not added any skills to teach yet. Please add skills in "My Skills" first!
              </p>
            )}
          </div>

          {/* Requested Skill */}
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--coral-chip-text)' }}>
              2. Skill You Want to Learn (from {targetUser.name}'s skills):
            </label>
            {targetTeachSkills.length > 0 ? (
              <select
                className="form-select"
                value={requestedSkillId}
                onChange={(e) => setRequestedSkillId(e.target.value)}
                required
              >
                <option value="" disabled>-- Select a skill they teach --</option>
                {targetTeachSkills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            ) : (
              <p style={{ fontSize: '12px', color: '#EF4444' }}>
                This user has not listed any teaching skills yet.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Swap Goal or Agenda (Optional):</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Let's do a 45-min session where I explain Python functions and you show me Figma wireframing!"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || myTeachSkills.length === 0 || targetTeachSkills.length === 0}
              className="btn btn-primary btn-sm"
            >
              {submitting ? 'Sending Proposal...' : 'Send Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
