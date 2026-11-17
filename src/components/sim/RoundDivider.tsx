import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Full-width chat divider: hairline + centered mono label
 * (`ROUND 02 — INFLUENCE CASCADE`) with a gavel-stamp entrance
 * (scale 1.15→1, 2px y-drop, opacity snap, 0.25s easeIn).
 */
export default function RoundDivider({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <motion.div
      className={cn('relative my-6 flex items-center justify-center', className)}
      initial={{ scale: 1.15, y: -2, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeIn' }}
    >
      <div className="absolute inset-x-0 top-1/2 h-px bg-gray-300" aria-hidden />
      <span className="mono-label relative z-10 rounded-full border border-gray-300 bg-surface px-3 py-1 text-gray-500">
        {label}
      </span>
    </motion.div>
  );
}
