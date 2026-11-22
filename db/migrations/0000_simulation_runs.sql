-- Council of Forecasters — simulation_runs docket
CREATE TABLE IF NOT EXISTS `simulation_runs` (
  `id` serial AUTO_INCREMENT NOT NULL,
  `seed_text` varchar(512) NOT NULL,
  `category_id` varchar(64) NOT NULL,
  `engine` enum('llm','deterministic') NOT NULL,
  `model` varchar(128),
  `llm_layers` int NOT NULL DEFAULT 0,
  `verdict_key` varchar(32) NOT NULL,
  `probability` int NOT NULL,
  `run` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `simulation_runs_id` PRIMARY KEY(`id`)
);
