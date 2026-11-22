import { describe, expect, it } from 'vitest';
import { SAMPLE_SEED } from './categories';
import {
  checkConstraints,
  hashString,
  runSimulation,
  seedHash,
} from './engine';

describe('hashString / seedHash', () => {
  it('is deterministic', () => {
    expect(hashString('hello')).toBe(hashString('hello'));
    expect(seedHash(SAMPLE_SEED.text)).toMatch(/^[0-9A-F]{6}$/);
  });
});

describe('checkConstraints', () => {
  it('flags CCA violation for structural change without member-vote wording', () => {
    const checks = checkConstraints({
      text: 'Sell the parking lot to a developer for a condo tower.',
      categoryId: 'disposition',
      sliders: { financial: 80, member: 40, regulatory: 40, timeline: 40 },
    });
    const cca = checks.find((c) => c.short === 'CCA');
    expect(cca?.status).toBe('violated');
  });

  it('clears RTA for non-eviction seeds', () => {
    const checks = checkConstraints({
      ...SAMPLE_SEED,
      text: SAMPLE_SEED.text,
    });
    const rta = checks.find((c) => c.short === 'RTA');
    expect(rta?.status).toBe('clear');
  });
});

describe('runSimulation', () => {
  it('returns four rounds, twelve stances, and a forecast band', () => {
    const run = runSimulation(SAMPLE_SEED);
    expect(run.rounds).toHaveLength(4);
    expect(run.initialStances).toHaveLength(12);
    expect(run.forecast.finalStances).toHaveLength(12);
    expect(run.forecast.probability).toBeGreaterThanOrEqual(0);
    expect(run.forecast.probability).toBeLessThanOrEqual(100);
    expect(run.forecast.band.key).toBeTruthy();
    expect(run.forecast.summary.length).toBeGreaterThan(20);
    for (const round of run.rounds) {
      expect(round.stances).toHaveLength(12);
      expect(round.messages.some((m) => m.kind === 'chat')).toBe(true);
    }
  });

  it('is deterministic for the same seed', () => {
    const a = runSimulation(SAMPLE_SEED);
    const b = runSimulation(SAMPLE_SEED);
    expect(a.forecast.probability).toBe(b.forecast.probability);
    expect(a.forecast.band.key).toBe(b.forecast.band.key);
    expect(a.rounds[0].stances).toEqual(b.rounds[0].stances);
    expect(a.rounds[0].messages[0]?.text).toBe(b.rounds[0].messages[0]?.text);
  });

  it('applies a legal veto for unlawful eviction framing', () => {
    const run = runSimulation({
      text: 'Evict members in arrears without going through the Landlord and Tenant Board.',
      categoryId: 'eviction',
      sliders: { financial: 30, member: 70, regulatory: 60, timeline: 80 },
    });
    expect(run.veto).not.toBeNull();
    expect(run.forecast.band.key).toBe('blocked');
  });
});
