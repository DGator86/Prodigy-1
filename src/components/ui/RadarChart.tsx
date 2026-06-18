'use client';

interface RadarAxis {
  label: string;
  value: number; // 0-1000
}

interface RadarChartProps {
  current: RadarAxis[];
  average?: RadarAxis[];
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

const SIZE = 260;
const cx = SIZE / 2;
const cy = SIZE / 2;
const r = SIZE * 0.34;
const LABEL_R = SIZE * 0.46;
const max = 1000;
const rings = [250, 500, 750, 1000];

export default function RadarChart({ current, average }: RadarChartProps) {
  const n = current.length;

  const spokePoints = current.map((_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return polarToCartesian(cx, cy, r, angle);
  });

  const labelPoints = current.map((_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return polarToCartesian(cx, cy, LABEL_R, angle);
  });

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ width: '100%', maxWidth: SIZE, height: 'auto', display: 'block' }}
    >
      {/* Rings */}
      {rings.map((ring) => {
        const rr = (ring / max) * r;
        const pts = Array.from({ length: n }, (_, i) => {
          const angle = (2 * Math.PI * i) / n;
          return polarToCartesian(cx, cy, rr, angle);
        });
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
        return <path key={ring} d={d} fill="none" stroke="#1f2937" strokeWidth="1" />;
      })}

      {/* Spokes */}
      {spokePoints.map((pt, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#1f2937" strokeWidth="1" />
      ))}

      {/* Average polygon */}
      {average && (
        <path
          d={buildPath(cx, cy, r, average.map((a) => a.value), max)}
          fill="rgba(249,115,22,0.08)"
          stroke="rgba(249,115,22,0.35)"
          strokeWidth="1.5"
          strokeDasharray="5 3"
        />
      )}

      {/* Current polygon */}
      <path
        d={buildPath(cx, cy, r, current.map((a) => a.value), max)}
        fill="rgba(249,115,22,0.18)"
        stroke="rgb(249,115,22)"
        strokeWidth="2"
      />

      {/* Dots */}
      {current.map((a, i) => {
        const angle = (2 * Math.PI * i) / n;
        const pt = polarToCartesian(cx, cy, (a.value / max) * r, angle);
        return <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="rgb(249,115,22)" />;
      })}

      {/* Labels */}
      {current.map((a, i) => {
        const pt = labelPoints[i];
        return (
          <g key={i}>
            <text
              x={pt.x}
              y={pt.y - 5}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#9ca3af"
              fontSize="9"
              fontWeight="700"
              letterSpacing="0.5"
            >
              {a.label.toUpperCase()}
            </text>
            <text
              x={pt.x}
              y={pt.y + 7}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#f97316"
              fontSize="9"
              fontWeight="600"
            >
              {a.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
