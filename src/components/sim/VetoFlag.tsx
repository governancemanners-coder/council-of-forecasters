import { motion } from 'framer-motion';
import { Gavel } from 'lucide-react';
import type { VetoInfo } from '@/engine';
import { cn } from '@/lib/utils';

/**
 * Red-bordered card injected into the chat feed when a hard constraint fires.
 * Gavel icon, "HARD CONSTRAINT — [statute]", quoted clause summary,
 * "forecast capped" note. Never heavy shadow — 2px veto border.
 */
export default function VetoFlag({
  veto,
  animate = true,
  className,
}: {
  veto: VetoInfo;
  animate?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      className={cn('rounded-xl border-2 border-veto bg-surface p-4', className)}
      initial={animate ? { scale: 1.15, y: -2, opacity: 0, x: 0 } : false}
      animate={
        animate
          ? { scale: 1, y: 0, opacity: 1, x: [0, -3, 3, -2, 2, 0] }
          : undefined
      }
      transition={
        animate
          ? {
              scale: { duration: 0.25, ease: 'easeIn' },
              y: { duration: 0.25, ease: 'easeIn' },
              opacity: { duration: 0.25, ease: 'easeIn' },
              x: { duration: 0.2, delay: 0.25 },
            }
          : undefined
      }
      role="alert"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-veto text-surface">
          <Gavel size={15} strokeWidth={2.2} />
        </span>
        <span className="mono-label text-veto">HARD CONSTRAINT — {veto.statute}</span>
      </div>
      <p className="mt-2 font-display text-[15px] italic leading-6 text-ink-soft">
        “{veto.clause}”
      </p>
      <p className="mono-label mt-3 border-t border-[#F0D2D2] pt-2 text-veto">
        FORECAST CEILING: BLOCKED UNTIL CURED
      </p>
    </motion.div>
  );
}
