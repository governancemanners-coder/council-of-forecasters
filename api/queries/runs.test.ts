import { afterEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { SAMPLE_SEED, runSimulation } from '@/engine';
import {
  getLatestSimulationRun,
  listSimulationHistory,
  persistSimulationRun,
} from './runs';

const DOCKET = path.resolve(process.cwd(), '.data', 'simulation-runs.json');

afterEach(async () => {
  await fs.rm(DOCKET, { force: true });
});

describe('file docket persistence', () => {
  it('persists and reads back a run when DATABASE_URL is unset', async () => {
    const run = runSimulation(SAMPLE_SEED);
    await persistSimulationRun({
      seedText: SAMPLE_SEED.text,
      categoryId: SAMPLE_SEED.categoryId,
      meta: { engine: 'deterministic', model: null, llmLayers: 0 },
      run,
    });

    const latest = await getLatestSimulationRun();
    expect(latest).not.toBeNull();
    expect(latest!.verdictKey).toBe(run.forecast.band.key);
    expect(latest!.run.forecast.probability).toBe(run.forecast.probability);

    const history = await listSimulationHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].seedText).toBe(SAMPLE_SEED.text);
  });
});
