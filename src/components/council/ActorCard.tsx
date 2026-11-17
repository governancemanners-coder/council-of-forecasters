import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Gavel, MessageSquareQuote, Scale } from 'lucide-react';
import type { Actor, StanceBucket } from '@/engine';
import { AXIS_NAMES, AXIS_ORDER } from '@/engine';
import PersonaAvatar from '@/components/sim/PersonaAvatar';
import RadarChart from '@/components/sim/RadarChart';
import { cn } from '@/lib/utils';
import { constraintCode, isSoftConstraint } from './constraintCodes';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ---------------------------------------------------------------- */
/* Small pieces                                                      */
/* ---------------------------------------------------------------- */

function MiniBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="mono-label w-[72px] shrink-0 text-[9px] text-gray-500">{label}</span>
      <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-paper-deep">
        <motion.div
          className="h-full rounded-full bg-council"
          initial={{ width: 0 }}
          whileInView={{ width: `${value * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
        />
      </div>
      <span className="mono-data w-8 shrink-0 text-right text-[11px] text-ink">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function ConstraintChips({ actor }: { actor: Actor }) {
  const soft = actor.hardConstraints.every(isSoftConstraint);
  if (soft) {
    return (
      <span className="mono-label inline-flex rounded-full border border-gray-300 bg-paper-deep px-2.5 py-1 text-[10px] text-gray-500">
        None — persuadable
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {actor.hardConstraints.map((c) => (
        <span
          key={c}
          title={c}
          className="mono-label inline-flex rounded-full border border-veto/50 bg-[#FBEBEB] px-2.5 py-1 text-[10px] text-veto"
        >
          {constraintCode(c)}
        </span>
      ))}
    </div>
  );
}

function WeightTable({ actor }: { actor: Actor }) {
  return (
    <div>
      <p className="mono-label text-[10px] text-gray-500">Preference map — weights −3..+3</p>
      <div className="mt-3 flex flex-col gap-[6px]">
        {AXIS_ORDER.map((axis, i) => {
          const v = actor.weights[i];
          const pct = (Math.abs(v) / 6) * 100;
          const positive = v >= 0;
          return (
            <div key={axis} className="flex items-center gap-2">
              <span className="mono-label w-8 shrink-0 text-[10px] text-council">{axis}</span>
              <span className="w-[150px] shrink-0 truncate text-[12px] text-ink-soft max-md:w-[110px]">
                {AXIS_NAMES[axis]}
              </span>
              <div className="relative h-[5px] flex-1 rounded-full bg-paper-deep">
                <div className="absolute left-1/2 top-[-2px] h-[9px] w-px bg-gray-300" />
                {v !== 0 && (
                  <div
                    className="absolute top-0 h-full rounded-full"
                    style={{
                      background: positive ? '#0F766E' : '#C2410C',
                      left: positive ? '50%' : `${50 - pct}%`,
                      width: `${pct}%`,
                    }}
                  />
                )}
              </div>
              <span className="mono-data w-8 shrink-0 text-right text-[11px] text-ink">
                {v > 0 ? `+${v}` : v}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const VOICE_TABS: { key: StanceBucket; label: string; activeCls: string }[] = [
  { key: 'support', label: 'Support', activeCls: 'bg-support-wash text-support border-support' },
  { key: 'oppose', label: 'Oppose', activeCls: 'bg-oppose-wash text-oppose border-oppose' },
  { key: 'cautious', label: 'Cautious', activeCls: 'bg-persuade-wash text-persuade border-persuade' },
];

function VoiceLines({ actor }: { actor: Actor }) {
  const [tab, setTab] = useState<StanceBucket>(actor.isVetoChair ? 'oppose' : 'support');
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="mono-label text-[10px] text-gray-500">Voice on the floor</p>
        <div className="flex gap-1">
          {VOICE_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'mono-label rounded-full border px-2.5 py-1 text-[9px] transition-colors',
                tab === t.key ? t.activeCls : 'border-gray-300 text-gray-500 hover:text-ink',
              )}
            >
              {t.key === 'oppose' && actor.isVetoChair ? 'Oppose (veto)' : t.label}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.ul
          key={tab}
          className="mt-3 space-y-2.5"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {actor.voice[tab].map((line) => (
            <li
              key={line}
              className="border-l-2 border-gray-300 pl-3 font-display text-[15px] italic leading-[24px] text-ink-soft"
            >
              “{line}”
            </li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </div>
  );
}

function CannedQA({ actor }: { actor: Actor }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-gray-200 bg-paper p-4">
        <p className="mono-label flex items-center gap-1.5 text-[9px] text-council">
          <MessageSquareQuote size={12} /> What would make you support this?
        </p>
        <p className="mt-2 text-[13px] leading-5 text-ink-soft">{actor.qa.support}</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-paper p-4">
        <p className="mono-label flex items-center gap-1.5 text-[9px] text-veto">
          <Gavel size={12} /> What&rsquo;s your hard limit?
        </p>
        <p className="mt-2 text-[13px] leading-5 text-ink-soft">{actor.qa.limit}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Card                                                              */
/* ---------------------------------------------------------------- */

export default function ActorCard({ actor, index }: { actor: Actor; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: (index % 3) * 0.06, duration: 0.5, ease: EASE }}
      className="council-card group flex flex-col rounded-2xl border border-gray-200 bg-surface p-6 transition-[box-shadow,transform] duration-200 hover:-translate-y-1 hover:shadow-paper-soft"
    >
      {/* radar hover stroke thicken (scoped; RadarChart polygon has CSS transition) */}
      <style>{`.council-card:hover svg polygon[stroke="#0F766E"]{stroke-width:2.5px}`}</style>

      {/* Row 1 — avatar + name + org chip */}
      <div className="flex items-start gap-4">
        <PersonaAvatar actor={actor} size={56} />
        <div className="min-w-0 flex-1">
          <div className="mono-label text-[9px] text-gray-500">
            Seat {String(actor.seat).padStart(2, '0')}
          </div>
          <h3 className="mt-1 font-display text-[20px] font-medium leading-[26px] text-ink">
            {actor.name}
          </h3>
          <span
            className={cn(
              'mono-label mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[9px]',
              actor.isVetoChair
                ? 'border-veto/50 bg-[#FBEBEB] text-veto'
                : 'border-gray-300 bg-paper-deep text-gray-500',
            )}
          >
            {actor.orgLabel}
          </span>
        </div>
      </div>

      {/* persona one-liner */}
      <p className="mt-4 font-display text-[15px] italic leading-[24px] text-ink-soft">
        {actor.persona}
      </p>

      {/* radar */}
      <div className="mt-4 flex justify-center">
        <RadarChart values={actor.weights} size={160} />
      </div>

      {/* influence / salience */}
      <div className="mt-4 space-y-2">
        <MiniBar label="Influence" value={actor.influence} />
        <MiniBar label="Salience" value={actor.salience} />
      </div>

      {/* hard constraints */}
      <div className="mt-4">
        <p className="mono-label mb-2 text-[9px] text-gray-500">Hard constraints</p>
        <ConstraintChips actor={actor} />
      </div>

      {/* expand */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-5 flex w-full items-center justify-between border-t border-gray-200 pt-4 text-left"
      >
        <span className="mono-label text-[10px] text-council">
          {open ? 'Close seat file' : 'Open seat file'}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            'text-council transition-transform duration-300',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="seat-file"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.35, ease: EASE }, opacity: { duration: 0.2, delay: open ? 0.15 : 0 } }}
            className="overflow-hidden"
          >
            <div className="space-y-6 pt-5">
              <p className="text-[13px] leading-5 text-ink-soft">{actor.bio}</p>

              <WeightTable actor={actor} />

              <div>
                <p className="mono-label text-[10px] text-gray-500">Policy options</p>
                <ul className="mt-3 space-y-1.5">
                  {actor.policyOptions.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[13px] leading-5 text-ink-soft">
                      <Scale size={13} className="mt-1 shrink-0 text-council" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <VoiceLines actor={actor} />

              <CannedQA actor={actor} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
