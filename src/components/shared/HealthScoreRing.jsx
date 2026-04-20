import { useEffect, useRef, useState } from 'react';

const RADIUS = 90;
const STROKE = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function HealthScoreRing({ score = 0, size = 220 }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [animated, setAnimated] = useState(false);
  const ringRef = useRef(null);

  useEffect(() => {
    // Count up the number
    const duration = 1500;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setAnimated(true);
  }, [score]);

  const offset = CIRCUMFERENCE - (displayScore / 100) * CIRCUMFERENCE;
  const targetOffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  const gradientId = 'scoreGradient';

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${RADIUS * 2 + STROKE * 2} ${RADIUS * 2 + STROKE * 2}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={RADIUS + STROKE}
          cy={RADIUS + STROKE}
          r={RADIUS}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* Score arc */}
        <circle
          ref={ringRef}
          cx={RADIUS + STROKE}
          cy={RADIUS + STROKE}
          r={RADIUS}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${RADIUS + STROKE} ${RADIUS + STROKE})`}
          style={{
            transition: 'stroke-dashoffset 0.05s linear',
          }}
        />

        {/* Score text */}
        <text
          x={RADIUS + STROKE}
          y={RADIUS + STROKE - 6}
          textAnchor="middle"
          className="font-bold"
          style={{
            fontSize: 42,
            fontWeight: 800,
            fill: '#111827',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {displayScore}
        </text>
        <text
          x={RADIUS + STROKE}
          y={RADIUS + STROKE + 18}
          textAnchor="middle"
          style={{
            fontSize: 13,
            fill: '#6B7280',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          out of 100
        </text>
      </svg>
    </div>
  );
}
