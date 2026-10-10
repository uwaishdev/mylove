import React, { useMemo } from 'react';

export const FloatingHearts: React.FC = () => {
  // Generate random particles
  const particles = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${(i * 5.5 + 4) % 96}%`,
      delay: `${(i * 0.7) % 7}s`,
      duration: `${10 + (i % 8) * 1.5}s`,
      size: 10 + (i % 4) * 6,
      opacity: 0.15 + (i % 5) * 0.08,
      type: i % 3 === 0 ? 'heart' : 'sparkle'
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Central Heartbeat Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] md:w-[540px] h-[340px] md:h-[540px] rounded-full bg-[#ff007f]/10 blur-[100px] animate-heartbeat" />

      {/* Subtle Ambient Heart Silhouette in the backdrop */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 md:w-96 h-64 md:h-96 text-[#ff007f]/5 animate-heartbeat fill-current filter drop-shadow-[0_0_30px_rgba(255,0,127,0.15)]"
        viewBox="0 0 24 24"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>

      {/* Floating upward elements */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="floating-particle text-[#ff007f]"
          style={{
            left: p.left,
            bottom: '-20px',
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: p.opacity
          }}
        >
          {p.type === 'heart' ? (
            <svg
              width={p.size}
              height={p.size}
              viewBox="0 0 24 24"
              fill="currentColor"
              className="drop-shadow-[0_0_8px_rgba(255,0,127,0.6)]"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <div
              className="rounded-full bg-[#ff007f] shadow-[0_0_10px_#ff007f]"
              style={{ width: p.size / 2, height: p.size / 2 }}
            />
          )}
        </div>
      ))}
    </div>
  );
};
