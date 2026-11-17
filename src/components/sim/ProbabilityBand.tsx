import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ZONES: Array<{ from: number; to: number; color: string }> = [
  { from: 0, to: 25, color: '#B91C1C' }, // veto red
  { from: 25, to: 40, color: '#C2410C' }, // brick
  { from: 40, to: 55, color: '#B45309' }, // amber
  { from: 55, to: 70, color: '#0F766E' }, // teal
  { from: 70, to: 85, color: '#115E59' }, // deep teal
];

/**
 * Horizontal gauge 0–100% with gradient verdict zones
 * (veto red <25, brick 25–40, amber 40–55, teal 55–70, deep teal 70–85),
 * marker with animated width/position, mono % label.
 */
export default function ProbabilityBand({
  probability,
  band,
  showZoneLabels = true,
  animate = true,
  className,
}: {
  /** Point probability 0–100. */
  probability: number;
  /** Band range to shade, e.g. [55, 70]. */
  band?: [number, number];
  showZoneLabels?: boolean;
  animate?: boolean;
  className?: string;
}) {
  const p = Math.max(0, Math.min(100, probability));

  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200">
        {ZONES.map((z) => (
          <div
            key={z.from}
            className="absolute top-0 h-full"
            style={{
              left: `${z.from}%`,
              width: `${z.to - z.from}%`,
              background: z.color,
              opacity: 0.22,
            }}
          />
        ))}
        {band && (
          <motion.div
            className="absolute top-0 h-full rounded-full"
            style={{
              left: `${band[0]}%`,
              background: 'rgba(15,118,110,0.35)',
            }}
            initial={animate ? { width: 0 } : false}
            animate={{ width: `${band[1] - band[0]}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
        {/* marker */}
        <motion.div
          className="absolute top-[-3px] h-[22px] w-[3px] rounded-full bg-ink"
          initial={animate ? { left: '0%' } : false}
          animate={{ left: `calc(${p}% - 1.5px)` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      {showZoneLabels && (
        <div className="mono-label mt-1.5 flex justify-between text-[10px] text-gray-500">
          {[0, 25, 40, 55, 70, 85].map((n) => (
            <span key={n}>{n}</span>
          ))}
          <span>100</span>
        </div>
      )}
      <div className="mono-data mt-1 tabular-nums text-ink">
        {p}
        <span className="text-gray-500">% SUCCESS PROBABILITY</span>
      </div>
    </div>
  );
}
