import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ACTORS, ACTOR_INDEX, influenceEdges } from '@/engine';
import type { ActorId } from '@/engine';
import PersonaAvatar from '@/components/sim/PersonaAvatar';
import { cn } from '@/lib/utils';

/**
 * Influence network diagram — 12 seats on a ring, node size ∝ influence,
 * directed edges = influence-matrix weights ≥ 0.4 (arrow points at the
 * influenced seat). Center badge: YOU — THE SEED.
 *
 * Hovering a seat lights its edges teal and fades the rest to 15%; the
 * highlight is shared with the matrix table via `highlightSeat`.
 */

interface Pt {
  x: number;
  y: number;
}

/** Mutual strong ties rendered 2px teal at 50% (design/council.md §2). */
const STRONG_TIES = new Set<string>([
  'chf>chft',
  'chft>chf',
  'advocacy>ward',
  'cmhc>city',
]);

const GRAY_EDGE = '#D4D2CB';
const TEAL = '#0F766E';

export default function InfluenceNetwork({
  highlightSeat,
  onHighlight,
}: {
  /** Seat number (1–12) currently highlighted, shared with the matrix. */
  highlightSeat: number | null;
  onHighlight: (seat: number | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Pt>({ x: 1000, y: 480 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      if (r.width > 0 && r.height > 0) setSize({ x: r.width, y: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const w = size.x;
  const h = size.y;
  const cx = w / 2;
  const cy = h / 2;
  const compact = w < 640;
  const rx = Math.max(cx - (compact ? 56 : 120), 100);
  const ry = Math.max(cy - (compact ? 64 : 96), 100);

  /** Seat positions on the ring, ordered by seat number, seat 01 at top. */
  const nodes = useMemo(
    () =>
      ACTORS.map((actor, i) => {
        const ang = -Math.PI / 2 + (i * Math.PI) / 6;
        const scale = compact ? 0.78 : 1;
        const d = (30 + actor.influence * 24) * scale;
        return {
          actor,
          x: cx + rx * Math.cos(ang),
          y: cy + ry * Math.sin(ang),
          d,
        };
      }),
    [cx, cy, rx, ry, compact],
  );

  const edges = useMemo(() => {
    return influenceEdges(0.4).map(([influencedIdx, influencerIdx, weight]) => {
      const a = nodes[influencerIdx]; // source (influencer)
      const b = nodes[influencedIdx]; // target (influenced)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      // control point bowed toward the center so direction reads clearly
      const ctrl = { x: mid.x + (cx - mid.x) * 0.32, y: mid.y + (cy - mid.y) * 0.32 };
      const trim = (p: Pt, toward: Pt, dist: number): Pt => {
        const dx = toward.x - p.x;
        const dy = toward.y - p.y;
        const len = Math.hypot(dx, dy) || 1;
        return { x: p.x + (dx / len) * dist, y: p.y + (dy / len) * dist };
      };
      const start = trim(a, ctrl, a.d / 2 + 3);
      // end tangent of a quadratic bezier runs control → target
      const end = trim(b, ctrl, b.d / 2 + 9);
      const tip = trim(b, ctrl, b.d / 2 + 3);
      const tx = tip.x - ctrl.x;
      const ty = tip.y - ctrl.y;
      const tl = Math.hypot(tx, ty) || 1;
      const ux = tx / tl;
      const uy = ty / tl;
      const arrow = `M ${tip.x} ${tip.y} L ${tip.x - ux * 7 - uy * 3.2} ${tip.y - uy * 7 + ux * 3.2} L ${tip.x - ux * 7 + uy * 3.2} ${tip.y - uy * 7 - ux * 3.2} Z`;
      const from = a.actor.id as ActorId;
      const to = b.actor.id as ActorId;
      return {
        key: `${from}>${to}`,
        from,
        to,
        fromSeat: a.actor.seat,
        toSeat: b.actor.seat,
        weight,
        strong: STRONG_TIES.has(`${from}>${to}`),
        d: `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`,
        arrow,
      };
    });
  }, [nodes, cx, cy]);

  const hotActor = highlightSeat ? ACTORS[highlightSeat - 1] : null;
  const hotNode = hotActor ? nodes[ACTOR_INDEX[hotActor.id]] : null;

  return (
    <div className="relative">
      <div ref={ref} className="relative h-[480px] w-full overflow-hidden rounded-xl">
        {/* edges */}
        <svg
          className="absolute inset-0 h-full w-full"
          style={{ pointerEvents: 'none' }}
          aria-hidden
        >
          {edges.map((e, i) => {
            const lit =
              highlightSeat !== null &&
              (e.fromSeat === highlightSeat || e.toSeat === highlightSeat);
            const dim = highlightSeat !== null && !lit;
            const stroke = lit ? TEAL : e.strong ? TEAL : GRAY_EDGE;
            return (
              <g
                key={e.key}
                style={{
                  opacity: dim ? 0.15 : lit ? 1 : e.strong ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <motion.path
                  d={e.d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={e.strong ? 2 : 1}
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: 0.5 + i * 0.03, duration: 0.5, ease: 'easeOut' }}
                />
                <motion.path
                  d={e.arrow}
                  fill={stroke}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: 0.9 + i * 0.03, duration: 0.3 }}
                />
              </g>
            );
          })}
        </svg>

        {/* center badge */}
        <motion.div
          className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 160, damping: 18 }}
        >
          <div className="rounded-full bg-council px-4 py-2 shadow-paper-soft ring-4 ring-council-wash">
            <span className="mono-label text-[10px] text-white">You — the seed</span>
          </div>
        </motion.div>

        {/* nodes */}
        {nodes.map((n, i) => {
          const lit = highlightSeat === n.actor.seat;
          return (
            <motion.div
              key={n.actor.id}
              className="absolute z-10 cursor-pointer"
              style={{ left: n.x, top: n.y, x: '-50%', y: '-50%' }}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 160, damping: 20 }}
              onMouseEnter={() => onHighlight(n.actor.seat)}
              onMouseLeave={() => onHighlight(null)}
            >
              <div
                className={cn(
                  'rounded-xl transition-shadow duration-200',
                  lit && 'shadow-[0_0_0_3px_#E6F4F1,0_0_0_5px_#0F766E]',
                )}
              >
                <PersonaAvatar actor={n.actor} size={Math.round(n.d)} />
              </div>
              {!compact && (
                <div className="mt-1.5 w-max max-w-[110px] -translate-x-1/2 relative left-1/2 text-center">
                  <span
                    className={cn(
                      'text-[11px] font-medium leading-[14px] transition-colors',
                      lit ? 'text-council' : 'text-ink-soft',
                    )}
                  >
                    {n.actor.shortName}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* hover tooltip */}
        {hotNode && hotActor && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-lg border border-gray-200 bg-surface px-3 py-2 shadow-paper-soft"
            style={{
              left: hotNode.x,
              top: hotNode.y - hotNode.d / 2 - 12,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="mono-label text-[9px] text-gray-500">
              Seat {String(hotActor.seat).padStart(2, '0')}
            </div>
            <div className="mt-0.5 whitespace-nowrap text-[13px] font-semibold text-ink">
              {hotActor.shortName}
            </div>
            <div className="mono-data mt-1 whitespace-nowrap text-[11px] text-council">
              INFLUENCE {hotActor.influence.toFixed(1)} · SALIENCE {hotActor.salience.toFixed(1)} ·
              CASCADE λ {hotActor.lambda.toFixed(1)}
            </div>
          </div>
        )}
      </div>

      {/* legend + caption */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-gray-200 pt-4">
        <span className="mono-label text-[10px] text-gray-500">
          Edge = who moves whom · Size = influence
        </span>
        <p className="max-w-[420px] text-right text-[13px] leading-5 text-ink-soft max-md:text-left">
          During a run, stances travel along these edges each round. Legal Counsel has no incoming
          edges — law is law.
        </p>
      </div>
    </div>
  );
}
