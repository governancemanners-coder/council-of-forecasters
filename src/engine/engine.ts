import type {
  ActorId,
  ChatMessage,
  ConstraintCheck,
  ForecastResult,
  Persuadable,
  RoundState,
  ScenarioSeed,
  SequenceStop,
  SimulationRun,
  StanceBucket,
  VerdictBand,
  VerdictKey,
  VetoInfo,
} from './types';
import { ROUND_NAMES } from './types';
import { ACTORS, ACTOR_BY_ID, ACTOR_INDEX, GATEKEEPERS } from './actors';
import { computeActionVector, hasMemberVoteWording } from './categories';
import { INFLUENCE_MATRIX } from './influence';

/* ------------------------------------------------------------------ */
/* Deterministic hashing                                               */
/* ------------------------------------------------------------------ */

/** FNV-1a 32-bit hash — deterministic across runs and machines. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function seedHash(text: string): string {
  return hashString(text).toString(16).padStart(8, '0').slice(0, 6).toUpperCase();
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ------------------------------------------------------------------ */
/* Hard-constraint layer (the five frameworks)                         */
/* ------------------------------------------------------------------ */

/**
 * Evaluate the five legal/UN frameworks against a seed.
 * Trigger rules — design/simulator.md Pane 1 §5.
 */
export function checkConstraints(seed: ScenarioSeed): ConstraintCheck[] {
  const { categoryId, sliders } = seed;
  const wording = hasMemberVoteWording(seed.text);
  const structural = categoryId === 'disposition' || categoryId === 'intensification';

  const checks: ConstraintCheck[] = [];

  // 1. Co-operative Corporations Act
  if (structural && sliders.financial > 60 && !wording) {
    checks.push({
      framework: 'Co-operative Corporations Act (Ontario)',
      short: 'CCA',
      status: 'violated',
      basis:
        'Disposition or fundamental change at this financial scale without member-approval wording — a members’ special resolution is required.',
    });
  } else if (structural && !wording) {
    checks.push({
      framework: 'Co-operative Corporations Act (Ontario)',
      short: 'CCA',
      status: 'at-risk',
      basis: 'Structural change without explicit member-vote wording — expect a special-resolution requirement.',
    });
  } else if (structural) {
    checks.push({
      framework: 'Co-operative Corporations Act (Ontario)',
      short: 'CCA',
      status: 'at-risk',
      basis: 'Member-vote wording present, but the special-resolution threshold must still be met and minuted.',
    });
  } else {
    checks.push({
      framework: 'Co-operative Corporations Act (Ontario)',
      short: 'CCA',
      status: 'clear',
      basis: 'CCA: no disposition or fundamental-change action in this seed — clear.',
    });
  }

  // 2. Residential Tenancies Act
  if (categoryId === 'eviction' && sliders.member > 40) {
    checks.push({
      framework: 'Residential Tenancies Act (Ontario)',
      short: 'RTA',
      status: 'violated',
      basis: 'Eviction/arrears enforcement at this member-impact level must run through the LTB (Part V.1) — any shortcut is unlawful.',
    });
  } else if (categoryId === 'eviction') {
    checks.push({
      framework: 'Residential Tenancies Act (Ontario)',
      short: 'RTA',
      status: 'at-risk',
      basis: 'Eviction action present — LTB process and Part V.1 carve-outs apply.',
    });
  } else {
    checks.push({
      framework: 'Residential Tenancies Act (Ontario)',
      short: 'RTA',
      status: 'clear',
      basis: 'RTA: no eviction action in this seed — clear.',
    });
  }

  // 3. Ontario Human Rights Code
  if (categoryId === 'occupancy' && sliders.member > 60) {
    checks.push({
      framework: 'Ontario Human Rights Code',
      short: 'HRC',
      status: 'violated',
      basis: 'Occupancy/intake rules at this impact level risk differential impact on Code-protected grounds.',
    });
  } else if (categoryId === 'occupancy') {
    checks.push({
      framework: 'Ontario Human Rights Code',
      short: 'HRC',
      status: 'at-risk',
      basis: 'Occupancy-policy action — screen for differential impact and the duty to accommodate.',
    });
  } else {
    checks.push({
      framework: 'Ontario Human Rights Code',
      short: 'HRC',
      status: 'clear',
      basis: 'Code: no occupancy-rule change in this seed — clear.',
    });
  }

  // 4. National Housing Strategy Act
  if (categoryId === 'disposition' && sliders.financial > 60) {
    checks.push({
      framework: 'National Housing Strategy Act (Canada)',
      short: 'NHS',
      status: 'violated',
      basis: 'Asset sale at this scale implies net loss of affordable units — a retrogressive measure under the NHS framework.',
    });
  } else if (categoryId === 'disposition' || (categoryId === 'intensification' && sliders.financial > 75)) {
    checks.push({
      framework: 'National Housing Strategy Act (Canada)',
      short: 'NHS',
      status: 'at-risk',
      basis: 'NHS Act review: any net loss of affordable units triggers the right-to-housing framework.',
    });
  } else {
    checks.push({
      framework: 'National Housing Strategy Act (Canada)',
      short: 'NHS',
      status: 'clear',
      basis: 'NHS Act: no net loss of affordable units in this seed — clear.',
    });
  }

  // 5. UN CESCR Art. 11
  if ((categoryId === 'eviction' && sliders.member > 70) || (categoryId === 'disposition' && sliders.member > 60)) {
    checks.push({
      framework: 'UN CESCR Art. 11 / Special Rapporteur guidance',
      short: 'UN',
      status: 'violated',
      basis: 'Displacement without adequate alternatives violates the right to adequate housing.',
    });
  } else if (categoryId === 'disposition' || categoryId === 'eviction') {
    checks.push({
      framework: 'UN CESCR Art. 11 / Special Rapporteur guidance',
      short: 'UN',
      status: 'at-risk',
      basis: 'CESCR review: security of tenure and no-forced-displacement principles are engaged.',
    });
  } else {
    checks.push({
      framework: 'UN CESCR Art. 11 / Special Rapporteur guidance',
      short: 'UN',
      status: 'clear',
      basis: 'CESCR: no displacement risk in this seed — clear.',
    });
  }

  return checks;
}

