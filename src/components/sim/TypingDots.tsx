import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * 3-dot typing indicator (teal, 0.6s loop) shown before a bubble rises in.
 */
export default function TypingDots({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-[18px] rounded-tl-[4px] border border-gray-200 bg-surface px-3 py-2.5',
        className,
      )}
      aria-label="typing"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-council"
          animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
