import { motion } from 'framer-motion';
import type { VerdictKey } from '@/engine';
import { VERDICT_BANDS } from '@/engine';
import { EASE } from '@/components/methodology/ease';
import { Reveal, SectionHead } from '@/components/methodology/common';
import { cn } from '@/lib/utils';

const BAND_ORDER: VerdictKey[] = ['blocked', 'unlikely', 'contested', 'likely', 'mandate'];

const BAND_CHIP: Record<VerdictKey, string> = {
  blocked: 'bg-[#FBEBEB] text-veto border-veto',
  unlikely: 'bg-oppose-wash text-oppose border-oppose',
  contested: 'bg-persuade-wash text-persuade border-persuade',
  likely: 'bg-council-wash text-council border-council',
  mandate: 'bg-council text-white border-council',
};

/**
 * 04 THE VERDICT — how the Report Agent reads the room, plus the five-band
 * table (name, range, meaning, recommended posture).
 */
export default function VerdictSection() {
  return (
    <section id="verdict" className="mt-24 scroll-mt-24">
      <SectionHead index="04" eyebrow="THE VERDICT" title="The Report Agent reads the room, then writes.">
        <p>
          The five gatekeeper seats — your Board, the Members’ Assembly, the City, MMAH, and CMHC —
          set the probability band from their influence-weighted final stances, adjusted for how
          broad the coalition is. A hard veto from Counsel caps everything at Blocked, no matter
          how popular the move.
        </p>
      </SectionHead>

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-surface">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="mono-label border-b border-gray-200 bg-paper-deep/60 text-left text-[10px] text-gray-500">
              <th className="px-4 py-2.5 font-medium">BAND</th>
              <th className="px-4 py-2.5 font-medium">RANGE</th>
              <th className="px-4 py-2.5 font-medium">MEANING</th>
              <th className="hidden px-4 py-2.5 font-medium sm:table-cell">POSTURE</th>
            </tr>
          </thead>
          <tbody>
            {BAND_ORDER.map((key, i) => {
              const band = VERDICT_BANDS[key];
              return (
                <motion.tr
                  key={key}
                  className="border-b border-gray-200/70 last:border-0"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }}
                >
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'mono-label relative inline-flex overflow-hidden rounded-full border px-2.5 py-1 text-[10px]',
                        BAND_CHIP[key],
                      )}
                    >
                      <motion.span
                        className="absolute inset-0 bg-white/20"
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
                        style={{ transformOrigin: 'left center' }}
                        aria-hidden
                      />
                      {band.label}
                    </span>
                  </td>
                  <td className="mono-data whitespace-nowrap px-4 py-3 tabular-nums text-ink">
                    {key === 'blocked' ? '<25% or veto' : `${band.range[0]}–${band.range[1]}%`}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{band.meaning}</td>
                  <td className="hidden px-4 py-3 text-ink-soft sm:table-cell">{band.posture}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Reveal className="mt-6">
        <p className="text-base leading-[26px] text-ink-soft">
          The Report also extracts allies, blockers, the persuadable middle with flip conditions,
          and a recommended order of approach — brief the Councillor before the Assembly; never
          announce before Counsel’s letter.
        </p>
      </Reveal>
    </section>
  );
}
