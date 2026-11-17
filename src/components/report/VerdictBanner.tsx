import { motion } from 'framer-motion';
import type { SimulationRun, VerdictKey } from '@/engine';
import { CATEGORY_BY_ID } from '@/engine';
import type { EngineMeta } from '@/hooks/useSimulation';
import ProbabilityBand from '@/components/sim/ProbabilityBand';
import StatusChip from '@/components/sim/StatusChip';
import EngineChip from '@/components/simulator/EngineChip';
import { docketDate } from '@/components/report/docketText';
import { useTypewriter } from '@/components/report/useTypewriter';
import { cn } from '@/lib/utils';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const VERDICT_TEXT: Record<VerdictKey, string> = {
  blocked: 'text-veto',
  unlikely: 'text-oppose',
  contested: 'text-persuade',
  likely: 'text-council',
  mandate: 'text-council-deep',
};

/**
 * Section 1 — Docket header & verdict banner. Mono docket types on; the
 * verdict word gavel-stamps in (veto variant adds the site's single shake);
 * the ProbabilityBand marker tweens to value.
 */
export default function VerdictBanner({
  run,
  meta = null,
}: {
  run: SimulationRun;
  meta?: EngineMeta | null;
}) {
  const { forecast, seed } = run;
  const category = CATEGORY_BY_ID[seed.categoryId];
  const veto = forecast.veto;

  const docket = `FORECAST DOCKET · SEED #${run.seedHash} · ${docketDate()} · 12 SEATS · 4 ROUNDS`;
  const { typed } = useTypewriter(docket, 15);

  return (
    <motion.section
      aria-label="Forecast docket and verdict"
      className={cn(
        'rounded-2xl bg-surface p-8 shadow-paper-soft max-md:p-6',
        veto ? 'border-2 border-veto' : 'border border-gray-200',
      )}
      initial={veto ? { scale: 1.15, y: -2, opacity: 0, x: 0 } : { opacity: 0, y: 24 }}
      animate={
        veto
          ? { scale: 1, y: 0, opacity: 1, x: [0, -3, 3, -2, 2, 0] }
          : { opacity: 1, y: 0 }
      }
      transition={
        veto
          ? {
              scale: { duration: 0.3, ease: 'easeIn' },
              y: { duration: 0.3, ease: 'easeIn' },
              opacity: { duration: 0.3, ease: 'easeIn' },
              x: { duration: 0.2, delay: 0.3 },
            }
          : { duration: 0.45, ease: EASE }
      }
    >
      {/* Mono docket line — types on */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="mono-label min-h-4 text-gray-500" aria-label={docket}>
          {typed}
          <span className="animate-caret-blink text-council" aria-hidden>
            ▍
          </span>
        </p>
        {meta?.engine !== 'llm' && (
          <StatusChip variant="info" className="text-[10px]">
            DETERMINISTIC — IDENTICAL SEED, IDENTICAL RECORD
          </StatusChip>
        )}
        <EngineChip meta={meta} />
      </div>

      {/* The seed, restated */}
      <motion.blockquote
        className="mt-6 border-l-[3px] border-council pl-5 font-display text-xl italic leading-[30px] text-ink"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
      >
        “{seed.text}”
      </motion.blockquote>
      <motion.div
        className="mt-4 flex flex-wrap gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <StatusChip variant="neutral">{category.label}</StatusChip>
        <StatusChip variant="neutral">FIN {seed.sliders.financial}</StatusChip>
        <StatusChip variant="neutral">MEM {seed.sliders.member}</StatusChip>
        <StatusChip variant="neutral">REG {seed.sliders.regulatory}</StatusChip>
        <StatusChip variant="neutral">TIME {seed.sliders.timeline}</StatusChip>
      </motion.div>

      {/* Verdict word — gavel-stamps */}
      <div className="mt-10">
        <motion.h1
          className={cn(
            'font-display text-[40px] font-medium leading-[1.1] tracking-[-0.015em] md:text-5xl',
            VERDICT_TEXT[forecast.band.key],
          )}
          initial={{ scale: 1.15, y: -2, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6, ease: 'easeIn' }}
        >
          {forecast.band.word}
        </motion.h1>

        {veto ? (
          <motion.div
            className="mt-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.75, ease: EASE }}
          >
            <p className="text-base font-semibold leading-[26px] text-veto">
              BLOCKED — hard constraint under the {veto.statute}. The ceiling holds until the move
              is cured.
            </p>
            <p className="mt-2 font-display text-[15px] italic leading-6 text-ink-soft">
              Counsel: “{veto.clause}”
            </p>
          </motion.div>
        ) : null}

        <motion.div
          className="mt-6 max-w-[560px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.85 }}
        >
          <ProbabilityBand
            probability={forecast.probability}
            band={veto ? undefined : forecast.band.range}
          />
          <p className="mono-label mt-2 text-[11px] text-gray-500">
            {veto
              ? 'SUCCESS PROBABILITY CAPPED BELOW 25% — CEILING HOLDS'
              : `SUCCESS PROBABILITY ${forecast.band.range[0]}–${forecast.band.range[1]}%`}
          </p>
        </motion.div>

        <motion.p
          className="mt-6 max-w-[640px] text-base leading-[26px] text-ink-soft"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.1, ease: EASE }}
        >
          {forecast.summary}
        </motion.p>
      </div>
    </motion.section>
  );
}
