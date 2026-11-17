import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  json,
  timestamp,
  int,
  // bigint,
} from "drizzle-orm/mysql-core";

/**
 * Council of Forecasters — persisted simulation runs.
 * `run` holds the full SimulationRun JSON (rounds, messages, forecast).
 */
export const simulationRuns = mysqlTable("simulation_runs", {
  id: serial("id").primaryKey(),
  seedText: varchar("seed_text", { length: 512 }).notNull(),
  categoryId: varchar("category_id", { length: 64 }).notNull(),
  engine: mysqlEnum("engine", ["llm", "deterministic"]).notNull(),
  model: varchar("model", { length: 128 }),
  llmLayers: int("llm_layers").notNull().default(0),
  verdictKey: varchar("verdict_key", { length: 32 }).notNull(),
  probability: int("probability").notNull(),
  run: json("run").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
