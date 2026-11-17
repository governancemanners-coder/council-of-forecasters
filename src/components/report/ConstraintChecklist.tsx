import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { Check, TriangleAlert, X } from 'lucide-react';
import type { ConstraintCheck } from '@/engine';
import { cn } from '@/lib/utils';

const STATUS_META = {
  clear: {
    icon: Check,
    label: 'CLEAR',
    iconClass: 'bg-council-wash text-council',
    textClass: 'text-council',
  },
  'at-risk': {
    icon: TriangleAlert,
    label: 'AT RISK',
    iconClass: 'bg-persuade-wash text-persuade',
    textClass: 'text-persuade',
  },
  violated: {
    icon: X,
    label: 'VIOLATED',
    iconClass: 'bg-[#FBEBEB] text-veto',
    textClass: 'text-veto',
  },
} as const;

/**
 * Section 5 — Constraint checklist: one row per legal/UN framework with
 * CLEAR / AT RISK / VIOLATED status. Rows gavel-stamp in; a violated row's
 * icon draws a red circle stroke around itself.
 */
export default function ConstraintChecklist({ checks }: { checks: ConstraintCheck[] }) {
  return (
    <section aria-label="Constraint checklist" className="mt-16">
      <h2 className="font-display text-[34px] font-medium leading-10 tracking-[-0.01em] text-ink">
        The five frameworks.
      </h2>
      <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-paper-soft">
        <ul className="divide-y divide-gray-200">
          {checks.map((c, i) => {
            const meta = STATUS_META[c.status];
            const Icon = meta.icon;
            return (
              <motion.li
                key={c.short}
                className={cn(
                  'flex items-start gap-4 px-6 py-5 max-md:px-5',
                  c.status === 'violated' && 'border-l-2 border-l-veto bg-[#FBEBEB]/40',
                )}
                initial={{ scale: 1.08, y: -2, opacity: 0 }}
                whileInView={{ scale: 1, y: 0, opacity: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.25, delay: i * 0.1, ease: 'easeIn' }}
              >
                <span className={cn('relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', meta.iconClass)}>
                  <Icon size={17} strokeWidth={2.4} />
                  {c.status === 'violated' && (
                    <svg
                      className="absolute -inset-1 h-11 w-11"
                      viewBox="0 0 44 44"
                      fill="none"
                      aria-hidden
                    >
                      <motion.circle
                        cx="22"
                        cy="22"
                        r="20"
                        stroke="#B91C1C"
                        strokeWidth="2"
                        pathLength={1}
                        strokeDasharray={1}
                        initial={{ strokeDashoffset: 1 }}
                        whileInView={{ strokeDashoffset: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: 'easeInOut' }}
                      />
                    </svg>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="font-display text-lg font-medium leading-6 text-ink">
                      {c.framework}
                    </h3>
                    <span className={cn('mono-label text-[11px]', meta.textClass)}>{meta.label}</span>
                  </div>
                  <p className="mt-1 text-sm leading-[22px] text-ink-soft">{c.basis}</p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
      <p className="mt-4 text-[13px] leading-5 text-gray-500">
        Checklist reflects the simplified rules encoded in this simulation. Real decisions need
        real counsel —{' '}
        <Link to="/methodology#legal" className="text-council underline-offset-4 hover:underline">
          see Methodology
        </Link>
        .
      </p>
    </section>
  );
}
