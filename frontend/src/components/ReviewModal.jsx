import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Star, X } from 'lucide-react';

export default function ReviewModal({
  isOpen,
  onClose,
  exchange,
  onSuccess
}) {
  const { showToast } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !exchange) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.addReview({
        exchangeId: exchange.id,
        rating,
        comment: comment.trim()
      });
      showToast('Thank you for rating your peer learning partner!', 'success');
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
            <Star size={20} color="#F59E0B" fill="#F59E0B" />
            <h3 style={{ fontSize: '18px' }}>Rate & Review Learning Partner</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '1.25rem' }}>
          How was your experience swapping skills with <strong>{exchange.partner?.name || 'your partner'}</strong>?
        </p>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="form-group" style={{ textAlign: 'center', margin: '1.5rem 0' }}>
            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <Star
                    size={32}
                    color="#F59E0B"
                    fill={(hoverRating || rating) >= star ? '#F59E0B' : 'transparent'}
                  />
                </button>
              ))}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#D97706', marginTop: '0.35rem' }}>
              {rating === 5 && '🌟 Outstanding Peer Mentor'}
              {rating === 4 && '👍 Great Knowledge Exchange'}
              {rating === 3 && '👌 Good Session'}
              {rating === 2 && '😕 Needs Improvement'}
              {rating === 1 && '👎 Poor Experience'}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Review Comment:</label>
            <textarea
              className="form-textarea"
              placeholder="Share how they explained topics, their patience, and what you learned..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
