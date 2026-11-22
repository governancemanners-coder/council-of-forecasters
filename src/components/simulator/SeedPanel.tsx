import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Scale } from 'lucide-react';
import type { CategoryId, Sliders, Vector8 } from '@/engine';
import {
  AXIS_ORDER,
  CATEGORIES,
  SAMPLE_SEED,
  checkConstraints,
  computeActionVector,
} from '@/engine';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import MagnetButton from '@/components/MagnetButton';
import { cn } from '@/lib/utils';

export interface SeedDraft {
  text: string;
  categoryId: CategoryId | null;
  sliders: Sliders;
}

export const DEFAULT_SLIDERS: Sliders = { financial: 50, member: 50, regulatory: 50, timeline: 50 };

export const EMPTY_DRAFT: SeedDraft = { text: '', categoryId: null, sliders: DEFAULT_SLIDERS };

/** Hard cap — must match `api/router.ts` seedSchema. */
export const SEED_MAX = 280;

/** Valid seed = category picked + 10–280 chars of text (matches API Zod). */
export function isDraftValid(d: SeedDraft): boolean {
  const len = d.text.trim().length;
  return d.categoryId !== null && len >= 10 && len <= SEED_MAX;
}

const SLIDER_DEFS: Array<{
  key: keyof Sliders;
  label: string;
  hint: string;
  warning?: { above: number; text: string };
}> = [
  { key: 'financial', label: 'FINANCIAL SCALE', hint: 'scales FND · AFF' },
  { key: 'member', label: 'MEMBER IMPACT', hint: 'scales DEM · RGT · AFF' },
  {
    key: 'regulatory',
    label: 'REGULATORY EXPOSURE',
    hint: 'scales AUT · RGT',
    warning: { above: 70, text: 'Counsel will read this closely.' },
  },
  {
    key: 'timeline',
    label: 'TIMELINE URGENCY',
    hint: 'scales all axes',
    warning: { above: 80, text: 'Fast tracks invite vetoes.' },
  },
];

