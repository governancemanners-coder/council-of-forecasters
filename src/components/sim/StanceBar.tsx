import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Diverging horizontal bar, center 0, range −1..+1.
 * Track gray-200; fill colored by sign (support/oppose); value label mono 12px
 * at the fill end. Spring-animates on round change. Height 8px, radius 999.
 */
export default function StanceBar({
  value,
  showLabel = true,
  className,
}: {
  /** Stance in −1..+1. */
  value: number;
  showLabel?: boolean;
  className?: string;
}) {
  const v = Math.max(-1, Math.min(1, value));
  const positive = v >= 0;
  const fill = Math.abs(v) / 2; // fraction of full track

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
        {/* center hairline */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gray-300" />
        <motion.div
          className={cn(
            'absolute top-0 h-full rounded-full',
            positive ? 'bg-support' : 'bg-oppose',
          )}
          style={{
            left: positive ? '50%' : undefined,
            right: positive ? undefined : '50%',
            width: '50%',
            transformOrigin: positive ? 'left center' : 'right center',
          }}
          initial={false}
          animate={{ scaleX: Math.max(fill * 2, 0.001) }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            'mono-label w-12 text-right tabular-nums',
            positive ? 'text-support' : 'text-oppose',
            Math.abs(v) < 0.005 && 'text-gray-500',
          )}
        >
          {v > 0 ? '+' : v < 0 ? '−' : '±'}
          {Math.abs(v).toFixed(2)}
        </span>
      )}
    </div>
  );
}
