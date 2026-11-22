/**
 * Optional seed script — the Council does not need fixture rows to run.
 * Simulation dockets are written by `simulation.run` as sessions complete.
 *
 * Usage (requires DATABASE_URL):
 *   npx tsx db/seed.ts
 */
import { getLatestSimulationRun, listSimulationHistory } from "../api/queries/runs";

async function seed() {
  console.log("Council of Forecasters — docket status check");
  try {
    const latest = await getLatestSimulationRun();
    const history = await listSimulationHistory(5);
    console.log(`Latest run: ${latest ? `#${latest.id} (${latest.verdictKey})` : "none"}`);
    console.log(`History rows: ${history.length}`);
  } catch (err) {
    console.error("Could not read docket:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
  console.log("Done.");
  process.exit(0);
}

seed();
