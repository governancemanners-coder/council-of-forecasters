import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Actor } from '@/engine';
import { ACTORS, BLOC_COLORS, influenceEdges } from '@/engine';

export interface ActiveEdge {
  /** Influencer node index. */
  from: number;
  /** Influenced node index. */
  to: number;
  /** Unique key — changing it replays the pulse. */
  key: string;
}

/**
 * Compact influence mini-graph — 12 nodes on a ring, edges ≥ 0.4.
 * When a cascade update occurs, the active edge pulses teal
 * (opacity 0→0.8→0, 0.6s) in the direction of influence and the
 * receiving node flashes. Node click opens the actor's drawer.
 */
export default function InfluenceGraph({
  activeEdge,
  onNodeClick,
  size = 260,
}: {
  activeEdge: ActiveEdge | null;
  onNodeClick: (actor: Actor) => void;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 34;

  const nodes = useMemo(
    () =>
      ACTORS.map((actor, i) => {
        const ang = -Math.PI / 2 + (i * Math.PI) / 6;
        return {
          actor,
          i,
          x: cx + r * Math.cos(ang),
          y: cy + r * Math.sin(ang),
        };
      }),
    [cx, cy, r],
  );

  const edges = useMemo(() => influenceEdges(0.4), []);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto block w-full max-w-[260px] select-none"
      role="img"
      aria-label="Influence network — twelve seats on a ring"
    >
      {/* base edges */}
      {edges.map(([to, from, w]) => (
        <line
          key={`${from}-${to}`}
          x1={nodes[from].x}
          y1={nodes[from].y}
          x2={nodes[to].x}
          y2={nodes[to].y}
          stroke="#D4D2CB"
          strokeWidth={w * 2.4}
          strokeOpacity={0.8}
        />
      ))}

      {/* active cascade pulse */}
      {activeEdge && (
        <motion.line
          key={activeEdge.key}
          x1={nodes[activeEdge.from].x}
          y1={nodes[activeEdge.from].y}
          x2={nodes[activeEdge.to].x}
          y2={nodes[activeEdge.to].y}
          stroke="#0F766E"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      )}

      {/* nodes */}
      {nodes.map(({ actor, i, x, y }) => {
        const isReceiver = activeEdge?.to === i;
        return (
          <g
            key={actor.id}
            onClick={() => onNodeClick(actor)}
            className="cursor-pointer"
            role="button"
            aria-label={`Open ${actor.name} detail`}
          >
            {isReceiver && (
              <motion.circle
                key={`flash-${activeEdge.key}`}
                cx={x}
                cy={y}
                r={15}
                fill="none"
                stroke="#0F766E"
                strokeWidth={2}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0] }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={12}
              fill="#FFFFFF"
              stroke={BLOC_COLORS[actor.id]}
              strokeWidth={1.5}
              className="transition-transform duration-150 hover:scale-110"
              style={{ transformOrigin: `${x}px ${y}px` }}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="'IBM Plex Mono', ui-monospace, monospace"
              fontSize={7.5}
              fontWeight={500}
              fill="#3F444A"
              pointerEvents="none"
            >
              {actor.monogram}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
