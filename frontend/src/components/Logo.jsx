import React from 'react';
import { Link } from 'react-router-dom';
export default function Logo({ size = 'medium', showTagline = true, to = '/' }) {
  const widths = {
    small: 128,
    medium: 176,
    large: 238
  };

  const content = (
    <span
      className={`skillswap-logo skillswap-logo-${size}`}
      style={{ '--logo-width': `${widths[size] || widths.medium}px` }}
    >
      <img
        src="/skillswap-logo.png"
        alt="SkillSwap - Learn. Teach. Swap."
        className="skillswap-logo-image"
      />
    </span>
  );

  if (to) {
    return <Link to={to || '/'} className="skillswap-logo-link" aria-label="SkillSwap home">{content}</Link>;
  }

  return content;
}
