import React, { useState } from 'react';

// Cute inline vector fallbacks for top countries
const INLINE_FLAGS = {
  VN: (
    <svg viewBox="0 0 30 20" className="w-full h-full block">
      <rect width="30" height="20" fill="#DA251D" />
      <polygon
        points="15,4 16.5,8.8 21.5,8.8 17.5,11.8 19,16.6 15,13.6 11,16.6 12.5,11.8 8.5,8.8 13.5,8.8"
        fill="#FFFF00"
      />
    </svg>
  ),
  US: (
    <svg viewBox="0 0 30 20" className="w-full h-full block">
      <rect width="30" height="20" fill="#B22234" />
      <rect y="1.54" width="30" height="1.54" fill="#FFFFFF" />
      <rect y="4.62" width="30" height="1.54" fill="#FFFFFF" />
      <rect y="7.69" width="30" height="1.54" fill="#FFFFFF" />
      <rect y="10.77" width="30" height="1.54" fill="#FFFFFF" />
      <rect y="13.85" width="30" height="1.54" fill="#FFFFFF" />
      <rect y="16.92" width="30" height="1.54" fill="#FFFFFF" />
      <rect width="12" height="10.77" fill="#3C3B6E" />
      <circle cx="3" cy="2.7" r="0.8" fill="#FFFFFF" />
      <circle cx="6" cy="2.7" r="0.8" fill="#FFFFFF" />
      <circle cx="9" cy="2.7" r="0.8" fill="#FFFFFF" />
      <circle cx="4.5" cy="5.4" r="0.8" fill="#FFFFFF" />
      <circle cx="7.5" cy="5.4" r="0.8" fill="#FFFFFF" />
      <circle cx="3" cy="8.1" r="0.8" fill="#FFFFFF" />
      <circle cx="6" cy="8.1" r="0.8" fill="#FFFFFF" />
      <circle cx="9" cy="8.1" r="0.8" fill="#FFFFFF" />
    </svg>
  ),
  PH: (
    <svg viewBox="0 0 30 20" className="w-full h-full block">
      <rect width="30" height="10" fill="#0038A8" />
      <rect y="10" width="30" height="10" fill="#CE1126" />
      <polygon points="0,0 15,10 0,20" fill="#FFFFFF" />
      <circle cx="5" cy="10" r="2.2" fill="#FCD116" />
    </svg>
  ),
  TH: (
    <svg viewBox="0 0 30 20" className="w-full h-full block">
      <rect width="30" height="20" fill="#A51931" />
      <rect y="3.33" width="30" height="13.33" fill="#F4F5F8" />
      <rect y="6.67" width="30" height="6.67" fill="#2D2A4A" />
    </svg>
  ),
  JP: (
    <svg viewBox="0 0 30 20" className="w-full h-full block">
      <rect width="30" height="20" fill="#FFFFFF" />
      <circle cx="15" cy="10" r="6" fill="#BC002D" />
    </svg>
  ),
  GB: (
    <svg viewBox="0 0 30 20" className="w-full h-full block">
      <rect width="30" height="20" fill="#012169" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#FFFFFF" strokeWidth="4" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" strokeWidth="2" />
      <path d="M15,0 V20 M0,10 H30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="3.6" />
    </svg>
  ),
  CA: (
    <svg viewBox="0 0 30 20" className="w-full h-full block">
      <rect width="30" height="20" fill="#FF0000" />
      <rect x="7.5" width="15" height="20" fill="#FFFFFF" />
      <path d="M15,4 L16,7 L19,6 L17.5,9 L20,11 L16.5,12 L15,16 L13.5,12 L10,11 L12.5,9 L11,6 L14,7 Z" fill="#FF0000" />
    </svg>
  ),
  AU: (
    <svg viewBox="0 0 30 20" className="w-full h-full block">
      <rect width="30" height="20" fill="#00008B" />
      <rect width="15" height="10" fill="#012169" />
      <path d="M0,0 L15,10 M15,0 L0,10" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M7.5,0 V10 M0,5 H15" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M7.5,0 V10 M0,5 H15" stroke="#C8102E" strokeWidth="1.8" />
      <circle cx="7.5" cy="15" r="1.8" fill="#FFFFFF" />
      <circle cx="22.5" cy="5" r="1.2" fill="#FFFFFF" />
      <circle cx="20" cy="10" r="1" fill="#FFFFFF" />
      <circle cx="25" cy="10" r="1" fill="#FFFFFF" />
      <circle cx="22.5" cy="15" r="1.2" fill="#FFFFFF" />
    </svg>
  ),
  SG: (
    <svg viewBox="0 0 30 20" className="w-full h-full block">
      <rect width="30" height="10" fill="#ED2939" />
      <rect y="10" width="30" height="10" fill="#FFFFFF" />
      <circle cx="6" cy="5" r="3" fill="#FFFFFF" />
      <circle cx="7" cy="5" r="3" fill="#ED2939" />
    </svg>
  ),
  ID: (
    <svg viewBox="0 0 30 20" className="w-full h-full block">
      <rect width="30" height="10" fill="#FF0000" />
      <rect y="10" width="30" height="10" fill="#FFFFFF" />
    </svg>
  ),
  DE: (
    <svg viewBox="0 0 30 20" className="w-full h-full block">
      <rect width="30" height="6.67" fill="#000000" />
      <rect y="6.67" width="30" height="6.67" fill="#DD0000" />
      <rect y="13.33" width="30" height="6.67" fill="#FFCE00" />
    </svg>
  ),
  FR: (
    <svg viewBox="0 0 30 20" className="w-full h-full block">
      <rect width="10" height="20" fill="#002395" />
      <rect x="10" width="10" height="20" fill="#FFFFFF" />
      <rect x="20" width="10" height="20" fill="#ED2939" />
    </svg>
  ),
  KR: (
    <svg viewBox="0 0 30 20" className="w-full h-full block">
      <rect width="30" height="20" fill="#FFFFFF" />
      <circle cx="15" cy="10" r="4.5" fill="#CD2E3A" />
      <path d="M15,10 A2.25,2.25 0 0,0 15,14.5 A2.25,2.25 0 0,1 15,5.5 A4.5,4.5 0 0,1 15,14.5" fill="#0047A0" />
    </svg>
  ),
  BR: (
    <svg viewBox="0 0 30 20" className="w-full h-full block">
      <rect width="30" height="20" fill="#009C3B" />
      <polygon points="15,2 28,10 15,18 2,10" fill="#FFDF00" />
      <circle cx="15" cy="10" r="4" fill="#002776" />
    </svg>
  )
};

