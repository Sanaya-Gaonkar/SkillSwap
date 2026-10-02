import React from 'react';
import { Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function isLocalAddress(hostname) {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host === '::1' || host.endsWith('.local')) {
    return true;
  }

  const octets = host.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:');
  }

  return octets[0] === 10
    || octets[0] === 127
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168)
    || (octets[0] === 169 && octets[1] === 254);
}

export default function ShareAppButton({ mobile = false, iconOnly = false }) {
  const { showToast } = useAuth();

  const handleShare = async () => {
    const appUrl = window.location.origin;
    if (isLocalAddress(window.location.hostname)) {
      showToast('Open SkillSwap from its public Render link to share it with others.', 'error');
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SkillSwap',
          text: 'Learn, teach, and exchange skills on SkillSwap.',
          url: appUrl
        });
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(appUrl);
      showToast(`SkillSwap link copied: ${appUrl}`, 'success');
    } catch {
      const copiedUrl = window.prompt('Copy the SkillSwap app link:', appUrl);
      if (copiedUrl === null) {
        showToast('Could not copy the app link. Please try sharing again.', 'error');
      }
    }
  };

  if (mobile) {
    return (
      <button type="button" onClick={handleShare} className="mobile-nav-item" aria-label="Share SkillSwap">
        <Share2 size={20} />
        <span>Share</span>
      </button>
    );
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleShare}
        className="btn btn-outline btn-sm nav-share-icon"
        aria-label="Share SkillSwap"
        title="Share SkillSwap"
      >
        <Share2 size={17} />
      </button>
    );
  }

  return (
    <button type="button" onClick={handleShare} className="btn btn-outline btn-sm">
      <Share2 size={15} /> Share App
    </button>
  );
}
