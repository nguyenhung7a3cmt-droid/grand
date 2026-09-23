import React, { useEffect, useState } from 'react';

export default function AmbientGlowCanvas() {
  const [pos, setPos] = useState({ x: -500, y: -500 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!isHovered) setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isHovered]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-opacity duration-700" style={{ opacity: isHovered ? 1 : 0 }}>
      {/* Dynamic Cursor Spotlight Radial Gradient */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-20 transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pos.x - 300}px, ${pos.y - 300}px)`,
          background: 'radial-gradient(circle, rgba(238,29,54,0.35) 0%, rgba(124,58,237,0.15) 50%, transparent 70%)'
        }}
      />
    </div>
  );
}
