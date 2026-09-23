import React, { useState } from 'react';
import { GAME_IMAGE_EMOJIS, CATEGORY_IMAGE_EMOJIS, BADGE_EMOJIS } from '../../data/emojis';

export default function CustomEmoji({ 
  name, 
  type = 'game', 
  src, 
  emoji,
  size = 'md', 
  alt = 'emoji',
  className = '' 
}) {
  const [hasError, setHasError] = useState(false);
  let imageSrc = src;

  if (!imageSrc) {
    if (type === 'game') {
      imageSrc = GAME_IMAGE_EMOJIS[name] || GAME_IMAGE_EMOJIS['blox-fruits'];
    } else if (type === 'category') {
      imageSrc = CATEGORY_IMAGE_EMOJIS[name] || CATEGORY_IMAGE_EMOJIS['permanent-fruits'];
    } else if (type === 'badge') {
      imageSrc = BADGE_EMOJIS[name];
    }
  }

  const sizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
    '2xl': 'w-12 h-12'
  }[size] || 'w-6 h-6';

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl'
  }[size] || 'text-base';

  const isUrl = imageSrc && typeof imageSrc === 'string' && (imageSrc.startsWith('http://') || imageSrc.startsWith('https://') || imageSrc.startsWith('/') || imageSrc.startsWith('data:'));

  if (!isUrl || hasError) {
    const fallbackEmoji = emoji || (!isUrl ? imageSrc : null) || '🎮';
    return (
      <span className={`inline-flex items-center justify-center shrink-0 select-none align-middle ${textSizeClasses} ${className}`}>
        {fallbackEmoji}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center shrink-0 align-middle ${className}`}>
      <img
        src={imageSrc}
        alt={alt || name}
        loading="lazy"
        className={`${sizeClasses} object-cover rounded-lg shadow-sm border border-white/10 ring-1 ring-black/40 pointer-events-none select-none`}
        onError={() => setHasError(true)}
      />
    </span>
  );
}
