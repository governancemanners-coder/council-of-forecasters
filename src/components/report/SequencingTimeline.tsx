import { motion } from 'framer-motion';
import type { SequenceStop } from '@/engine';
import { ACTOR_BY_ID } from '@/engine';
import PersonaAvatar from '@/components/sim/PersonaAvatar';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Section 3 — Recommended sequencing. Horizontal timeline on desktop
 * (teal line draws left→right), vertical on mobile. Each stop: number,
 * actor avatar, action verb, rationale that expands on hover.
 */
export default function SequencingTimeline({ stops }: { stops: SequenceStop[] }) {
  return (
    <section aria-label="Recommended sequencing" className="mt-16">
      <h2 className="font-display text-[34px] font-medium leading-10 tracking-[-0.01em] text-ink">
        In what order.
      </h2>
      <p className="mt-3 max-w-[640px] text-base leading-[26px] text-ink-soft">
        Persuadable gatekeepers first, in descending influence — before the sovereign decision
        body. Regulators briefed before public advocacy.
      </p>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-surface p-8 shadow-paper-soft max-md:p-6">
        <ol className="relative grid gap-8 md:grid-cols-6 md:gap-4">
          {/* connecting line — desktop */}
          <motion.div
            className="absolute left-6 top-6 hidden h-0.5 bg-council md:block"
            style={{ right: 'calc(100% / 12)', transformOrigin: 'left center' }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.2, ease: EASE }}
          />
          {/* connecting line — mobile */}
          <motion.div
            className="absolute bottom-6 left-[23px] top-6 w-0.5 bg-council md:hidden"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.2, ease: EASE }}
            style={{ transformOrigin: 'top' }}
          />
          {stops.map((stop, i) => {
            const actor = ACTOR_BY_ID[stop.actorId];
            return (
              <motion.li
                key={`${stop.actorId}-${i}`}
                className="group relative flex gap-4 md:flex-col md:gap-0"
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  delay: 0.2 + i * 0.08,
                }}
              >
                <div className="relative z-10 flex flex-col items-center">
                  <div className="rounded-full ring-4 ring-surface transition-shadow duration-200 group-hover:ring-8 group-hover:ring-council-wash">
                    <PersonaAvatar actor={actor} size={40} />
                  </div>
                  <span className="mono-label mt-2 text-[10px] text-gray-500 md:mt-3">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="min-w-0 flex-1 md:mt-2">
                  <p className="text-sm font-semibold leading-5 text-ink">
                    {actor.shortName}
                  </p>
                  <p className="mono-label mt-1 text-[10px] text-council">{stop.action}</p>
                  <p className="mt-1.5 text-[13px] leading-5 text-ink-soft transition-all duration-200 md:max-h-10 md:overflow-hidden md:group-hover:max-h-40">
                    {stop.rationale}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