/** Eight mini diverging bars — the live action vector preview. */
function VectorPreview({ vector }: { vector: Vector8 | null }) {
  const maxMag = useMemo(() => {
    if (!vector) return 1;
    return Math.max(1, ...vector.map((v) => Math.abs(v)));
  }, [vector]);

  return (
    <div>
      <p className="mono-label mb-2 text-gray-500">ACTION VECTOR — LIVE PREVIEW</p>
      <div className="space-y-1.5" aria-live="polite">
        {AXIS_ORDER.map((axis, i) => {
          const v = vector ? vector[i] : 0;
          const frac = Math.min(Math.abs(v) / maxMag, 1);
          const positive = v >= 0;
          return (
            <div key={axis} className="flex items-center gap-2">
              <span className="mono-label w-9 shrink-0 text-[10px] text-gray-500">{axis}</span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gray-300" />
                <motion.div
                  className={cn(
                    'absolute top-0 h-full rounded-full',
                    v === 0 ? 'bg-gray-300' : positive ? 'bg-council' : 'bg-oppose',
                  )}
                  style={{
                    left: positive ? '50%' : undefined,
                    right: positive ? undefined : '50%',
                    width: '50%',
                    transformOrigin: positive ? 'left center' : 'right center',
                  }}
                  initial={false}
                  animate={{ scaleX: Math.max(frac, v === 0 ? 0 : 0.02) }}
                  transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                />
              </div>
              <span className="mono-label w-12 shrink-0 text-right text-[10px] tabular-nums text-gray-500">
                {v > 0 ? '+' : v < 0 ? '−' : '±'}
                {Math.abs(v).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Pane 1 — SEED. Free-text action, 8 category chips, 4 magnitude sliders,
 * live action-vector preview, hard-constraint pre-check, Convene CTA.
 */
export default function SeedPanel({
  draft,
  onChange,
  onConvene,
  locked,
  complete,
}: {
  draft: SeedDraft;
  onChange: (d: SeedDraft) => void;
  onConvene: () => void;
  /** Run in progress — inputs freeze. */
  locked: boolean;
  /** Run finished. */
  complete: boolean;
}) {
  const valid = isDraftValid(draft);
  const [pulsed, setPulsed] = useState(false);
  const wasValid = useRef(false);

  useEffect(() => {
    if (valid && !wasValid.current && !pulsed) setPulsed(true);
    wasValid.current = valid;
  }, [valid, pulsed]);

  const vector = useMemo<Vector8 | null>(
    () => (draft.categoryId ? computeActionVector(draft.categoryId, draft.sliders) : null),
    [draft.categoryId, draft.sliders],
  );

  const checks = useMemo(
    () =>
      draft.categoryId
        ? checkConstraints({ text: draft.text, categoryId: draft.categoryId, sliders: draft.sliders })
        : null,
    [draft.categoryId, draft.text, draft.sliders],
  );
  const flagged = checks?.filter((c) => c.status !== 'clear') ?? [];

  const set = (patch: Partial<SeedDraft>) => onChange({ ...draft, ...patch });

  return (
    <section
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-paper-soft"
      aria-label="Seed panel — your move"
    >
      {/* sticky header */}
      <header className="flex shrink-0 items-center gap-2 border-b border-gray-200 px-5 py-3.5">
        <span className="h-2 w-2 rounded-full bg-council" aria-hidden />
        <h2 className="mono-label text-ink">YOUR MOVE — THE WORLD SEED</h2>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {/* 1. free text */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="seed-text" className="mono-label text-gray-500">
              DESCRIBE THE DECISION
            </label>
            <span
              className={cn(
                'mono-label text-[10px] tabular-nums',
                draft.text.length >= SEED_MAX ? 'text-persuade' : 'text-gray-500',
              )}
            >
              {draft.text.length}/{SEED_MAX}
            </span>
          </div>
          <Textarea
            id="seed-text"
            rows={5}
            disabled={locked}
            maxLength={SEED_MAX}
            value={draft.text}
            onChange={(e) => set({ text: e.target.value.slice(0, SEED_MAX) })}
            placeholder="e.g., Partner with a developer to build a 6-storey rental addition on our parking lot, proceeds fund retrofits…"
            className="resize-none bg-paper text-[15px] leading-6 placeholder:text-gray-400"
          />
        </div>

        {/* 2. category chips */}
        <fieldset disabled={locked}>
          <legend className="mono-label mb-2 text-gray-500">ACTION CATEGORY — PICK ONE</legend>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat, i) => {
              const selected = draft.categoryId === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  type="button"
                  initial={false}
                  animate={selected ? { scale: [1.15, 1], transition: { duration: 0.25, ease: 'easeIn', delay: i * 0.05 } } : { scale: 1 }}
                  onClick={() => set({ categoryId: selected ? null : cat.id })}
                  aria-pressed={selected}
                  className={cn(
                    'mono-label rounded-full border px-2.5 py-1 text-[11px] normal-case tracking-[0.04em] transition-colors',
                    selected
                      ? 'border-council bg-council-wash text-council'
                      : 'border-gray-300 bg-surface text-ink-soft hover:border-council/50 hover:text-council',
                    locked && 'cursor-not-allowed opacity-60',
                  )}
                >
                  {cat.label}
                </motion.button>
              );
            })}
          </div>
        </fieldset>

        {/* 3. magnitude sliders */}
        <fieldset disabled={locked} className="space-y-4">
          <legend className="mono-label mb-1 text-gray-500">MAGNITUDE</legend>
          {SLIDER_DEFS.map((def) => {
            const value = draft.sliders[def.key];
            const warn = def.warning && value > def.warning.above ? def.warning.text : null;
            return (
              <div key={def.key}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="mono-label text-[11px] text-ink-soft">{def.label}</span>
                  <span className="mono-data text-[13px] tabular-nums text-council">{value}</span>
                </div>
                <Slider
                  value={[value]}
                  min={0}
                  max={100}
                  step={1}
                  disabled={locked}
                  onValueChange={([v]) => set({ sliders: { ...draft.sliders, [def.key]: v } })}
                  aria-label={def.label}
                />
                <div className="mt-1 flex items-center justify-between">
                  <span className="mono-label text-[9px] text-gray-400">{def.hint}</span>
                  {warn && <span className="mono-label text-[9px] text-persuade">{warn}</span>}
                </div>
              </div>
            );
          })}
        </fieldset>

        {/* 4. action vector preview */}
        <VectorPreview vector={vector} />

        {/* 5. hard-constraint pre-check */}
        <div className="rounded-xl border border-gray-200 bg-paper p-3">
          <p className="mono-label mb-2 flex items-center gap-1.5 text-gray-500">
            <Scale size={13} aria-hidden /> HARD-CONSTRAINT PRE-CHECK
          </p>
          {!checks && (
            <p className="text-[13px] leading-5 text-gray-500">
              Pick a category to screen the seed against the five frameworks.
            </p>
          )}
          {checks && flagged.length === 0 && (
            <p className="mono-label flex items-center gap-1.5 text-[11px] text-support">
              <Check size={13} aria-hidden /> ALL FIVE FRAMEWORKS CLEAR
            </p>
          )}
          <ul className="space-y-2">
            {flagged.map((c) => (
              <motion.li
                key={c.short + c.status}
                initial={{ scale: 1.15, y: -2, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ duration: 0.25, ease: 'easeIn' }}
                className={cn(
                  'rounded-lg border px-2.5 py-2',
                  c.status === 'violated'
                    ? 'border-veto bg-[#FBEBEB]'
                    : 'border-persuade/40 bg-persuade-wash',
                )}
              >
                <p
                  className={cn(
                    'mono-label flex items-center gap-1.5 text-[10px]',
                    c.status === 'violated' ? 'text-veto' : 'text-persuade',
                  )}
                >
                  <Scale size={12} aria-hidden />
                  {c.short} — {c.status === 'violated' ? 'VIOLATED AS FRAMED' : 'AT RISK'}
                </p>
                <p className="mt-1 text-[12px] leading-4 text-ink-soft">{c.framework}</p>
                <p className="mt-0.5 text-[12px] italic leading-4 text-gray-500">{c.basis}</p>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* readiness note */}
        {valid && !locked && !complete && (
          <p className="mono-label text-[10px] text-council">
            COUNCIL READINESS — INITIAL STANCES COMPUTED LIVE ON THE BOARD →
          </p>
        )}
        {locked && !complete && (
          <p className="mono-label text-[10px] text-gray-500">SEED LOCKED — THE RECORD IS OPEN</p>
        )}
      </div>

      {/* 6. primary action */}
      <footer className="shrink-0 border-t border-gray-200 px-5 py-4">
        <motion.div
          animate={pulsed && !locked && !complete ? { scale: [1, 1.03, 1] } : { scale: 1 }}
          transition={{ duration: 0.6, times: [0, 0.5, 1] }}
        >
          <MagnetButton
            onClick={onConvene}
            disabled={!valid || locked}
            className="w-full"
          >
            Convene the Council
          </MagnetButton>
        </motion.div>
        {!valid && !locked && (
          <p className="mono-label mt-2 text-center text-[10px] text-gray-400">
            DESCRIBE YOUR MOVE + PICK A CATEGORY
          </p>
        )}
        {locked && complete && (
          <p className="mono-label mt-2 text-center text-[10px] text-gray-400">
            RECORD COMPLETE — START A NEW SEED FROM THE FLOOR
          </p>
        )}
        {!locked && !complete && (
          <button
            type="button"
            onClick={() =>
              onChange({
                text: SAMPLE_SEED.text,
                categoryId: SAMPLE_SEED.categoryId,
                sliders: { ...SAMPLE_SEED.sliders },
              })
            }
            className="mt-2 w-full text-center text-[13px] text-council underline-offset-4 hover:underline"
          >
            Load a sample seed
          </button>
        )}
      </footer>
    </section>
  );
}