/** Build the VetoInfo from the first violated framework, or null. */
export function detectVeto(seed: ScenarioSeed, checklist?: ConstraintCheck[]): VetoInfo | null {
  const checks = checklist ?? checkConstraints(seed);
  const violated = checks.find((c) => c.status === 'violated');
  if (!violated) return null;
  return { statute: violated.framework, clause: violated.basis, ceiling: 'BLOCKED' };
}

/* ------------------------------------------------------------------ */
/* Stances                                                             */
/* ------------------------------------------------------------------ */

/** stance₀(i) = clamp( (wᵢ · a) / 9 × salienceᵢ, −1, +1 ). */
export function computeInitialStances(seed: ScenarioSeed): number[] {
  const a = computeActionVector(seed.categoryId, seed.sliders);
  const veto = detectVeto(seed);
  return ACTORS.map((actor) => {
    if (actor.isVetoChair && veto) return -1;
    const dot = actor.weights.reduce((acc, w, i) => acc + w * a[i], 0);
    return clamp((dot / 9) * actor.salience, -1, 1);
  });
}

/** One cascade step: sᵢ(t+1) = (1−λᵢ)·sᵢ(t) + λᵢ·Σⱼ Mᵢⱼ·sⱼ(t). */
export function cascadeStep(stances: number[], veto: VetoInfo | null): number[] {
  return ACTORS.map((actor, i) => {
    if (actor.isVetoChair) {
      // λ = 0 — immune. Veto locks Counsel at −1.
      return veto ? -1 : stances[i];
    }
    let inflow = 0;
    for (let j = 0; j < 12; j++) inflow += INFLUENCE_MATRIX[i][j] * stances[j];
    return clamp((1 - actor.lambda) * stances[i] + actor.lambda * inflow, -1, 1);
  });
}

export function bucketOf(stance: number): StanceBucket {
  if (stance > 0.15) return 'support';
  if (stance < -0.15) return 'oppose';
  return 'cautious';
}

/* ------------------------------------------------------------------ */
/* Simulation                                                          */
/* ------------------------------------------------------------------ */

const VETO_AMPLIFICATION_LINE = "Counsel's objection is our objection, louder.";

function pickVoice(actorId: ActorId, bucket: StanceBucket, seedText: string, round: number): string {
  const actor = ACTOR_BY_ID[actorId];
  const lines = actor.voice[bucket];
  const idx = hashString(`${seedText}::${actorId}::${round}`) % 3;
  return lines[idx];
}

