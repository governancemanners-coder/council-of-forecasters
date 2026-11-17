import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { SimulationRun } from '@/engine';
import { ACTOR_BY_ID } from '@/engine';
import { projectedBandAfterFlips } from '@/components/report/docketText';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v).toFixed(2)}`;

/**
 * Section 4 — Conditions register. "What would flip the room." Two-column
 * rows: persuadable actor + current stance → flip condition → projected
 * stance chip. Summary line computes the band delta for the top three.
 */
export default function ConditionsRegister({ run }: { run: SimulationRun }) {
  const { forecast } = run;
  const middle = forecast.middle;

  if (middle.length === 0) return null;

  const topN = Math.min(3, middle.length);
  const after = projectedBandAfterFlips(run, topN);

  return (
    <section aria-label="Conditions register" className="mt-16 rounded-2xl bg-paper-deep px-6 py-12 md:px-12">
      <h2 className="font-display text-[34px] font-medium leading-10 tracking-[-0.01em] text-ink">
        What would flip the room.
      </h2>
      <p className="mt-3 max-w-[640px] text-base leading-[26px] text-ink-soft">
        Each persuadable seat named its price in the record. These are the conditions on file.
      </p>

      <ul className="mt-8 grid gap-x-10 gap-y-6 md:grid-cols-2">
        {middle.map((m, i) => {
          const actor = ACTOR_BY_ID[m.actorId];
          return (
            <motion.li
              key={m.actorId}
              className="rounded-xl border border-gray-200 bg-surface p-5"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.07, ease: EASE }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-lg font-medium leading-6 text-ink">
                  {actor.shortName}
                </h3>
                <span className="mono-data shrink-0 tabular-nums text-[13px] text-gray-500">
                  NOW {signed(m.stance)}
                </span>
              </div>
              <div className="mt-3 flex items-start gap-2">
                <ArrowRight size={15} className="mt-1 shrink-0 text-council" aria-hidden />
                <p className="flex-1 text-sm leading-[22px] text-ink-soft">{m.flipCondition}</p>
              </div>
              <p className="mono-label mt-3 inline-flex rounded-full bg-council-wash px-2.5 py-1 text-[11px] text-council">
                → {signed(m.projected)} IF MET
              </p>
            </motion.li>
          );
        })}
      </ul>

      <motion.p
        className="mt-8 border-t border-gray-300 pt-5 text-[15px] leading-6 text-ink"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, delay: 0.2, ease: EASE }}
      >
        {run.veto
          ? 'The ceiling holds regardless: counsel’s constraint must be cured before any condition register matters.'
          : `Meeting the top ${topN === 1 ? 'condition' : `${topN} conditions`} moves the forecast from ${forecast.band.label} (${forecast.band.range[0]}–${forecast.band.range[1]}%) toward ${after.label}.`}
      </motion.p>
    </section>
  );
}
