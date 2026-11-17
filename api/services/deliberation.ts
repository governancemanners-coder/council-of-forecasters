/**
 * LLM-powered Council deliberation.
 *
 * Architecture: the deterministic engine (`src/engine`) remains the source of
 * truth for the MATH (stances, cascade, vetoes, forecast bands) — it always
 * runs first. The LLM then does the part templates can't: genuine per-agent
 * deliberation in each seat's voice, reacting to the scenario and to each
 * other, plus a ReportAgent synthesis. If any LLM call fails (free-tier rate
 * limits), that layer silently falls back to the deterministic text, so the
 * Council always convenes — honestly labelled via `meta`.
 */
import {
  ACTORS,
  ACTOR_INDEX,
  runSimulation,
  CATEGORY_BY_ID,
  AXIS_NAMES,
  AXIS_ORDER,
  ROUND_NAMES,
  type Actor,
  type ActorId,
  type SimulationRun,
  type ScenarioSeed,
  type Vector8,
} from "@/engine";
import { extractJson, llmAvailable, llmChat, llmConfigured, llmModelInUse } from "../lib/llm";

export interface RunMeta {
  engine: "llm" | "deterministic";
  model: string | null;
  /** How many of the 5 LLM layers (4 rounds + synthesis) succeeded. */
  llmLayers: number;
}

const SEAT_ORDER: ActorId[] = ACTORS.map((a) => a.id);

function vectorDigest(v: Vector8): string {
  return AXIS_ORDER.map((ax, i) => `${ax} ${v[i] >= 0 ? "+" : ""}${v[i].toFixed(1)}`)
    .filter((_, i) => Math.abs(v[i]) > 0.05)
    .join(", ");
}

function personaCard(a: Actor): string {
  const weights = AXIS_ORDER.map(
    (ax, i) => `${ax}(${AXIS_NAMES[ax]}): ${a.weights[i] > 0 ? "+" : ""}${a.weights[i]}`,
  ).join(", ");
  return [
    `SEAT ${a.seat} — id "${a.id}" — ${a.name} (${a.orgLabel}).`,
    `Persona: ${a.persona}`,
    `Preference map (−3..+3): ${weights}. Salience ${a.salience}, influence ${a.influence}.`,
    a.hardConstraints.length ? `Hard constraints: ${a.hardConstraints.join("; ")}.` : "No hard constraints — persuadable.",
    `Leverage available: ${a.policyOptions.join("; ")}.`,
  ].join("\n");
}

const COUNCIL_SYSTEM = `You are the simulation core of the Council of Forecasters — a 12-seat deliberation chamber modeling the Toronto, Ontario housing co-operative sector. You will be given a member's proposed action ("the seed") and, for each round, every seat's computed stance (−1 = total opposition, +1 = full support) from a preference-map model.

Your job: for EACH of the 12 seats, write that actor's authentic first-person statement for this round — what they would actually say in caucus given their persona, preference map, hard constraints, available leverage, the computed stance, and what other seats have said so far. Statements must:
- sound like that actor (a lawyer cites statutes; a federation talks sector strategy; a councillor counts votes; an advocate warns about displacement);
- be 1–3 sentences, spoken aloud, no headers, no emoji;
- be consistent with the stance score provided (do not soften or harden it);
- reference specifics of the seed where possible;
- in rounds 2–4, react to the named cross-currents (e.g., answer Legal Counsel, rally or reassure the Members' Assembly).

Return ONLY a JSON array of exactly 12 objects: [{"actorId":"board","statement":"..."}, ...] using the exact seat ids given. No commentary outside the JSON.`;

function roundUserPrompt(
  seed: ScenarioSeed,
  run: SimulationRun,
  roundIdx: number,
): string {
  const round = run.rounds[roundIdx];
  const cat = CATEGORY_BY_ID[seed.categoryId];
  const lines: string[] = [
    `THE SEED (member's proposed action): "${seed.text}"`,
    `Category: ${cat.label}. Action vector: ${vectorDigest(run.actionVector)}.`,
    run.veto
      ? `LEGAL VETO IN EFFECT: ${run.veto.statute} — ${run.veto.clause}. The forecast is capped at BLOCKED; Legal Counsel is locked at −1 and immune to pressure.`
      : "No legal veto in effect.",
    "",
    `THIS IS ROUND ${round.round} OF 4 — ${ROUND_NAMES[round.round - 1]}.`,
    "Computed stances after this round (use exactly these):",
  ];
  for (const a of ACTORS) {
    const i = ACTOR_INDEX[a.id];
    const s = round.stances[i];
    const prev = roundIdx > 0 ? run.rounds[roundIdx - 1].stances[i] : 0;
    lines.push(
      `- ${a.id} (${a.shortName}): stance ${s.toFixed(2)} (moved ${s - prev >= 0 ? "+" : ""}${(s - prev).toFixed(2)})`,
    );
  }
  if (roundIdx > 0) {
    lines.push("", "What was said in the previous round (react where natural):");
    for (const m of run.rounds[roundIdx - 1].messages) {
      if (m.kind === "chat" && m.actorId) {
        lines.push(`- ${m.actorId}: "${m.text.slice(0, 220)}"`);
      } else if (m.kind === "veto") {
        lines.push(`- LEGAL COUNSEL raises a HARD CONSTRAINT: ${m.veto?.statute} — ${m.veto?.clause}`);
      }
    }
  }
  lines.push("", "Write the round now. JSON array of 12 statements, exact seat ids.");
  return lines.join("\n");
}

