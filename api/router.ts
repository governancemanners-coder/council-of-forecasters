import { z } from "zod";
import { desc } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { runLlmSimulation } from "./services/deliberation";
import { getDb } from "./queries/connection";
import { simulationRuns } from "@db/schema";
import type { SimulationRun } from "@/engine";

const seedSchema = z.object({
  text: z.string().min(8).max(280),
  categoryId: z.enum([
    "refinancing",
    "intensification",
    "charge-increase",
    "governance",
    "eviction",
    "retrofit",
    "occupancy",
    "disposition",
  ]),
  sliders: z.object({
    financial: z.number().min(0).max(100),
    member: z.number().min(0).max(100),
    regulatory: z.number().min(0).max(100),
    timeline: z.number().min(0).max(100),
  }),
});

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  simulation: createRouter({
    /**
     * Convene the Council: runs the deterministic engine, then layers real
     * LLM deliberation on top (per-seat statements + ReportAgent synthesis).
     * Persists the run. Always succeeds — falls back to deterministic text
     * per-layer if the LLM upstream is rate-limited.
     */
    run: publicQuery.input(seedSchema).mutation(async ({ input }) => {
      const { run, meta } = await runLlmSimulation(input);
      try {
        await getDb().insert(simulationRuns).values({
          seedText: input.text,
          categoryId: input.categoryId,
          engine: meta.engine,
          model: meta.model,
          llmLayers: meta.llmLayers,
          verdictKey: run.forecast.band.key,
          probability: run.forecast.probability,
          run: run as unknown as Record<string, unknown>,
        });
      } catch {
        // persistence is best-effort; never fail a run over it
      }
      return { run, meta };
    }),

    /** Most recent persisted run (for the Report page across devices). */
    latest: publicQuery.query(async () => {
      try {
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
          run: r.run as unknown as SimulationRun,
          meta: { engine: r.engine, model: r.model, llmLayers: r.llmLayers },
        };
      } catch {
        return null;
      }
    }),

    /** Docket history — verdict lines of past runs. */
    history: publicQuery.query(async () => {
      try {
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
          .limit(25);
        return rows;
      } catch {
        return [];
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
