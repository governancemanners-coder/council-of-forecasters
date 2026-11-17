import { motion } from 'framer-motion';
import { AXIS_ORDER, CATEGORIES, computeActionVector, sliderScalar } from '@/engine';
import { EASE } from '@/components/methodology/ease';
import { Reveal, SectionHead, TweenNumber } from '@/components/methodology/common';

const fmt = (v: number) => {
  const s = Math.abs(v).toFixed(2);
  if (v > 0) return `+${s}`;
  if (v < 0) return `−${s}`;
  return ` ${s}`;
};

/** The worked example from methodology.md §2. */
const EXAMPLE = {
  categoryId: 'retrofit' as const,
  sliders: { financial: 70, member: 40, regulatory: 20, timeline: 55 },
};

/**
 * 01 THE SEED — worked example callout (base vector → scaled vector) plus
 * the compact table of all eight category base vectors.
 */
export default function SeedSection() {
  const category = CATEGORIES.find((c) => c.id === EXAMPLE.categoryId)!;
  const scaled = computeActionVector(EXAMPLE.categoryId, EXAMPLE.sliders);

  const fin = sliderScalar(EXAMPLE.sliders.financial);
  const mem = sliderScalar(EXAMPLE.sliders.member);
  const reg = sliderScalar(EXAMPLE.sliders.regulatory);
  const time = sliderScalar(EXAMPLE.sliders.timeline);
  const perAxisScale: Record<string, number> = {
    AFF: fin * mem * time,
    AUT: reg * time,
    FND: fin * time,
    INT: time,
    DEM: mem * time,
    NME: time,
    RGT: mem * reg * time,
    CLM: time,
  };

  return (
    <section id="seed" className="scroll-mt-24">
      <SectionHead index="01" eyebrow="THE SEED" title="Your move becomes a vector.">
        <p>
          MiroFish calls the input a world seed — a scenario dropped into the tank. Here, the seed
          is your proposed action. A category maps it to a base vector across the eight policy
          axes; four sliders scale its magnitude. Nothing more exotic than that.
        </p>
      </SectionHead>

      {/* Worked example callout */}
      <Reveal className="mt-8 rounded-xl bg-paper-deep p-6">
        <p className="mono-label text-[11px] text-gray-500">WORKED EXAMPLE</p>
        <p className="mono-data mt-2 text-ink">
          CATEGORY: <span className="text-council">{category.label.toUpperCase()}</span>
        </p>
        <p className="mono-data text-gray-500">
          SLIDERS: FIN {EXAMPLE.sliders.financial} · MEM {EXAMPLE.sliders.member} · REG{' '}
          {EXAMPLE.sliders.regulatory} · TIME {EXAMPLE.sliders.timeline} → SCALARS{' '}
          {fin.toFixed(2)} · {mem.toFixed(2)} · {reg.toFixed(2)} · {time.toFixed(2)}
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[460px] border-collapse">
            <thead>
              <tr className="mono-label border-b border-gray-300 text-left text-[10px] text-gray-500">
                <th className="py-1.5 pr-3 font-medium">AXIS</th>
                <th className="py-1.5 pr-3 font-medium">BASE</th>
                <th className="py-1.5 pr-3 font-medium">× SCALE</th>
                <th className="py-1.5 text-right font-medium">SCALED</th>
              </tr>
            </thead>
            <tbody>
              {AXIS_ORDER.map((ax, i) => (
                <motion.tr
                  key={ax}
                  className="mono-data border-b border-gray-200/80 last:border-0"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: EASE }}
                >
                  <td className="py-1.5 pr-3 text-ink">{ax}</td>
                  <td className="py-1.5 pr-3 text-gray-500">{fmt(category.base[i])}</td>
                  <td className="py-1.5 pr-3 text-gray-500">{perAxisScale[ax].toFixed(3)}</td>
                  <td className="py-1.5 text-right text-council">
                    {scaled[i] >= 0 ? '+' : '−'}
                    <TweenNumber value={Math.abs(scaled[i])} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      {/* Category base-vector table */}
      <Reveal className="mt-8" delay={0.05}>
        <p className="mono-label text-[11px] text-gray-500">
          ALL EIGHT CATEGORY BASE VECTORS — [AFF, AUT, FND, INT, DEM, NME, RGT, CLM]
        </p>
        <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-surface">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="mono-label border-b border-gray-200 bg-paper-deep/60 text-left text-[10px] text-gray-500">
                <th className="px-4 py-2.5 font-medium">CATEGORY</th>
                {AXIS_ORDER.map((ax) => (
                  <th key={ax} className="px-2 py-2.5 text-right font-medium">
                    {ax}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-200/70 last:border-0 transition-colors hover:bg-paper-deep/50"
                >
                  <td className="px-4 py-2.5 text-ink">{c.label}</td>
                  {c.base.map((v, i) => (
                    <td
                      key={i}
                      className={
                        v > 0
                          ? 'px-2 py-2.5 text-right font-mono text-[13px] tabular-nums text-support'
                          : v < 0
                            ? 'px-2 py-2.5 text-right font-mono text-[13px] tabular-nums text-oppose'
                            : 'px-2 py-2.5 text-right font-mono text-[13px] tabular-nums text-gray-500'
                      }
                    >
                      {fmt(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </section>
  );
}