function buildRoundMessages(
  seed: ScenarioSeed,
  round: number,
  prev: number[],
  cur: number[],
  veto: VetoInfo | null,
): ChatMessage[] {
  const entries = ACTORS.map((actor, i) => ({
    actor,
    i,
    stance: cur[i],
    delta: cur[i] - prev[i],
  }));
  // Loudest movers first; ties broken by seat order.
  entries.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.actor.seat - b.actor.seat);

  const chftIdx = ACTOR_INDEX.chft;
  const chfIdx = ACTOR_INDEX.chf;
  const sectorAligned = Math.abs(cur[chftIdx] - cur[chfIdx]) <= 0.1;

  const messages: ChatMessage[] = [];
  for (const { actor, stance, delta } of entries) {
    const bucket = veto && actor.isVetoChair ? 'oppose' : bucketOf(stance);
    let text = pickVoice(actor.id, bucket, seed.text, round);
    let tag: string | undefined;

    if (veto && actor.id === 'advocacy') {
      text = VETO_AMPLIFICATION_LINE;
      tag = 'REACTS TO LEGAL COUNSEL';
    } else if (actor.id === 'ward' && Math.abs(delta) > 0.15) {
      tag = 'TRACKING THE ROOM';
    } else if (sectorAligned && (actor.id === 'chft' || actor.id === 'chf')) {
      tag = 'SECTOR ALIGNMENT';
    }

    messages.push({
      id: `r${round}-${actor.id}`,
      kind: 'chat',
      actorId: actor.id,
      round,
      text,
      bucket,
      stance,
      delta,
      tag,
    });

    // Veto injection: VetoFlag immediately after Counsel's message.
    if (veto && actor.isVetoChair) {
      messages.push({
        id: `r${round}-veto`,
        kind: 'veto',
        actorId: 'counsel',
        round,
        text: `HARD CONSTRAINT — ${veto.statute}. ${veto.clause}`,
        bucket: 'oppose',
        stance: -1,
        delta: 0,
        veto,
      });
    }
  }
  return messages;
}

/**
 * Run the full 4-round caucus. Deterministic: identical seed ⇒ identical transcript.
 * Round 1 = first readings (initial stances); rounds 2–4 = cascade steps.
 */
export function runSimulation(seed: ScenarioSeed): SimulationRun {
  const actionVector = computeActionVector(seed.categoryId, seed.sliders);
  const checklist = checkConstraints(seed);
  const veto = detectVeto(seed, checklist);
  const initial = computeInitialStances(seed);

  const rounds: RoundState[] = [];
  let prev: number[] = new Array<number>(12).fill(0);
  let cur: number[] = initial;

  for (let r = 1; r <= 4; r++) {
    if (r > 1) {
      cur = cascadeStep(prev, veto);
    }
    rounds.push({
      round: r,
      name: ROUND_NAMES[r - 1],
      stances: [...cur],
      messages: buildRoundMessages(seed, r, r === 1 ? new Array<number>(12).fill(0) : prev, cur, veto),
    });
    prev = cur;
  }

  const run: SimulationRun = {
    seed,
    seedHash: seedHash(seed.text),
    actionVector,
    initialStances: initial,
    rounds,
    checklist,
    veto,
    forecast: undefined as unknown as ForecastResult,
  };
  run.forecast = computeForecast(run);
  return run;
}

/* ------------------------------------------------------------------ */
/* Forecast                                                            */
/* ------------------------------------------------------------------ */

export const VERDICT_BANDS: Record<VerdictKey, VerdictBand> = {
  blocked: {
    key: 'blocked',
    label: 'BLOCKED',
    word: 'Blocked.',
    range: [0, 25],
    meaning: 'unlawful as framed',
    posture: 'cure the constraint first',
  },
  unlikely: {
    key: 'unlikely',
    label: 'UNLIKELY',
    word: 'Unlikely as framed.',
    range: [25, 40],
    meaning: 'opposition entrenched',
    posture: 'redesign the move',
  },
  contested: {
    key: 'contested',
    label: 'CONTESTED',
    word: 'Contested — the middle decides.',
    range: [40, 55],
    meaning: 'the middle decides',
    posture: 'negotiate conditions',
  },
  likely: {
    key: 'likely',
    label: 'LIKELY WITH CONDITIONS',
    word: 'Likely, with conditions.',
    range: [55, 70],
    meaning: 'support exists, price attached',
    posture: 'meet the conditions register',
  },
  mandate: {
    key: 'mandate',
    label: 'STRONG MANDATE',
    word: 'A strong mandate.',
    range: [70, 85],
    meaning: 'the room is with you',
    posture: 'move, and document it well',
  },
};

