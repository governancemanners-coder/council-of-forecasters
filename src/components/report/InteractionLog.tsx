import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import type { SimulationRun } from '@/engine';
import { ACTOR_BY_ID, deltaChip } from '@/engine';
import PersonaAvatar from '@/components/sim/PersonaAvatar';
import VetoFlag from '@/components/sim/VetoFlag';
import { cn } from '@/lib/utils';

/**
 * Section 6 — Interaction log (the record). Rounds as collapsible accordions
 * with EXPAND ALL / COLLAPSE ALL controls and a live keyword search that
 * filters messages by actor name or content.
 */
export default function InteractionLog({ run }: { run: SimulationRun }) {
  const [openRounds, setOpenRounds] = useState<number[]>([1]);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      run.rounds.map((round) => ({
        ...round,
        messages: q
          ? round.messages.filter((m) => {
              const actorName = m.actorId ? ACTOR_BY_ID[m.actorId].name.toLowerCase() : '';
              const short = m.actorId ? ACTOR_BY_ID[m.actorId].shortName.toLowerCase() : '';
              return (
                m.text.toLowerCase().includes(q) ||
                actorName.includes(q) ||
                short.includes(q) ||
                (m.tag?.toLowerCase().includes(q) ?? false)
              );
            })
          : round.messages,
      })),
    [run, q],
  );

  const toggleRound = (r: number) =>
    setOpenRounds((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  return (
    <section aria-label="The full record" className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-[34px] font-medium leading-10 tracking-[-0.01em] text-ink">
          The full record.
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpenRounds(run.rounds.map((r) => r.round))}
            className="mono-label rounded-full border border-gray-300 px-3 py-1.5 text-[11px] text-ink-soft transition-colors hover:border-council hover:text-council"
          >
            EXPAND ALL
          </button>
          <button
            type="button"
            onClick={() => setOpenRounds([])}
            className="mono-label rounded-full border border-gray-300 px-3 py-1.5 text-[11px] text-ink-soft transition-colors hover:border-council hover:text-council"
          >
            COLLAPSE ALL
          </button>
          <label className="flex items-center gap-2 rounded-full border border-gray-300 bg-surface px-3 py-1.5 focus-within:border-council">
            <Search size={14} className="text-gray-500" aria-hidden />
            <span className="sr-only">Search the record</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH ACTOR OR KEYWORD"
              className="mono-label w-44 bg-transparent text-[11px] text-ink placeholder:text-gray-500 focus:outline-none"
            />
          </label>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-paper-soft">
        {filtered.map((round) => {
          const open = openRounds.includes(round.round);
          return (
            <div key={round.round} className="border-b border-gray-200 last:border-b-0">
              <button
                type="button"
                onClick={() => toggleRound(round.round)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 bg-paper-deep/60 px-6 py-4 text-left transition-colors hover:bg-paper-deep max-md:px-4"
              >
                <span className="mono-label text-[12px] text-ink">
                  ROUND 0{round.round} — {round.name} · {round.messages.length}{' '}
                  {round.messages.length === 1 ? 'STATEMENT' : 'STATEMENTS'}
                  {q && (
                    <span className="ml-2 text-council">
                      {round.messages.length} MATCH{round.messages.length === 1 ? '' : 'ES'}
                    </span>
                  )}
                </span>
                <motion.span
                  className="mono-label shrink-0 text-[11px] text-gray-500"
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  aria-hidden
                >
                  ▾
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <ul className="divide-y divide-gray-200/70">
                      {round.messages.length === 0 && (
                        <li className="px-6 py-5 text-sm italic text-gray-500">
                          No statements match this search in round {round.round}.
                        </li>
                      )}
                      {round.messages.map((m) =>
                        m.kind === 'veto' && m.veto ? (
                          <li key={m.id} className="px-6 py-4 max-md:px-4">
                            <VetoFlag veto={m.veto} animate={false} />
                          </li>
                        ) : m.actorId ? (
                          <li
                            key={m.id}
                            className="flex items-start gap-3 px-6 py-3.5 transition-colors hover:bg-paper-deep max-md:px-4"
                          >
                            <PersonaAvatar actor={ACTOR_BY_ID[m.actorId]} size={24} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                                <span className="mono-label text-[11px] text-ink">
                                  {ACTOR_BY_ID[m.actorId].shortName}
                                </span>
                                {m.tag && (
                                  <span className="mono-label text-[10px] text-council">{m.tag}</span>
                                )}
                                {m.bucket && (
                                  <span
                                    className={cn(
                                      'mono-data ml-auto shrink-0 tabular-nums text-[12px]',
                                      m.bucket === 'support'
                                        ? 'text-support'
                                        : m.bucket === 'oppose'
                                          ? 'text-oppose'
                                          : 'text-gray-500',
                                    )}
                                  >
                                    {deltaChip(m.bucket, m.delta)}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 font-display text-[15px] italic leading-6 text-ink-soft">
                                “{m.text}”
                              </p>
                            </div>
                          </li>
                        ) : null,
                      )}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
