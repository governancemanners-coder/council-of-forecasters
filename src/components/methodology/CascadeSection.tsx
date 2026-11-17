import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { ACTORS, INFLUENCE_MATRIX } from '@/engine';
import { EASE } from '@/components/methodology/ease';
import { FormulaBlock, Reveal, SectionHead } from '@/components/methodology/common';

/**
 * 03 THE CASCADE — the influence-propagation formula, behavioral notes, and
 * the 12×12 influence matrix rendered as a teal heatmap (cells fade in
 * column-by-column).
 */
export default function CascadeSection() {
  return (
    <section id="cascade" className="mt-24 scroll-mt-24">
      <SectionHead index="03" eyebrow="THE CASCADE" title="Then the room starts talking to itself.">
        <p>
          Each round, every seat drifts toward the influence-weighted positions of the seats it
          listens to. The Ward Councillor — λ 0.8 — is the most movable object in the room,
          tracking the members and the advocates. Legal Counsel’s λ is exactly zero: statute
          doesn’t care who else changed their mind.
        </p>
      </SectionHead>

      <FormulaBlock>
        s<sub>i</sub>(t+1) = (1 − λ<sub>i</sub>) · s<sub>i</sub>(t) + λ<sub>i</sub> · Σ<sub>j</sub>{' '}
        M<sub>ij</sub> · s<sub>j</sub>(t)
      </FormulaBlock>

      <Reveal className="mt-6">
        <ul className="list-disc space-y-2 pl-5 text-base leading-[26px] text-ink-soft">
          <li>
            CHFT ↔ CHF Canada are strongly coupled — 0.5 both ways; the sector moves as one or not
            at all.
          </li>
          <li>
            A hard-constraint veto locks Counsel at −1.00 for the whole run; no cascade reaches a
            locked seat.
          </li>
          <li>
            Tenant &amp; Housing Advocacy amplifies Counsel: when a veto fires, the advocates’ next
            statement is the amplification line.
          </li>
        </ul>
      </Reveal>

      {/* Influence matrix heatmap */}
      <Reveal className="mt-8" delay={0.05}>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-surface p-4">
          <div className="min-w-[560px]">
            <div
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: '88px repeat(12, minmax(0, 1fr))' }}
            >
              <span className="mono-label self-end pb-1 text-[9px] text-gray-500">LISTENS ↓ / TO →</span>
              {ACTORS.map((a) => (
                <span key={a.id} className="mono-label pb-1 text-center text-[9px] text-gray-500">
                  {a.monogram}
                </span>
              ))}
              {ACTORS.map((row, i) => (
                <Fragment key={row.id}>
                  <span className="mono-label self-center text-[9px] text-gray-500">
                    {row.monogram} {row.shortName.toUpperCase().slice(0, 10)}
                  </span>
                  {ACTORS.map((col, j) => {
                    const v = INFLUENCE_MATRIX[i][j];
                    return (
                      <motion.span
                        key={`${row.id}-${col.id}`}
                        title={`${col.shortName} → ${row.shortName}: ${v.toFixed(1)}`}
                        className="block aspect-square rounded-[3px]"
                        style={{
                          background: v > 0 ? '#0F766E' : '#F2F0EA',
                        }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: v > 0 ? 0.25 + v * 0.75 : 1 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.3, delay: j * 0.03 + i * 0.01, ease: EASE }}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-[13px] text-gray-500">
          Rows listen, columns talk. Counsel’s row is empty — no incoming edges.{' '}
          <Link to="/council" className="text-council underline-offset-4 hover:underline">
            Full matrix on the Council page →
          </Link>
        </p>
      </Reveal>

      <Reveal className="mt-8">
        <p className="text-base leading-[26px] text-ink-soft">
          Four rounds. That’s the whole simulation — short enough that a transcript stays readable,
          long enough for positions to travel the network. MiroFish runs its swarms for many more
          turns; a council adjourns.
        </p>
      </Reveal>
    </section>
  );
}
