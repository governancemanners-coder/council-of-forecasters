import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion';
import { EASE } from '@/components/methodology/ease';
import { cn } from '@/lib/utils';

/** Section heading block: mono index + H2 + optional intro body. */
export function SectionHead({
  index,
  eyebrow,
  title,
  children,
  eyebrowClass,
}: {
  index: string;
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  eyebrowClass?: string;
}) {
  return (
    <div>
      <p className={cn('mono-label text-gray-500', eyebrowClass)}>
        {index}
        {eyebrow ? ` — ${eyebrow}` : ''}
      </p>
      <h2 className="mt-3 font-display text-[34px] font-medium leading-10 tracking-[-0.01em] text-ink">
        {title}
      </h2>
      {children && <div className="mt-4 space-y-4 text-base leading-[26px] text-ink-soft">{children}</div>}
    </div>
  );
}

/** Formula block: centered mono on paper-deep, clips in on view. */
export function FormulaBlock({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="mt-6 rounded-xl bg-paper-deep px-6 py-6 text-center font-mono text-[15px] leading-7 text-ink md:text-lg"
      initial={{ clipPath: 'inset(0 100% 0 0)' }}
      whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Fade-rise whileInView wrapper. */
export function Reveal({
  children,
  delay = 0,
  y = 20,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Number that tweens to `value` (duration s) once scrolled into view. */
export function TweenNumber({
  value,
  decimals = 2,
  duration = 0.6,
  className,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => v.toFixed(decimals));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, { duration, ease: EASE });
    return () => controls.stop();
  }, [inView, value, duration, mv]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      <motion.span>{text}</motion.span>
    </span>
  );
}
