/**
 * Simulation-run persistence — MySQL when DATABASE_URL is set, otherwise a
 * local JSON file docket so latest/history work in zero-config local/dev.
 */
import { desc } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";
import { simulationRuns } from "@db/schema";
import type { SimulationRun } from "@/engine";
import { env } from "../lib/env";
import { getDb } from "./connection";

export interface RunMetaRecord {
  engine: "llm" | "deterministic";
  model: string | null;
  llmLayers: number;
}

export interface PersistedRun {
  id: number;
  createdAt: Date;
  seedText: string;
  categoryId: string;
  engine: "llm" | "deterministic";
  model: string | null;
  llmLayers: number;
  verdictKey: string;
  probability: number;
  run: SimulationRun;
}

interface FileDocket {
  nextId: number;
  rows: Array<Omit<PersistedRun, "createdAt" | "run"> & { createdAt: string; run: SimulationRun }>;
}

const DATA_DIR = path.resolve(process.cwd(), ".data");
const DOCKET_PATH = path.join(DATA_DIR, "simulation-runs.json");

function dbConfigured(): boolean {
  return Boolean(env.databaseUrl && env.databaseUrl.length > 8);
}

async function readFileDocket(): Promise<FileDocket> {
  try {
    const raw = await fs.readFile(DOCKET_PATH, "utf8");
    const parsed = JSON.parse(raw) as FileDocket;
    if (!parsed || !Array.isArray(parsed.rows)) return { nextId: 1, rows: [] };
    return parsed;
  } catch {
    return { nextId: 1, rows: [] };
  }
}

async function writeFileDocket(docket: FileDocket): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DOCKET_PATH, JSON.stringify(docket, null, 2), "utf8");
}

export async function persistSimulationRun(input: {
  seedText: string;
  categoryId: string;
  meta: RunMetaRecord;
  run: SimulationRun;
}): Promise<void> {
  if (dbConfigured()) {
    await getDb().insert(simulationRuns).values({
      seedText: input.seedText,
      categoryId: input.categoryId,
      engine: input.meta.engine,
      model: input.meta.model,
      llmLayers: input.meta.llmLayers,
      verdictKey: input.run.forecast.band.key,
      probability: input.run.forecast.probability,
      run: input.run as unknown as Record<string, unknown>,
    });
    return;
  }

  const docket = await readFileDocket();
  const id = docket.nextId++;
  docket.rows.unshift({
    id,
    createdAt: new Date().toISOString(),
    seedText: input.seedText,
    categoryId: input.categoryId,
    engine: input.meta.engine,
    model: input.meta.model,
    llmLayers: input.meta.llmLayers,
    verdictKey: input.run.forecast.band.key,
    probability: input.run.forecast.probability,
    run: input.run,
  });
  // Cap local docket growth
  docket.rows = docket.rows.slice(0, 100);
  await writeFileDocket(docket);
}

export async function getLatestSimulationRun(): Promise<PersistedRun | null> {
  if (dbConfigured()) {
    const rows = await getDb()
      .select()
      .from(simulationRuns)
      .orderBy(desc(simulationRuns.id))
      .limit(1);
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      createdAt: r.createdAt,
      seedText: r.seedText,
      categoryId: r.categoryId,
      engine: r.engine,
      model: r.model,
      llmLayers: r.llmLayers,
      verdictKey: r.verdictKey,
      probability: r.probability,
      run: r.run as unknown as SimulationRun,
    };
  }

  const docket = await readFileDocket();
  const r = docket.rows[0];
  if (!r) return null;
  return {
    ...r,
    createdAt: new Date(r.createdAt),
  };
}

export async function listSimulationHistory(limit = 25): Promise<
  Array<{
    id: number;
    seedText: string;
    categoryId: string;
    engine: "llm" | "deterministic";
    verdictKey: string;
    probability: number;
    createdAt: Date;
  }>
> {
  if (dbConfigured()) {
    const rows = await getDb()
      .select({
        id: simulationRuns.id,
        seedText: simulationRuns.seedText,
        categoryId: simulationRuns.categoryId,
        engine: simulationRuns.engine,
        verdictKey: simulationRuns.verdictKey,
        probability: simulationRuns.probability,
        createdAt: simulationRuns.createdAt,
      })
      .from(simulationRuns)
      .orderBy(desc(simulationRuns.id))
      .limit(limit);
    return rows;
  }

  const docket = await readFileDocket();
  return docket.rows.slice(0, limit).map((r) => ({
    id: r.id,
    seedText: r.seedText,
    categoryId: r.categoryId,
    engine: r.engine,
    verdictKey: r.verdictKey,
    probability: r.probability,
    createdAt: new Date(r.createdAt),
  }));
}