/** Strongest-magnitude axis driving an actor's stance, for bloc-card reasons. */
const AXIS_REASON: Record<string, string> = {
  AFF: 'affordability depth is their first question',
  AUT: 'co-op autonomy is their red line',
  FND: 'public funding is their scorecard',
  INT: 'density and new development drive their read',
  DEM: 'member democratic control is the whole ballgame',
  NME: 'growing the non-market stock is their mandate',
  RGT: 'member rights and due process come first',
  CLM: 'building renewal and decarbonization are their brief',
};

function reasonFor(actorIdx: number, stance: number): string {
  const w = ACTORS[actorIdx].weights;
  let best = 0;
  let bestMag = -1;
  for (let i = 0; i < 8; i++) {
    const aligned = stance >= 0 ? w[i] : -w[i];
    if (Math.abs(w[i]) > 0 && aligned > bestMag) {
      bestMag = aligned;
      best = i;
    }
  }
  const axis = ['AFF', 'AUT', 'FND', 'INT', 'DEM', 'NME', 'RGT', 'CLM'][best];
  return AXIS_REASON[axis];
}

const SEQUENCE_TEMPLATES: Record<ActorId, SequenceStop> = {
  counsel: {
    actorId: 'counsel',
    action: 'Brief counsel',
    rationale: 'Get the opinion letter before anything is announced.',
  },
  cmhc: { actorId: 'cmhc', action: 'Attach the application', rationale: 'Attach the seed-funding application; criteria first.' },
  mmah: { actorId: 'mmah', action: 'Cure the process', rationale: 'Show the Ministry documented compliance — notice, quorum, resolution, minutes.' },
  city: { actorId: 'city', action: 'Sign the accountability framework', rationale: 'Milestones and reporting unlock the City’s support.' },
  board: { actorId: 'board', action: 'Minute the conditions', rationale: 'Give the board a fiduciary analysis it can sign.' },
  ward: { actorId: 'ward', action: 'Brief early', rationale: 'Brief early, privately, with the funding secured.' },
  chft: { actorId: 'chft', action: 'Bring precedents', rationale: 'Bring peer co-op precedents to your members.' },
  chf: { actorId: 'chf', action: 'Broker the program', rationale: 'Let CHF Canada flag your file to program officers.' },
  assembly: { actorId: 'assembly', action: 'Call the town hall', rationale: 'Only now: the town hall, then the vote.' },
  advocacy: { actorId: 'advocacy', action: 'Publish the covenant', rationale: 'Publish the covenant the same day.' },
  developer: { actorId: 'developer', action: 'Fix the terms', rationale: 'Terms before announcements — capital walks from surprises.' },
  nhc: { actorId: 'nhc', action: 'Publish the rights assessment', rationale: 'A public rights-impact assessment closes the file.' },
};

