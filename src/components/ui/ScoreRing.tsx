interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  color?: string;
}

export default function ScoreRing({
  score,
  size = 80,
  strokeWidth = 6,
  label,
  color,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score / 1000, 0), 1);
  const offset = circumference * (1 - pct);

  // Color based on score if not provided
  const strokeColor =
    color ??
    (score >= 975
      ? '#c084fc'
      : score >= 925
        ? '#facc15'
        : score >= 850
          ? '#fb923c'
          : score >= 750
            ? '#f87171'
            : score >= 600
              ? '#60a5fa'
              : score >= 400
                ? '#4ade80'
                : score >= 200
                  ? '#2dd4bf'
                  : '#6b7280');

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1f2937"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            transform: 'rotate(90deg)',
            transformOrigin: `${size / 2}px ${size / 2}px`,
            fill: strokeColor,
            fontSize: size * 0.22,
            fontWeight: 700,
          }}
        >
          {score}
        </text>
      </svg>
      {label && <span className="text-gray-500 text-xs">{label}</span>}
    </div>
  );
}
