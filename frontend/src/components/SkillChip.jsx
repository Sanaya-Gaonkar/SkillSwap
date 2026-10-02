import React from 'react';
import { X, BookOpen, Sparkles } from 'lucide-react';

export default function SkillChip({
  name,
  type = 'teach', // 'teach' | 'learn' | 'neutral'
  proficiency,
  onRemove,
  size = 'md',
  onClick
}) {
  const chipClass =
    type === 'teach'
      ? 'chip-teach'
      : type === 'learn'
      ? 'chip-learn'
      : 'chip-neutral';

  const isSmall = size === 'sm';

  return (
    <span
      className={`skill-chip ${chipClass}`}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: isSmall ? '0.2rem 0.55rem' : '0.35rem 0.85rem',
        fontSize: isSmall ? '11px' : '13px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem'
      }}
    >
      {type === 'teach' && <Sparkles size={isSmall ? 10 : 12} />}
      {type === 'learn' && <BookOpen size={isSmall ? 10 : 12} />}
      <span>{name}</span>
      {proficiency && (
        <span
          style={{
            fontSize: '10px',
            opacity: 0.8,
            backgroundColor: 'rgba(0,0,0,0.06)',
            borderRadius: '4px',
            padding: '1px 4px'
          }}
        >
          {proficiency}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: 0,
            marginLeft: '2px',
            color: 'inherit',
            opacity: 0.7
          }}
          title="Remove skill"
        >
          <X size={isSmall ? 12 : 14} />
        </button>
      )}
    </span>
  );
}
