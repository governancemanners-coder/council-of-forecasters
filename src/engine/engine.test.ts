import { describe, expect, it } from "vitest";
import { SAMPLE_SEED } from "./categories";
import { runSimulation } from "./engine";
import type { ScenarioSeed } from "./types";

describe("runSimulation", () => {
  it("forecasts the sample seed as contested and repeats exactly", () => {
    const first = runSimulation(SAMPLE_SEED);
    const second = runSimulation(SAMPLE_SEED);

    expect(first.forecast.band.key).toBe("contested");
    expect(first.forecast.band.word).toBe("Contested — the middle decides.");
    expect(first.forecast.probability).toBe(37);
    expect(first.veto).toBeNull();
    expect(first.rounds).toHaveLength(4);
    expect(first.forecast).toEqual(second.forecast);
    expect(first.seedHash).toBe(second.seedHash);
  });

  it("blocks intensification that skips a member vote at high financial scale", () => {
    const seed: ScenarioSeed = {
      text: "Partner with a developer to build a 6-storey rental addition on our parking lot, with proceeds funding deep energy retrofits.",
      categoryId: "intensification",
      sliders: { financial: 65, member: 55, regulatory: 45, timeline: 50 },
    };
    const run = runSimulation(seed);

    expect(run.veto).not.toBeNull();
    expect(run.forecast.band.key).toBe("blocked");
    expect(run.forecast.probability).toBeLessThanOrEqual(20);
  });
});
