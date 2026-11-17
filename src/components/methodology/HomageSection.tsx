import { memo } from 'react';
import { motion } from 'framer-motion';
import MagnetButton from '@/components/MagnetButton';
import { MIROFISH_CREDIT } from '@/components/Footer';
import { EASE } from '@/components/methodology/ease';
import { SectionHead } from '@/components/methodology/common';

/** Isolated perpetual float loop for the homage illustration. */
const FloatingHomage = memo(function FloatingHomage() {
  return (
    <motion.img
      src="/mirofish-homage.png"
      alt="A school of small geometric fish forming an upward curve that resolves into twelve dots"
      className="w-full rounded-2xl border border-gray-200"
      animate={{ y: [0, -6, 0, 6, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
});

const MAPPING: Array<[string, string]> = [
  ['World seed (scenario input)', 'The user’s proposed board action'],
  ['Hundreds of generated persona agents', 'Exactly 12 hand-assigned sector seats'],
  ['Multi-round interaction & stance propagation', '4-round caucus over the influence matrix'],
  ['Report Agent', 'Forecast docket: verdict, blocs, sequencing, conditions'],
  ['Deep interaction with individual agents', 'Canned per-seat Q&A in the drawer'],
  ['Run stepper UI (seed → agents → simulation → report)', 'Step indicator: Seed → Council → Simulation → Report'],
  ['Light UI, single accent, feeds + graph + report views', 'Caucus-floor feed, stance board, influence graph, report'],
];

/**
 * 06 THE MIROFISH LINEAGE (#homage) — fish-blue hairline-framed section:
 * the story, the concept-mapping table, the verbatim credit block, and the
 * GitHub link. Frame hairlines draw in sequentially.
 */
export default function HomageSection() {
  return (
    <section id="homage" className="mt-24 scroll-mt-24">
      <div className="relative px-6 py-10 md:px-10">
        {/* fish-blue frame hairlines — drawn sequentially */}
        <motion.span aria-hidden className="absolute left-0 top-0 h-px w-full bg-fish-blue/60"
          initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4, ease: EASE }} style={{ transformOrigin: 'left center' }} />
        <motion.span aria-hidden className="absolute right-0 top-0 h-full w-px bg-fish-blue/60"
          initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4, delay: 0.4, ease: EASE }} style={{ transformOrigin: 'top center' }} />
        <motion.span aria-hidden className="absolute bottom-0 right-0 h-px w-full bg-fish-blue/60"
          initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4, delay: 0.8, ease: EASE }} style={{ transformOrigin: 'right center' }} />
        <motion.span aria-hidden className="absolute bottom-0 left-0 h-full w-px bg-fish-blue/60"
          initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4, delay: 1.2, ease: EASE }} style={{ transformOrigin: 'bottom center' }} />

        <div className="grid items-start gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <SectionHead
              index="06"
              eyebrow="THE MIROFISH LINEAGE"
              title="This exists because MiroFish does."
              eyebrowClass="text-fish-blue"
            >
              <p>
                MiroFish (github.com/666ghj/MiroFish, AGPL-3.0, by 666ghj, successor to BettaFish)
                is an open-source swarm-intelligence engine that forecasts outcomes by populating a
                scenario with hundreds of persona agents and letting their interactions play out
                across rounds, then distilling the run into a report. It is ambitious, genuinely
                novel software, released freely to the public.
              </p>
            </SectionHead>

            {/* Concept mapping table */}
            <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-surface">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="mono-label border-b border-gray-200 bg-paper-deep/60 text-left text-[10px]">
                    <th className="px-4 py-2.5 font-medium text-fish-blue">MIROFISH</th>
                    <th className="px-4 py-2.5 font-medium text-council">COUNCIL OF FORECASTERS</th>
                  </tr>
                </thead>
                <tbody>
                  {MAPPING.map(([from, to], i) => (
                    <motion.tr
                      key={from}
                      className="border-b border-gray-200/70 last:border-0"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-30px' }}
                      transition={{ duration: 0.35, delay: i * 0.05, ease: EASE }}
                    >
                      <td className="px-4 py-3 text-ink-soft">{from}</td>
                      <td className="px-4 py-3 text-ink">{to}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-base leading-[26px] text-ink-soft">
              What we did not take: code, assets, branding, or the name. This is an original
              reimplementation of publicly described ideas, rebuilt for one sector in one city, and
              scaled down on purpose — a council you can learn by name, instead of a swarm you can
              only observe statistically.
            </p>

            {/* Verbatim credit block — gavel-stamps in last */}
            <motion.div
              className="mt-8 rounded-xl border-l-[3px] border-fish-blue bg-surface p-5 shadow-paper-soft"
              initial={{ scale: 1.08, y: -2, opacity: 0 }}
              whileInView={{ scale: 1, y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.25, delay: 0.3, ease: 'easeIn' }}
            >
              <p className="text-[15px] font-medium leading-6 text-fish-blue">{MIROFISH_CREDIT}</p>
            </motion.div>

            <div className="mt-6">
              <MagnetButton href="https://github.com/666ghj/MiroFish" variant="fish">
                MiroFish on GitHub →
              </MagnetButton>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
          >
            <FloatingHomage />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
