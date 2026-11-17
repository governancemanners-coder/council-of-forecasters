import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import type { Actor, VetoInfo } from '@/engine';
import { ACTORS } from '@/engine';
import PersonaAvatar from '@/components/sim/PersonaAvatar';
import StanceBar from '@/components/sim/StanceBar';
import StatusChip from '@/components/sim/StatusChip';
import InfluenceGraph from './InfluenceGraph';
import type { ActiveEdge } from './InfluenceGraph';
import { cn } from '@/lib/utils';

type SortMode = 'stance' | 'influence' | 'seat';

const SORT_MODES: Array<{ key: SortMode; label: string }> = [
  { key: 'stance', label: 'STANCE' },
  { key: 'influence', label: 'INFLUENCE' },
  { key: 'seat', label: 'SEAT' },
];

/**
 * Pane 3 — STANCE BOARD. Twelve sortable stance rows (layout-animated
 * re-sort each round), influence mini-graph, coalition meter.
 */
export default function StanceBoard({
  stances,
  deltas,
  veto,
  preview,
  activeEdge,
  onActorClick,
}: {
  /** Visible stance per actor (seat order). */
  stances: number[];
  /** Delta vs. previous round per actor (0 = no move this round). */
  deltas: number[];
  veto: VetoInfo | null;
  /** True while showing the seeding-phase readiness preview. */
  preview: boolean;
  activeEdge: ActiveEdge | null;
  onActorClick: (actor: Actor) => void;
}) {
  const [sort, setSort] = useState<SortMode>('stance');

  const rows = useMemo(() => {
    const list = ACTORS.map((actor, i) => ({
      actor,
      i,
      stance: stances[i],
      delta: deltas[i],
    }));
    if (sort === 'stance') list.sort((a, b) => b.stance - a.stance || a.actor.seat - b.actor.seat);
    else if (sort === 'influence')
      list.sort((a, b) => b.actor.influence - a.actor.influence || a.actor.seat - b.actor.seat);
    else list.sort((a, b) => a.actor.seat - b.actor.seat);
    return list;
  }, [stances, deltas, sort]);

  const allies = stances.filter((s) => s > 0.3).length;
  const bloc = stances.filter((s) => s < -0.3).length;
  const middle = 12 - allies - bloc;

  return (
    <section
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-paper-soft"
      aria-label="Stance board"
    >
      {/* header + coalition tally */}
      <header className="shrink-0 border-b border-gray-200 px-5 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="mono-label text-ink">STANCE BOARD</h2>
          {preview && (
            <StatusChip variant="neutral" className="text-[9px]">
              READINESS PREVIEW
            </StatusChip>
          )}
        </div>
        <div className="mono-label mt-2 flex items-center gap-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-support" /> ALLY {allies}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-persuade" /> MIDDLE {middle}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-oppose" /> BLOC {bloc}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* 1. the twelve stances */}
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="mono-label text-[10px] text-gray-500">THE TWELVE STANCES</p>
            <div className="flex overflow-hidden rounded-md border border-gray-200" role="group" aria-label="Sort stances">
              {SORT_MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setSort(m.key)}
                  aria-pressed={sort === m.key}
                  className={cn(
                    'mono-label px-1.5 py-0.5 text-[9px] transition-colors',
                    sort === m.key ? 'bg-council text-white' : 'text-gray-500 hover:text-council',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <ul className="space-y-2">
            {rows.map(({ actor, stance, delta }) => {
              const locked = !!veto && actor.isVetoChair;
              return (
                <motion.li
                  key={actor.id}
                  layout="position"
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <button
                    type="button"
                    onClick={() => onActorClick(actor)}
                    className="w-full rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-paper-deep"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <PersonaAvatar actor={actor} size={28} />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                        {actor.shortName}
                      </span>
                      {locked ? (
                        <span className="mono-label flex items-center gap-1 text-[9px] text-veto">
                          <Lock size={10} /> LOCKED −1.00
                        </span>
                      ) : (
                        Math.abs(delta) > 0.005 && (
                          <span
                            className={cn(
                              'mono-label text-[9px] tabular-nums',
                              delta > 0 ? 'text-support' : 'text-oppose',
                            )}
                          >
                            {delta > 0 ? '▲' : '▼'}
                            {Math.abs(delta).toFixed(2)}
                          </span>
                        )
                      )}
                    </div>
                    <StanceBar value={stance} />
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </div>

        <div className="mx-5 h-px bg-gray-200" />

        {/* 2. influence mini-graph */}
        <div className="px-5 py-4">
          <p className="mono-label mb-2 text-[10px] text-gray-500">
            INFLUENCE NETWORK — EDGES ≥ 0.4
          </p>
          <InfluenceGraph activeEdge={activeEdge} onNodeClick={onActorClick} />
          <p className="mono-label mt-1 text-center text-[9px] text-gray-400">
            CLICK A SEAT TO QUESTION IT
          </p>
        </div>

        <div className="mx-5 h-px bg-gray-200" />

        {/* 3. coalition meter */}
        <div className="px-5 py-4">
          <p className="mono-label mb-2 text-[10px] text-gray-500">COALITION METER</p>
          <div
            className="flex h-3 w-full overflow-hidden rounded-full bg-gray-200"
            role="img"
            aria-label={`Coalition: ${allies} allies, ${middle} persuadable, ${bloc} opposed`}
          >
            <motion.div
              className="h-full bg-support"
              initial={false}
              animate={{ width: `${(allies / 12) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
            <motion.div
              className="h-full bg-persuade"
              initial={false}
              animate={{ width: `${(middle / 12) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
            <motion.div
              className="h-full bg-oppose"
              initial={false}
              animate={{ width: `${(bloc / 12) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
          <p
            className={cn(
              'mono-label mt-2 text-[10px]',
              middle >= 4 ? 'text-persuade' : 'text-gray-400',
            )}
          >
            {middle >= 4 ? 'THE MIDDLE DECIDES THIS ONE' : `ALLY ${allies} · MIDDLE ${middle} · BLOC ${bloc}`}
          </p>
        </div>
      </div>
    </section>
  );
}
