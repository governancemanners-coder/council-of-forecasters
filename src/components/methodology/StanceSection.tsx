import { useMemo, useState } from 'react';
import type { ActorId, CategoryId, Sliders } from '@/engine';
import {
  ACTOR_BY_ID,
  AXIS_ORDER,
  computeActionVector,
  detectVeto,
} from '@/engine';
import { FormulaBlock, Reveal, SectionHead, TweenNumber } from '@/components/methodology/common';
import { cn } from '@/lib/utils';

const SAMPLE_SEEDS: Array<{ id: string; label: string; categoryId: CategoryId; sliders: Sliders }> = [
  {
    id: 'retrofit',
    label: 'Deep energy retrofit, financed by a green loan',
    categoryId: 'retrofit',
    sliders: { financial: 70, member: 40, regulatory: 20, timeline: 55 },
  },
  {
    id: 'intensification',
    label: 'Developer partnership: 6-storey addition on the lot',
    categoryId: 'intensification',
    sliders: { financial: 65, member: 55, regulatory: 45, timeline: 50 },
  },
  {
    id: 'charge',
    label: 'Housing charge increase of 8% over two years',
    categoryId: 'charge-increase',
    sliders: { financial: 50, member: 80, regulatory: 30, timeline: 60 },
  },
];

const SAMPLE_ACTORS: ActorId[] = ['assembly', 'cmhc', 'counsel'];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * 02 THE STANCE — the dot-product formula plus a live mini demo driven by
 * the real engine functions (computeActionVector, actor weights, salience).
 */
export default function StanceSection() {
  const [seedId, setSeedId] = useState(SAMPLE_SEEDS[0].id);
  const [actorId, setActorId] = useState<ActorId>('assembly');

  const seed = SAMPLE_SEEDS.find((s) => s.id === seedId)!;
  const actor = ACTOR_BY_ID[actorId];

  const demo = useMemo(() => {
    const a = computeActionVector(seed.categoryId, seed.sliders);
    const terms = AXIS_ORDER.map((ax, i) => ({ ax, w: actor.weights[i], a: a[i], p: actor.weights[i] * a[i] }));
    const dot = terms.reduce((acc, t) => acc + t.p, 0);
    const veto = detectVeto({ text: seed.label, categoryId: seed.categoryId, sliders: seed.sliders });
    const raw = (dot / 9) * actor.salience;
    const stance = actor.isVetoChair && veto ? -1 : clamp(raw, -1, 1);
    return { terms, dot, raw, stance, vetoLock: !!(actor.isVetoChair && veto) };
  }, [seed, actor]);

  return (
    <section id="stance" className="mt-24 scroll-mt-24">
      <SectionHead index="02" eyebrow="THE STANCE" title="Every seat reads the same move differently.">
        <p>
          Each actor’s preference weights (from −3 to +3 on each axis) dot against your action
          vector. Salience scales it — the Members’ Assembly cares about everything that touches
          their charges; the National Housing Council only leans in when rights do. The result is a
          first reading between full opposition (−1) and full support (+1).
        </p>
      </SectionHead>

      <FormulaBlock>
        stance₀(i) = clamp( ( w<sub>i</sub> · a ) / 9 × salience<sub>i</sub> , −1 , +1 )
      </FormulaBlock>

      {/* Mini interactive demo */}
      <Reveal className="mt-8 rounded-xl border border-gray-200 bg-surface p-6 shadow-paper-soft">
        <p className="mono-label text-[11px] text-council">TRY IT — LIVE, RUNNING THE REAL ENGINE</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mono-label text-[10px] text-gray-500">SAMPLE SEED</span>
            <select
              value={seedId}
              onChange={(e) => setSeedId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-paper px-3 py-2 text-sm text-ink focus:border-council focus:outline-none"
            >
              {SAMPLE_SEEDS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mono-label text-[10px] text-gray-500">SAMPLE SEAT</span>
            <select
              value={actorId}
              onChange={(e) => setActorId(e.target.value as ActorId)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-paper px-3 py-2 text-sm text-ink focus:border-council focus:outline-none"
            >
              {SAMPLE_ACTORS.map((id) => (
                <option key={id} value={id}>
                  {ACTOR_BY_ID[id].shortName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[440px] border-collapse">
            <thead>
              <tr className="mono-label border-b border-gray-200 text-left text-[10px] text-gray-500">
                <th className="py-1.5 pr-3 font-medium">AXIS</th>
                <th className="py-1.5 pr-3 font-medium">w (WEIGHT)</th>
                <th className="py-1.5 pr-3 font-medium">a (ACTION)</th>
                <th className="py-1.5 text-right font-medium">w × a</th>
              </tr>
            </thead>
            <tbody className="mono-data">
              {demo.terms.map((t) => (
                <tr key={t.ax} className="border-b border-gray-200/60 last:border-0">
                  <td className="py-1 pr-3 text-gray-500">{t.ax}</td>
                  <td className="py-1 pr-3 text-ink">{t.w > 0 ? `+${t.w}` : t.w}</td>
                  <td className="py-1 pr-3 text-ink">
                    {t.a >= 0 ? '+' : '−'}
                    {Math.abs(t.a).toFixed(2)}
                  </td>
                  <td
                    className={cn(
                      'py-1 text-right',
                      t.p > 0 ? 'text-support' : t.p < 0 ? 'text-oppose' : 'text-gray-500',
                    )}
                  >
                    {t.p >= 0 ? '+' : '−'}
                    {Math.abs(t.p).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mono-data mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-gray-200 pt-4">
          <span className="text-gray-500">dot =</span>
          <span className="text-ink">
            {demo.dot >= 0 ? '+' : '−'}
            {Math.abs(demo.dot).toFixed(2)}
          </span>
          <span className="text-gray-500">÷ 9 × salience {actor.salience.toFixed(1)} =</span>
          <span className="text-ink">
            {demo.raw >= 0 ? '+' : '−'}
            {Math.abs(demo.raw).toFixed(2)}
          </span>
          <span className="text-gray-500">→ stance₀</span>
          <span
            className={cn(
              'font-mono text-lg',
              demo.stance > 0 ? 'text-support' : demo.stance < 0 ? 'text-oppose' : 'text-gray-500',
            )}
          >
            {demo.stance >= 0 ? '+' : '−'}
            <TweenNumber value={Math.abs(demo.stance)} duration={0.35} />
          </span>
          {demo.vetoLock && (
            <span className="mono-label ml-2 rounded-full bg-[#FBEBEB] px-2 py-0.5 text-[10px] text-veto">
              VETO LOCKED AT −1.00
            </span>
          )}
        </div>
      </Reveal>
    </section>
  );
}
