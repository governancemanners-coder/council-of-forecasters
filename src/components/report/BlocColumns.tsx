import { motion } from 'framer-motion';
import type { ForecastResult } from '@/engine';
import { ACTOR_BY_ID } from '@/engine';
import PersonaAvatar from '@/components/sim/PersonaAvatar';
import { cn } from '@/lib/utils';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v).toFixed(2)}`;

interface ColumnDef {
  title: string;
  headerClass: string;
  chipClass: string;
  empty: string;
}

const COLUMNS: ColumnDef[] = [
  {
    title: 'Allies',
    headerClass: 'bg-support-wash text-support',
    chipClass: 'border-support/40 text-support',
    empty: 'No seat is leaning in yet.',
  },
  {
    title: 'The Persuadable Middle',
    headerClass: 'bg-persuade-wash text-persuade',
    chipClass: 'border-persuade/40 text-persuade',
    empty: 'No undecided seats — the room has made up its mind.',
  },
  {
    title: 'The Bloc',
    headerClass: 'bg-oppose-wash text-oppose',
    chipClass: 'border-oppose/40 text-oppose',
    empty: 'No seat is dug in against this move.',
  },
];

/**
 * Section 2 — The blocs: three columns (Allies / Persuadable Middle / The
 * Bloc) with compact actor cards. Persuadable cards carry an italic flip
 * condition and a subtle border pulse until first hover.
 */
export default function BlocColumns({ forecast }: { forecast: ForecastResult }) {
  const lists = [forecast.allies, forecast.middle, forecast.bloc] as const;

  return (
    <section aria-label="The blocs" className="mt-16">
      <style>{`
        @keyframes middle-pulse {
          0%, 100% { border-left-color: rgba(180, 83, 9, 0.3); }
          50% { border-left-color: rgba(180, 83, 9, 0.6); }
        }
        @media (prefers-reduced-motion: reduce) {
          .middle-pulse-off { animation: none !important; }
        }
      `}</style>
      <h2 className="font-display text-[34px] font-medium leading-10 tracking-[-0.01em] text-ink">
        Where the twelve seats landed.
      </h2>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {COLUMNS.map((col, ci) => {
          const entries = lists[ci];
          return (
            <motion.div
              key={col.title}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-paper-soft"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: ci * 0.12, ease: EASE }}
            >
              <div className={cn('flex items-center justify-between px-5 py-3.5', col.headerClass)}>
                <h3 className="font-display text-lg font-medium">{col.title}</h3>
                <span className={cn('mono-label rounded-full border px-2 py-0.5 text-[11px]', col.chipClass)}>
                  {entries.length} {entries.length === 1 ? 'SEAT' : 'SEATS'}
                </span>
              </div>
              <ul className="divide-y divide-gray-200">
                {entries.length === 0 && (
                  <li className="px-5 py-6 text-sm italic text-gray-500">{col.empty}</li>
                )}
                {entries.map((entry, i) => {
                  const actor = ACTOR_BY_ID[entry.actorId];
                  const isMiddle = ci === 1;
                  const flipCondition = isMiddle && 'flipCondition' in entry ? entry.flipCondition : null;
                  const reason = 'reason' in entry ? entry.reason : null;
                  return (
                    <motion.li
                      key={entry.actorId}
                      className={cn(
                        'group flex items-start gap-3 px-5 py-4',
                        isMiddle &&
                          'middle-pulse-off border-l-2 border-l-persuade/40 transition-colors [animation:middle-pulse_3s_ease-in-out_infinite] hover:[animation:none]',
                      )}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.4, delay: ci * 0.12 + i * 0.05, ease: EASE }}
                    >
                      <PersonaAvatar actor={actor} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-ink">{actor.shortName}</p>
                          <span
                            className={cn(
                              'mono-data shrink-0 tabular-nums text-[13px]',
                              entry.stance > 0 ? 'text-support' : entry.stance < 0 ? 'text-oppose' : 'text-gray-500',
                            )}
                          >
                            {signed(entry.stance)}
                          </span>
                        </div>
                        {reason && <p className="mt-0.5 text-[13px] leading-5 text-ink-soft">{reason}.</p>}
                        {flipCondition && (
                          <p className="mt-1.5 font-display text-[14px] italic leading-5 text-persuade">
                            Flips if: {flipCondition}
                          </p>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
