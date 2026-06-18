'use client';

interface RadarAxis {
  label: string;
  value: number; // 0-1000
}

interface RadarChartProps {
  current: RadarAxis[];
  average?: RadarAxis[];
  size?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.sin(angleRad),
    y: cy - r * Math.cos(angleRad),
  };
}

function buildPath(cx: number, cy: number, r: number, values: number[], max: number): string {
  const n = values.length;
  const points = values.map((v, i) => {
    const angle = (2 * Math.PI * i) / n;
    const radius = (v / max) * r;
    return polarToCartesian(cx, cy, radius, angle);
  });
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
}

export default function RadarChart({ current, average, size = 220 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const n = current.length;
  const max = 1000;
  const rings = [200, 400, 600, 800, 1000];

  const spokePoints = current.map((_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return polarToCartesian(cx, cy, r, angle);
  });

  const labelPoints = current.map((_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return polarToCartesian(cx, cy, r * 1.2, angle);
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Rings */}
      {rings.map((ring) => {
        const rr = (ring / max) * r;
        const ringPoints = Array.from({ length: n }, (_, i) => {
          const angle = (2 * Math.PI * i) / n;
          return polarToCartesian(cx, cy, rr, angle);
        });
        const d = ringPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
        return <path key={ring} d={d} fill="none" stroke="#374151" strokeWidth="1" />;
      })}

      {/* Spokes */}
      {spokePoints.map((pt, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#374151" strokeWidth="1" />
      ))}

      {/* Average polygon */}
      {average && (
        <path
          d={buildPath(cx, cy, r, average.map((a) => a.value), max)}
          fill="rgba(249,115,22,0.1)"
          stroke="rgba(249,115,22,0.4)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      )}

      {/* Current polygon */}
      <path
        d={buildPath(cx, cy, r, current.map((a) => a.value), max)}
        fill="rgba(249,115,22,0.2)"
        stroke="rgb(249,115,22)"
        strokeWidth="2"
      />

      {/* Dots on current */}
      {current.map((a, i) => {
        const angle = (2 * Math.PI * i) / n;
        const pt = polarToCartesian(cx, cy, (a.value / max) * r, angle);
        return <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="rgb(249,115,22)" />;
      })}

      {/* Labels */}
      {current.map((a, i) => {
        const pt = labelPoints[i];
        return (
          <text
            key={i}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#9ca3af"
            fontSize="10"
            fontWeight="600"
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}
