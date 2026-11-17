import { useMemo, useState } from 'react';
import { AXIS_ORDER } from '@/engine';
import type { Vector8 } from '@/engine';
import { cn } from '@/lib/utils';

/**
 * 8-axis octagon radar (SVG). Axes labeled with mono codes
 * (AFF, AUT, FND, INT, DEM, NME, RGT, CLM). Grid rings at −3/0/+3
 * (values are signed; −3 maps to center, +3 to the rim).
 * Actor polygon: teal fill 12% opacity, 1.5px teal stroke.
 */
export default function RadarChart({
  values,
  size = 280,
  highlightAxis,
  onAxisHover,
  className,
}: {
  /** Weights −3..+3 in AXIS_ORDER. */
  values: Vector8 | number[];
  size?: number;
  /** Axis code to spotlight (others fade to 30%). */
  highlightAxis?: string | null;
  onAxisHover?: (axis: string | null) => void;
  className?: string;
}) {
  const [internalHover, setInternalHover] = useState<string | null>(null);
  const active = highlightAxis !== undefined ? highlightAxis : internalHover;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 26;

  const point = (i: number, v: number): [number, number] => {
    const ang = -Math.PI / 2 + (i * Math.PI) / 4;
    const r = ((v + 3) / 6) * maxR;
    return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
  };

  const polygon = useMemo(
    () =>
      values
        .map((v, i) => point(i, v).map((n) => n.toFixed(1)).join(','))
        .join(' '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, size],
  );

  const ringPath = (v: number) =>
    AXIS_ORDER.map((_, i) => point(i, v).map((n) => n.toFixed(1)).join(',')).join(' ');

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('select-none', className)}
      role="img"
      aria-label="Preference radar over eight policy axes"
    >
      {/* grid rings: 0 (mid) and +3 (rim); −3 is the center point */}
      <polygon points={ringPath(0)} fill="none" stroke="#E7E5DE" strokeWidth={1} />
      <polygon points={ringPath(3)} fill="none" stroke="#D4D2CB" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={2} fill="#D4D2CB" />
      {/* spokes + labels */}
      {AXIS_ORDER.map((axis, i) => {
        const [x, y] = point(i, 3);
        const [lx, ly] = point(i, 3.75);
        const dim = active && active !== axis;
        const hot = active === axis;
        return (
          <g
            key={axis}
            opacity={dim ? 0.3 : 1}
            style={{ transition: 'opacity 0.2s' }}
            onMouseEnter={() => {
              setInternalHover(axis);
              onAxisHover?.(axis);
            }}
            onMouseLeave={() => {
              setInternalHover(null);
              onAxisHover?.(null);
            }}
          >
            <line
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={hot ? '#0F766E' : '#D4D2CB'}
              strokeWidth={hot ? 3 : 1}
              style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
            />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="'IBM Plex Mono', ui-monospace, monospace"
              fontSize={size < 200 ? 9 : 11}
              fontWeight={500}
              letterSpacing="0.08em"
              fill={hot ? '#0F766E' : '#6B7280'}
            >
              {axis}
            </text>
            {hot && <circle cx={lx} cy={ly + (size < 200 ? 9 : 12)} r={2.5} fill="#0F766E" />}
          </g>
        );
      })}
      {/* actor polygon */}
      <polygon
        points={polygon}
        fill="rgba(15,118,110,0.12)"
        stroke="#0F766E"
        strokeWidth={1.5}
        strokeLinejoin="round"
        style={{ transition: 'all 0.3s' }}
      />
    </svg>
  );
}
