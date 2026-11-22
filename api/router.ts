import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { runLlmSimulation } from "./services/deliberation";
import {
  getLatestSimulationRun,
  listSimulationHistory,
  persistSimulationRun,
} from "./queries/runs";

const seedSchema = z.object({
  text: z.string().min(10).max(280),
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
        await persistSimulationRun({
          seedText: input.text,
          categoryId: input.categoryId,
          meta,
          run,
        });
      } catch {
        // persistence is best-effort; never fail a run over it
      }
      return { run, meta };
    }),

    /** Most recent persisted run (for the Report page across devices). */
    latest: publicQuery.query(async () => {
      try {
        const r = await getLatestSimulationRun();
        if (!r) return null;
        return {
          id: r.id,
          createdAt: r.createdAt,
          run: r.run,
          meta: { engine: r.engine, model: r.model, llmLayers: r.llmLayers },
        };
      } catch {
        return null;
      }
    }),

    /** Docket history — verdict lines of past runs. */
    history: publicQuery.query(async () => {
      try {
        return await listSimulationHistory(25);
      } catch {
        return [];
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
