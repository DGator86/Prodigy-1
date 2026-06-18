interface TrendLineProps {
  scores: number[];
  width?: number;
  height?: number;
  color?: string;
}

export default function TrendLine({
  scores,
  width = 120,
  height = 32,
  color = '#f97316',
}: TrendLineProps) {
  if (scores.length < 2) return null;

  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const points = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * width;
    const y = height - ((s - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const polyline = points.join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
      {/* Last point dot */}
      {points.length > 0 && (() => {
        const last = points[points.length - 1].split(',');
        return (
          <circle
            cx={parseFloat(last[0])}
            cy={parseFloat(last[1])}
            r={2.5}
            fill={color}
          />
        );
      })()}
    </svg>
  );
}
