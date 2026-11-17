import type { SimulationRun } from '@/engine';
import { ACTORS, ACTOR_BY_ID, CATEGORY_BY_ID, GATEKEEPERS } from '@/engine';
import { MIROFISH_CREDIT } from '@/components/Footer';

export function docketDate(): string {
  return new Date().toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v).toFixed(2)}`;

/** Plain-text minutes-style docket summary for clipboard export. */
export function buildDocketText(run: SimulationRun): string {
  const { forecast } = run;
  const lines: string[] = [
    'COUNCIL OF FORECASTERS — FORECAST DOCKET',
    `SEED #${run.seedHash} · ${docketDate()} · 12 SEATS · 4 ROUNDS`,
    'DETERMINISTIC — IDENTICAL SEED, IDENTICAL RECORD',
    '',
    `THE MOVE: ${run.seed.text}`,
    `CATEGORY: ${CATEGORY_BY_ID[run.seed.categoryId].label}`,
    `SLIDERS: FIN ${run.seed.sliders.financial} · MEM ${run.seed.sliders.member} · REG ${run.seed.sliders.regulatory} · TIME ${run.seed.sliders.timeline}`,
    '',
    `VERDICT: ${forecast.band.label} — ${forecast.veto ? 'capped by hard constraint' : `${forecast.probability}% (${forecast.band.range[0]}–${forecast.band.range[1]}%)`}`,
  ];
  if (forecast.veto) {
    lines.push(`HARD CONSTRAINT — ${forecast.veto.statute}: ${forecast.veto.clause}`);
  }
  lines.push('', forecast.summary, '');

  lines.push('ALLIES:');
  for (const a of forecast.allies) {
    lines.push(`  ${ACTOR_BY_ID[a.actorId].name} (${signed(a.stance)}) — ${a.reason}`);
  }
  lines.push('THE PERSUADABLE MIDDLE:');
  for (const m of forecast.middle) {
    lines.push(`  ${ACTOR_BY_ID[m.actorId].name} (${signed(m.stance)}) — flips if: ${m.flipCondition} → ${signed(m.projected)} if met`);
  }
  lines.push('THE BLOC:');
  for (const b of forecast.bloc) {
    lines.push(`  ${ACTOR_BY_ID[b.actorId].name} (${signed(b.stance)}) — ${b.reason}`);
  }

  lines.push('', 'RECOMMENDED SEQUENCING:');
  forecast.sequencing.forEach((s, i) => {
    lines.push(`  ${i + 1}. ${ACTOR_BY_ID[s.actorId].name} — ${s.rationale}`);
  });

  lines.push('', 'CONSTRAINT CHECKLIST:');
  for (const c of run.checklist) {
    lines.push(`  [${c.status.toUpperCase()}] ${c.framework} — ${c.basis}`);
  }

  lines.push(
    '',
    '—',
    MIROFISH_CREDIT,
    'Educational simulation. Deterministic output of a simplified model. Not legal advice, not a guarantee — a rehearsal.',
  );
  return lines.join('\n');
}

/**
 * Band delta if the top-N persuadable conditions were met: recompute the
 * influence-weighted gatekeeper mean with projected stances substituted.
 */
export function projectedBandAfterFlips(run: SimulationRun, topN = 3): { probability: number; label: string } {
  const { forecast } = run;
  const final = [...forecast.finalStances];
  const top = forecast.middle.slice(0, topN);
  const flip = new Map(top.map((m) => [m.actorId, m.projected]));

  let wSum = 0;
  let gSum = 0;
  for (const id of GATEKEEPERS) {
    const actor = ACTOR_BY_ID[id];
    const idx = actor.seat - 1;
    const stance = flip.get(id) ?? final[idx];
    wSum += actor.influence;
    gSum += actor.influence * stance;
  }
  const g = gSum / wSum;

  // Apply flips to the coalition spread too.
  const adjusted = final.map((s, i) => flip.get(ACTORS[i].id) ?? s);
  const supportCount = adjusted.filter((s) => s > 0.3).length;
  const opposeCount = adjusted.filter((s) => s < -0.3).length;

  let probability = Math.round(50 + g * 38 + (supportCount - opposeCount) * 1.2);
  probability = Math.min(92, Math.max(4, probability));

  const label =
    run.veto || probability < 25
      ? 'BLOCKED'
      : probability < 32.5
        ? 'UNLIKELY (25–40%)'
        : probability < 47.5
          ? 'CONTESTED (40–55%)'
          : probability < 62.5
            ? 'LIKELY WITH CONDITIONS (55–70%)'
            : 'STRONG MANDATE (70–85%)';
  return { probability, label };
}