const REPORT_SYSTEM = `You are the ReportAgent of the Council of Forecasters. After a 4-round caucus simulation of the Toronto housing co-operative sector, you write the forecast narrative. You are precise, plain-spoken, and civic in tone. You never promise outcomes — you give probability bands, conditions, and sequencing. Return ONLY JSON, no commentary.`;

function synthesisUserPrompt(run: SimulationRun): string {
  const f = run.forecast;
  const lines: string[] = [
    `SEED: "${run.seed.text}" (${CATEGORY_BY_ID[run.seed.categoryId].label})`,
    `VERDICT: ${f.band.label} — probability ~${f.probability}% (band ${f.band.range[0]}–${f.band.range[1]}%).${run.veto ? ` VETO: ${run.veto.statute}.` : ""}`,
    "",
    "Final stances and computed blocs:",
  ];
  for (const a of ACTORS) {
    const i = ACTOR_INDEX[a.id];
    lines.push(`- ${a.id} (${a.shortName}): ${f.finalStances[i].toFixed(2)}`);
  }
  lines.push("", "Allies (computed): " + f.allies.map((b) => `${b.actorId}: ${b.reason}`).join(" | "));
  lines.push("Blockers (computed): " + f.bloc.map((b) => `${b.actorId}: ${b.reason}`).join(" | "));
  lines.push("Persuadable (computed): " + f.middle.map((p) => `${p.actorId}: flips if "${p.flipCondition}"`).join(" | "));
  lines.push("Sequencing (computed): " + f.sequencing.map((s) => `${s.actorId}: ${s.action}`).join(" | "));
  lines.push("");
  lines.push("Rewrite these as a real forecast narrative. Return JSON with EXACTLY this shape:");
  lines.push(`{
  "summary": "3-4 sentence executive summary of the forecast, naming the decisive dynamics",
  "allyReasons": {"<actorId>": "one concrete sentence why they back it"},  // only for the ally ids listed above
  "blocReasons": {"<actorId>": "one concrete sentence why they fight it"},  // only for the blocker ids listed above
  "flipConditions": {"<actorId>": "the single accommodation that flips them"},  // only for persuadable ids listed above
  "sequenceRationales": {"<actorId>": "why this stop comes at this point in the order"}  // only for sequencing ids listed above
}`);
  return lines.join("\n");
}

/** Run the full LLM deliberation layered on the deterministic engine. */
export async function runLlmSimulation(seed: ScenarioSeed): Promise<{ run: SimulationRun; meta: RunMeta }> {
  const run = runSimulation(seed);
  if (!llmConfigured() || !(await llmAvailable())) {
    return { run, meta: { engine: "deterministic", model: null, llmLayers: 0 } };
  }

  let llmLayers = 0;
  const councilSystem =
    COUNCIL_SYSTEM + "\n\nTHE TWELVE SEATS:\n" + ACTORS.map(personaCard).join("\n\n");

  // Rounds 1–4: genuine per-seat statements.
  for (let r = 0; r < run.rounds.length; r++) {
    try {
      const raw = await llmChat({
        system: councilSystem,
        user: roundUserPrompt(seed, run, r),
        maxTokens: 2600,
        temperature: 0.75,
      });
      const parsed = extractJson<{ actorId?: string; statement?: string }[]>(raw);
      const byId = new Map<string, string>();
      for (const item of parsed) {
        if (item.actorId && item.statement && SEAT_ORDER.includes(item.actorId as ActorId)) {
          byId.set(item.actorId, item.statement.trim());
        }
      }
      let replaced = 0;
      for (const m of run.rounds[r].messages) {
        if (m.kind === "chat" && m.actorId && byId.has(m.actorId)) {
          m.text = byId.get(m.actorId)!;
          replaced++;
        }
      }
      if (replaced >= 8) llmLayers++; // count the layer as LLM-driven if most seats got through
    } catch {
      // keep deterministic text for this round
    }
  }

  // Synthesis: ReportAgent narrative over the computed forecast.
  try {
    const raw = await llmChat({
      system: REPORT_SYSTEM,
      user: synthesisUserPrompt(run),
      maxTokens: 1800,
      temperature: 0.5,
    });
    const parsed = extractJson<{
      summary?: string;
      allyReasons?: Record<string, string>;
      blocReasons?: Record<string, string>;
      flipConditions?: Record<string, string>;
      sequenceRationales?: Record<string, string>;
    }>(raw);
    if (parsed.summary && parsed.summary.length > 40) {
      run.forecast.summary = parsed.summary.trim();
    }
    for (const b of run.forecast.allies) {
      const t = parsed.allyReasons?.[b.actorId];
      if (t) b.reason = t.trim();
    }
    for (const b of run.forecast.bloc) {
      const t = parsed.blocReasons?.[b.actorId];
      if (t) b.reason = t.trim();
    }
    for (const p of run.forecast.middle) {
      const t = parsed.flipConditions?.[p.actorId];
      if (t) p.flipCondition = t.trim();
    }
    for (const s of run.forecast.sequencing) {
      const t = parsed.sequenceRationales?.[s.actorId];
      if (t) s.rationale = t.trim();
    }
    llmLayers++;
  } catch {
    // keep deterministic forecast narrative
  }

  return {
    run,
    meta: { engine: llmLayers > 0 ? "llm" : "deterministic", model: llmModelInUse(), llmLayers },
  };
}