export function computeForecast(run: Pick<SimulationRun, 'rounds' | 'veto' | 'checklist' | 'seedHash'>): ForecastResult {
  const final = run.rounds[run.rounds.length - 1].stances;

  // Influence-weighted mean of the five gatekeepers.
  let wSum = 0;
  let gSum = 0;
  for (const id of GATEKEEPERS) {
    const i = ACTOR_INDEX[id];
    const inf = ACTORS[i].influence;
    wSum += inf;
    gSum += inf * final[i];
  }
  const g = gSum / wSum;

  const supportCount = final.filter((s) => s > 0.3).length;
  const opposeCount = final.filter((s) => s < -0.3).length;
  const middleIdx = ACTORS.map((_, i) => i).filter((i) => final[i] >= -0.3 && final[i] <= 0.3);

  // Point probability: gatekeeper mean adjusted by coalition spread.
  let probability = clamp(Math.round(50 + g * 38 + (supportCount - opposeCount) * 1.2), 4, 92);

  let band: VerdictBand;
  if (run.veto || probability < 25) {
    band = VERDICT_BANDS.blocked;
    probability = Math.min(probability, 20);
  } else if (probability < 32.5) band = VERDICT_BANDS.unlikely;
  else if (probability < 47.5) band = VERDICT_BANDS.contested;
  else if (probability < 62.5) band = VERDICT_BANDS.likely;
  else band = VERDICT_BANDS.mandate;

  const allies = final
    .map((s, i) => ({ actorId: ACTORS[i].id, stance: s, reason: reasonFor(i, s) }))
    .filter((e) => e.stance > 0.3)
    .sort((a, b) => b.stance - a.stance);
  const bloc = final
    .map((s, i) => ({ actorId: ACTORS[i].id, stance: s, reason: reasonFor(i, s) }))
    .filter((e) => e.stance < -0.3)
    .sort((a, b) => a.stance - b.stance);
  const middle: Persuadable[] = middleIdx
    .map((i) => ({
      actorId: ACTORS[i].id,
      stance: final[i],
      flipCondition: ACTORS[i].qa.support,
      projected: clamp(final[i] + 0.45, -1, 1),
    }))
    .sort((a, b) => ACTOR_BY_ID[b.actorId].influence - ACTOR_BY_ID[a.actorId].influence);

  // Sequencing: counsel first; persuadable gatekeepers next (desc influence);
  // then ward; then sector; sovereign body second-to-last; public advocacy last.
  const sequencing: SequenceStop[] = [];
  sequencing.push({
    ...SEQUENCE_TEMPLATES.counsel,
    rationale: run.veto
      ? 'Cure the constraint first — the ceiling holds until counsel’s letter says otherwise.'
      : SEQUENCE_TEMPLATES.counsel.rationale,
  });
  const middleGatekeepers = middle
    .filter((m) => (GATEKEEPERS as ActorId[]).includes(m.actorId) && m.actorId !== 'board')
    .map((m) => SEQUENCE_TEMPLATES[m.actorId]);
  sequencing.push(...middleGatekeepers);
  if (!sequencing.some((s) => s.actorId === 'ward')) sequencing.push(SEQUENCE_TEMPLATES.ward);
  sequencing.push(SEQUENCE_TEMPLATES.chft);
  sequencing.push(SEQUENCE_TEMPLATES.assembly);
  sequencing.push(SEQUENCE_TEMPLATES.advocacy);

  // Plain-language summary.
  const gkNotes: string[] = [];
  const gkSplit = GATEKEEPERS.map((id) => ({ id, s: final[ACTOR_INDEX[id]] }));
  const gkSupport = gkSplit.filter((x) => x.s > 0.3).map((x) => ACTOR_BY_ID[x.id].shortName);
  const gkOppose = gkSplit.filter((x) => x.s < -0.3).map((x) => ACTOR_BY_ID[x.id].shortName);
  const gkMiddle = gkSplit.filter((x) => x.s >= -0.3 && x.s <= 0.3).map((x) => ACTOR_BY_ID[x.id].shortName);
  if (gkSupport.length) gkNotes.push(`${gkSupport.join(' and ')} lean${gkSupport.length > 1 ? '' : 's'} in`);
  if (gkMiddle.length) gkNotes.push(`${gkMiddle.join(' and ')} ${gkMiddle.length > 1 ? 'are' : 'is'} persuadable`);
  if (gkOppose.length) gkNotes.push(`${gkOppose.join(' and ')} ${gkOppose.length > 1 ? 'are' : 'is'} dug in`);
  const summary = run.veto
    ? `Counsel has raised a hard constraint under the ${run.veto.statute}. The ceiling holds at Blocked until the move is cured — ${band.posture}. Among the gatekeepers: ${gkNotes.join('; ')}.`
    : `${supportCount} seat${supportCount === 1 ? '' : 's'} lean${supportCount === 1 ? 's' : ''} in, ${middle.length} ${middle.length === 1 ? 'is' : 'are'} persuadable, ${opposeCount} ${opposeCount === 1 ? 'is' : 'are'} dug in. Among the gatekeepers: ${gkNotes.join('; ')}. Recommended posture: ${band.posture}.`;

  return {
    seedHash: run.seedHash,
    band,
    probability,
    veto: run.veto,
    summary,
    allies,
    middle,
    bloc,
    sequencing,
    checklist: run.checklist,
    finalStances: final,
  };
}

/** Round label for chips: `ROUND 2 / 4`. */
export function roundLabel(r: number): string {
  return `ROUND ${r} / 4`;
}

/** Bucket label + sign used by stance-delta chips. */
export function deltaChip(bucket: StanceBucket, delta: number): string {
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '±';
  const mag = Math.abs(delta).toFixed(2);
  return `${sign}${mag} ${bucket.toUpperCase()}`;
}
