import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ACTORS } from '@/engine';
import type { OrgType } from '@/engine';
import MagnetButton from '@/components/MagnetButton';
import ActorCard from '@/components/council/ActorCard';
import InfluenceMatrix from '@/components/council/InfluenceMatrix';
import InfluenceNetwork from '@/components/council/InfluenceNetwork';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ---------------------------------------------------------------- */
/* Section 1 — Page header                                           */
/* ---------------------------------------------------------------- */

function HeaderWords({ text, delay }: { text: string; delay: number }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: delay + i * 0.04, duration: 0.6, ease: EASE }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </>
  );
}

const STAT_CHIPS = ['12 SEATS', '8 POLICY AXES', '5 HARD-CONSTRAINT FRAMEWORKS', '1 VETO CHAIR'];

function PageHeader() {
  return (
    <section className="relative overflow-hidden bg-paper">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ backgroundImage: 'url(/hero-texture.png)', backgroundSize: '1200px' }}
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-[1280px] gap-10 px-6 py-24 max-md:px-4 max-md:py-16 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <motion.p
            className="mono-label text-council"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            The Council
          </motion.p>
          <h1 className="mt-4 font-display text-[40px] font-medium leading-[44px] tracking-[-0.015em] text-ink md:text-[48px] md:leading-[54px]">
            <HeaderWords text="Twelve seats. One chamber." delay={0.1} />
          </h1>
          <motion.p
            className="mt-6 max-w-[560px] text-[16px] leading-[26px] text-ink-soft"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
          >
            Not hundreds of agents — twelve, on purpose. Each seat is a real actor in Toronto’s
            housing co-operative sector, with a fixed preference map across eight policy axes,
            legal and political constraints it cannot cross, and a voice you’ll come to recognize
            on the caucus floor.
          </motion.p>
          <div className="mt-8 flex flex-wrap gap-2">
            {STAT_CHIPS.map((chip, i) => (
              <motion.span
                key={chip}
                className="mono-label rounded-full border border-gray-200 bg-surface px-3.5 py-1.5 text-[10px] text-ink-soft"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.08, duration: 0.4, ease: EASE }}
              >
                {chip}
              </motion.span>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <motion.div
            className="overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-paper-soft"
            initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <img
              src="/council-chamber.png"
              alt="Top-down illustration of the round council table with twelve chairs, one highlighted in teal"
              className="block h-auto w-full"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Section 3 — Filter bar                                            */
/* ---------------------------------------------------------------- */

const ORG_FILTERS: { key: OrgType; label: string }[] = [
  { key: 'governance', label: 'Governance' },
  { key: 'sector', label: 'Sector' },
  { key: 'government', label: 'Government' },
  { key: 'funder', label: 'Funder' },
  { key: 'legal', label: 'Legal' },
  { key: 'advocacy', label: 'Advocacy' },
  { key: 'market', label: 'Market' },
  { key: 'rights', label: 'Rights' },
];

type SortKey = 'seat' | 'influence' | 'salience';

function FilterBar({
  selected,
  onToggle,
  onAll,
  sort,
  onSort,
  shown,
}: {
  selected: Set<OrgType>;
  onToggle: (t: OrgType) => void;
  onAll: () => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  shown: number;
}) {
  const allActive = selected.size === 0;
  return (
    <div className="sticky top-16 z-30 border-b border-gray-200 bg-surface">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-3 gap-y-2 px-6 py-3 max-md:px-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onAll}
            className={cn(
              'mono-label rounded-full border px-3 py-1.5 text-[10px] transition-colors',
              allActive
                ? 'border-council bg-council-wash text-council'
                : 'border-gray-300 text-gray-500 hover:border-gray-500 hover:text-ink',
            )}
          >
            All
          </button>
          {ORG_FILTERS.map((f) => {
            const active = selected.has(f.key);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => onToggle(f.key)}
                aria-pressed={active}
                className={cn(
                  'mono-label rounded-full border px-3 py-1.5 text-[10px] transition-colors',
                  active
                    ? 'border-council bg-council-wash text-council'
                    : 'border-gray-300 text-gray-500 hover:border-gray-500 hover:text-ink',
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="mono-label text-[10px] text-gray-500">
            Showing {shown} / 12 seats
          </span>
          <Select value={sort} onValueChange={(v) => onSort(v as SortKey)}>
            <SelectTrigger className="h-8 w-[150px] border-gray-300 font-mono text-[11px] uppercase tracking-[0.06em]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seat">Seat order</SelectItem>
              <SelectItem value="influence">Influence</SelectItem>
              <SelectItem value="salience">Salience</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Page                                                              */
/* ---------------------------------------------------------------- */

export default function Council() {
  /** Shared highlight between the network diagram and the matrix rows. */
  const [highlightSeat, setHighlightSeat] = useState<number | null>(null);
  const [selectedOrgs, setSelectedOrgs] = useState<Set<OrgType>>(new Set());
  const [sort, setSort] = useState<SortKey>('seat');

  const toggleOrg = (t: OrgType) =>
    setSelectedOrgs((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  const visible = useMemo(() => {
    const filtered =
      selectedOrgs.size === 0
        ? [...ACTORS]
        : ACTORS.filter((a) => selectedOrgs.has(a.orgType));
    if (sort === 'influence') filtered.sort((a, b) => b.influence - a.influence);
    else if (sort === 'salience') filtered.sort((a, b) => b.salience - a.salience);
    else filtered.sort((a, b) => a.seat - b.seat);
    return filtered;
  }, [selectedOrgs, sort]);

  return (
    <div className="bg-paper">
      <PageHeader />

      {/* Section 2 — Influence network diagram */}
      <section className="mx-auto max-w-[1280px] px-6 pb-24 max-md:px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <p className="mono-label text-council">The influence network</p>
          <h2 className="mt-3 font-display text-[28px] font-medium leading-[34px] tracking-[-0.01em] text-ink md:text-[34px] md:leading-[40px]">
            Who moves whom.
          </h2>
          <div className="mt-6 rounded-2xl border border-gray-200 bg-surface p-6 shadow-paper-soft max-md:p-3">
            <InfluenceNetwork highlightSeat={highlightSeat} onHighlight={setHighlightSeat} />
          </div>
        </motion.div>
      </section>

      {/* Section 3 — Filter bar + seat grid */}
      <FilterBar
        selected={selectedOrgs}
        onToggle={toggleOrg}
        onAll={() => setSelectedOrgs(new Set())}
        sort={sort}
        onSort={setSort}
        shown={visible.length}
      />
      <section className="mx-auto max-w-[1280px] px-6 py-16 max-md:px-4">
        <motion.div layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((actor, i) => (
              <ActorCard key={actor.id} actor={actor} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
        {visible.length === 0 && (
          <p className="mono-label py-16 text-center text-gray-500">
            No seats match the selected filters.
          </p>
        )}
      </section>

      {/* Section 5 — Influence matrix table */}
      <section className="mx-auto max-w-[1280px] px-6 pb-24 max-md:px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <p className="mono-label text-council">The cascade, in full</p>
          <h2 className="mt-3 font-display text-[28px] font-medium leading-[34px] tracking-[-0.01em] text-ink md:text-[34px] md:leading-[40px]">
            The 12×12 influence matrix.
          </h2>
          <p className="mt-4 max-w-[640px] text-[15px] leading-[24px] text-ink-soft">
            Every round of a simulation, each seat’s stance is pulled along these weights. Hover a
            row to see the seat’s edges light up in the network above.
          </p>
          <div className="mt-6 rounded-2xl border border-gray-200 bg-surface p-6 shadow-paper-soft max-md:p-3">
            <InfluenceMatrix highlightSeat={highlightSeat} onHighlight={setHighlightSeat} />
          </div>
        </motion.div>
      </section>

      {/* Section 6 — Bottom CTA */}
      <section className="bg-paper-deep">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center px-6 py-24 text-center max-md:px-4">
          <motion.h2
            className="font-display text-[28px] font-medium leading-[34px] tracking-[-0.01em] text-ink md:text-[34px] md:leading-[40px]"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            You’ve met the room. Now read it.
          </motion.h2>
          <motion.p
            className="mt-4 max-w-[520px] text-[16px] leading-[26px] text-ink-soft"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
          >
            The Simulator puts your move on the table and these twelve voices around it.
          </motion.p>
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.45, ease: EASE }}
          >
            <MagnetButton to="/simulator">
              Convene the Council <ArrowRight size={16} />
            </MagnetButton>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
