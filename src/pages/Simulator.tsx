import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { Actor, SimulationRun } from '@/engine';
import { ACTOR_INDEX, INFLUENCE_MATRIX, computeInitialStances } from '@/engine';
import { readLastRun, useSimulation } from '@/hooks/useSimulation';
import { resetRunSteps, setRunStep } from '@/components/navStepStore';
import SeedPanel from '@/components/simulator/SeedPanel';
import type { SeedDraft } from '@/components/simulator/SeedPanel';
import { EMPTY_DRAFT, isDraftValid } from '@/components/simulator/SeedPanel';
import CaucusFloor from '@/components/simulator/CaucusFloor';
import StanceBoard from '@/components/simulator/StanceBoard';
import AgentDrawer from '@/components/simulator/AgentDrawer';
import type { ActiveEdge } from '@/components/simulator/InfluenceGraph';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : true,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

const EASE_OUT_QUINT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Simulator — the core caucus-chat workbench. Three panes:
 * SEED (left) · CAUCUS FLOOR (center) · STANCE BOARD (right), plus the
 * agent Q&A drawer. Drives the shared useSimulation hook and publishes
 * run progress to the Navbar step indicator via navStepStore.
 */
export default function Simulator() {
  const sim = useSimulation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [draft, setDraft] = useState<SeedDraft>(EMPTY_DRAFT);
  const [drawerActor, setDrawerActor] = useState<Actor | null>(null);
  const [previousRun, setPreviousRun] = useState<SimulationRun | null>(() => readLastRun());

  const valid = isDraftValid(draft);
  const { phase, complete } = sim;

  /* Navbar step-indicator sync: 01 SEED → 02 COUNCIL → 03 SIMULATION → 04 REPORT */
  useEffect(() => {
    resetRunSteps();
    return () => resetRunSteps();
  }, []);

  useEffect(() => {
    if (complete) setRunStep('report', ['seed', 'council', 'simulation']);
    else if (phase === 'running') setRunStep('simulation', ['seed', 'council']);
    else if (phase === 'seeding' && valid) setRunStep('council', ['seed']);
    else setRunStep('seed', []);
  }, [phase, complete, valid]);

  const handleDraftChange = (d: SeedDraft) => {
    setDraft(d);
    if (isDraftValid(d) && (sim.phase === 'idle' || sim.phase === 'seeding')) {
      sim.stageSeed({ text: d.text.trim(), categoryId: d.categoryId!, sliders: d.sliders });
    }
  };

  const handleNewSeed = () => {
    if (sim.run) setPreviousRun(sim.run);
    sim.reset();
    setDraft(EMPTY_DRAFT);
  };

  /* Visible stances: seeded with initial stances at convene; updated as each
     message is revealed. Deltas reset on each round divider so the mover
     badges reflect the current round. */
  const { stances, deltas, preview } = useMemo(() => {
    const d = new Array<number>(12).fill(0);
    if (sim.run) {
      const s = [...sim.run.initialStances];
      for (const ev of sim.events) {
        if (ev.type === 'divider') {
          d.fill(0);
        } else if (ev.type === 'message' && ev.message.actorId) {
          const i = ACTOR_INDEX[ev.message.actorId];
          s[i] = ev.message.stance;
          d[i] = ev.message.delta;
        }
      }
      return { stances: s, deltas: d, preview: false };
    }
    if (sim.seed && sim.phase === 'seeding') {
      return { stances: computeInitialStances(sim.seed), deltas: d, preview: true };
    }
    return { stances: new Array<number>(12).fill(0), deltas: d, preview: false };
  }, [sim.run, sim.events, sim.seed, sim.phase]);

  /* Latest cascade edge (round ≥ 2 chat message) — pulses on the mini-graph. */
  const activeEdge = useMemo<ActiveEdge | null>(() => {
    for (let k = sim.events.length - 1; k >= 0; k--) {
      const ev = sim.events[k];
      if (ev.type !== 'message') continue;
      if (ev.message.kind !== 'chat' || ev.message.round < 2 || !ev.message.actorId) return null;
      const to = ACTOR_INDEX[ev.message.actorId];
      const row = INFLUENCE_MATRIX[to];
      let from = -1;
      let w = 0;
      for (let j = 0; j < 12; j++) {
        if (row[j] > w) {
          w = row[j];
          from = j;
        }
      }
      return from >= 0 ? { from, to, key: ev.id } : null;
    }
    return null;
  }, [sim.events]);

  const openDrawer = (actor: Actor) => setDrawerActor(actor);

  const drawerIndex = drawerActor ? ACTOR_INDEX[drawerActor.id] : -1;
  const drawerHistory = useMemo(() => {
    if (!drawerActor || !sim.run) return [];
    const revealed = Math.max(1, sim.currentRound);
    return sim.run.rounds.slice(0, revealed).map((r) => r.stances[ACTOR_INDEX[drawerActor.id]]);
  }, [drawerActor, sim.run, sim.currentRound]);

  const seedPanel = (
    <SeedPanel
      draft={draft}
      onChange={handleDraftChange}
      onConvene={sim.convene}
      locked={phase === 'running' || phase === 'report'}
      complete={complete}
    />
  );

  const floor = (
    <CaucusFloor
      run={sim.run}
      events={sim.events}
      typingActor={sim.typingActor}
      currentRound={sim.currentRound}
      paused={sim.paused}
      speed={sim.speed}
      complete={complete}
      phase={phase}
      meta={sim.meta}
      deliberating={sim.deliberating}
      previousRun={previousRun}
      onPause={sim.pause}
      onResume={sim.resume}
      onSkipRound={sim.skipRound}
      onSpeed={sim.setSpeed}
      onActorClick={openDrawer}
      onNewSeed={handleNewSeed}
    />
  );

  const board = (
    <StanceBoard
      stances={stances}
      deltas={deltas}
      veto={sim.run?.veto ?? null}
      preview={preview}
      activeEdge={activeEdge}
      onActorClick={openDrawer}
    />
  );

  return (
    <div className="bg-paper">
      {isDesktop ? (
        /* Desktop — three-pane workbench: 320px seed · flexible floor · 380px board */
        <div className="mx-auto grid max-w-[1600px] grid-cols-[320px_minmax(560px,1fr)_380px] gap-5 px-6 py-4">
          <motion.div
            className="h-[calc(100dvh-140px)] min-h-[480px]"
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE_OUT_QUINT }}
          >
            {seedPanel}
          </motion.div>
          <motion.div
            className="h-[calc(100dvh-140px)] min-h-[480px]"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE_OUT_QUINT, delay: 0.05 }}
          >
            {floor}
          </motion.div>
          <motion.div
            className="h-[calc(100dvh-140px)] min-h-[480px]"
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE_OUT_QUINT, delay: 0.1 }}
          >
            {board}
          </motion.div>
        </div>
      ) : (
        /* Mobile / tablet — single column with FLOOR · BOARD · SEED tabs */
        <div className="px-4 py-4">
          <Tabs defaultValue="floor">
            <TabsList className="mono-label mb-3 w-full justify-center">
              <TabsTrigger value="floor" className="mono-label flex-1 text-[10px]">
                FLOOR
              </TabsTrigger>
              <TabsTrigger value="board" className="mono-label flex-1 text-[10px]">
                BOARD (12)
              </TabsTrigger>
              <TabsTrigger value="seed" className="mono-label flex-1 text-[10px]">
                SEED
              </TabsTrigger>
            </TabsList>
            <TabsContent value="floor">
              <div className="h-[calc(100dvh-200px)] min-h-[420px]">{floor}</div>
            </TabsContent>
            <TabsContent value="board">
              <div className="h-[calc(100dvh-200px)] min-h-[420px]">{board}</div>
            </TabsContent>
            <TabsContent value="seed">
              <div className="h-[calc(100dvh-200px)] min-h-[420px]">{seedPanel}</div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <AgentDrawer
        actor={drawerActor}
        open={drawerActor !== null}
        onOpenChange={(open) => {
          if (!open) setDrawerActor(null);
        }}
        stance={drawerIndex >= 0 ? stances[drawerIndex] : 0}
        roundHistory={drawerHistory}
        inRun={sim.run !== null}
        allStances={stances}
      />
    </div>
  );
}