const PIXEL_SIZES = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28
};

export default function CountryFlag({
  code = 'US',
  name = 'United States',
  size = 'sm',
  variant = 'circle',
  showName = false,
  showCode = false,
  className = ''
}) {
  const [imgError, setImgError] = useState(false);
  const cleanCode = (code || 'US').toUpperCase().trim();
  const lowerCode = cleanCode.toLowerCase();

  const px = PIXEL_SIZES[size] || PIXEL_SIZES.sm;
  const isCircle = variant === 'circle';

  const circleUrl = `https://hatscripts.github.io/circle-flags/flags/${lowerCode}.svg`;
  const flagCdnUrl = `https://flagcdn.com/w40/${lowerCode}.png`;

  const flagWidth = isCircle ? px : Math.round(px * 1.3);
  const flagHeight = px;

  const renderFlag = () => (
    <span
      style={{
        width: `${flagWidth}px`,
        height: `${flagHeight}px`,
        minWidth: `${flagWidth}px`,
        maxWidth: `${flagWidth}px`,
        minHeight: `${flagHeight}px`,
        maxHeight: `${flagHeight}px`,
        borderRadius: isCircle ? '50%' : '3px'
      }}
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-xs border border-white/20 bg-black/40 ${className}`}
      title={name || cleanCode}
    >
      {!imgError ? (
        <img
          src={isCircle ? circleUrl : flagCdnUrl}
          alt={name || cleanCode}
          style={{
            width: `${flagWidth}px`,
            height: `${flagHeight}px`,
            maxWidth: `${flagWidth}px`,
            maxHeight: `${flagHeight}px`
          }}
          className={`block object-cover ${isCircle ? 'rounded-full' : 'rounded-[2px]'}`}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : INLINE_FLAGS[cleanCode] ? (
        <span style={{ width: `${flagWidth}px`, height: `${flagHeight}px` }} className="flex items-center justify-center overflow-hidden">
          {INLINE_FLAGS[cleanCode]}
        </span>
      ) : (
        <span className="font-mono font-bold text-[8px] text-white flex items-center justify-center">
          {cleanCode}
        </span>
      )}
    </span>
  );

  if (!showName && !showCode) {
    return renderFlag();
  }

  return (
    <span className="inline-flex items-center gap-1.5 shrink-0" title={name || cleanCode}>
      {renderFlag()}
      {showCode && <span className="font-mono font-bold text-[11px] uppercase text-gs-muted">{cleanCode}</span>}
      {showName && <span className="font-sans text-xs text-gs-light font-medium truncate">{name}</span>}
    </span>
  );
}
