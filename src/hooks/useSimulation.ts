import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ActorId, ChatMessage, ScenarioSeed, SimPhase, SimulationRun } from '@/engine';
import { hashString, runSimulation } from '@/engine';
import { trpc } from '@/providers/trpc';

export const LAST_RUN_KEY = 'cof:lastRun';
export const LAST_RUN_META_KEY = 'cof:lastRunMeta';

/** Where a run's record came from. */
export interface EngineMeta {
  engine: 'llm' | 'deterministic';
  model: string | null;
  /** How many of the 5 LLM layers (4 rounds + synthesis) succeeded. */
  llmLayers: number;
  /** True when the server call itself failed and we fell back locally. */
  offline: boolean;
}

export type TimelineEvent =
  | { type: 'system'; id: string; text: string }
  | { type: 'seed'; id: string }
  | { type: 'divider'; id: string; round: number; name: string }
  | { type: 'message'; id: string; message: ChatMessage };

export type SimSpeed = 1 | 2 | 4;

/** Build the deterministic reveal timeline for a run. */
function buildTimeline(run: SimulationRun): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      type: 'system',
      id: 'sys-convene',
      text: 'The Council convenes to consider the seed action. Twelve seats present. The record is open.',
    },
    { type: 'seed', id: 'seed-card' },
  ];
  for (const round of run.rounds) {
    events.push({
      type: 'divider',
      id: `div-${round.round}`,
      round: round.round,
      name: `ROUND 0${round.round} — ${round.name}`,
    });
    for (const message of round.messages) {
      events.push({ type: 'message', id: message.id, message });
    }
    events.push({
      type: 'system',
      id: `sys-end-${round.round}`,
      text: `Round ${round.round} recorded. Stances propagated through the influence network.`,
    });
  }
  return events;
}

/** Typing-indicator duration per message, deterministic from message id. */
export function typingMsFor(messageId: string): number {
  return 350 + (hashString(messageId) % 350);
}

export function readLastRun(): SimulationRun | null {
  try {
    const raw = window.localStorage.getItem(LAST_RUN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SimulationRun;
  } catch {
    return null;
  }
}

export function readLastRunMeta(): EngineMeta | null {
  try {
    const raw = window.localStorage.getItem(LAST_RUN_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EngineMeta;
  } catch {
    return null;
  }
}

function persistRun(run: SimulationRun, meta: EngineMeta | null): void {
  try {
    window.localStorage.setItem(LAST_RUN_KEY, JSON.stringify(run));
    if (meta) window.localStorage.setItem(LAST_RUN_META_KEY, JSON.stringify(meta));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export interface UseSimulation {
  phase: SimPhase;
  seed: ScenarioSeed | null;
  run: SimulationRun | null;
  /** Events revealed so far, in order. */
  events: TimelineEvent[];
  /** Actor currently "typing", or null. */
  typingActor: ActorId | null;
  currentRound: number;
  paused: boolean;
  speed: SimSpeed;
  complete: boolean;
  /** Run provenance — live LLM vs deterministic fallback. Null until resolved. */
  meta: EngineMeta | null;
  /** True while the server-side LLM deliberation mutation is in flight. */
  deliberating: boolean;
  /** Enter seeding phase with a candidate seed. */
  stageSeed: (seed: ScenarioSeed) => void;
  /** Convene the Council: compute the run and begin the reveal. */
  convene: () => void;
  pause: () => void;
  resume: () => void;
  skipRound: () => void;
  setSpeed: (s: SimSpeed) => void;
  reset: () => void;
  /** Restore a persisted run straight into report phase (no animation). */
  restoreLastRun: () => SimulationRun | null;
}

export function useSimulation(): UseSimulation {
  const [phase, setPhase] = useState<SimPhase>('idle');
  const [seed, setSeed] = useState<ScenarioSeed | null>(null);
  const [run, setRun] = useState<SimulationRun | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [typingActor, setTypingActor] = useState<ActorId | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeedState] = useState<SimSpeed>(1);
  const [complete, setComplete] = useState(false);
  const [meta, setMeta] = useState<EngineMeta | null>(null);
  const [deliberating, setDeliberating] = useState(false);

  const timeline = useMemo(() => (run ? buildTimeline(run) : []), [run]);
  const cursorRef = useRef(0);
  /** Bumped on convene/reset so a late mutation response can't hijack state. */
  const genRef = useRef(0);
  const metaRef = useRef<EngineMeta | null>(null);
  metaRef.current = meta;
  const timerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const speedRef = useRef<SimSpeed>(1);
  pausedRef.current = paused;
  speedRef.current = speed;

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const schedule = useCallback((fn: () => void, ms: number) => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      if (pausedRef.current) {
        // poll until resumed
        timerRef.current = window.setTimeout(function tick() {
          if (pausedRef.current) {
            timerRef.current = window.setTimeout(tick, 120);
          } else {
            fn();
          }
        }, 120);
        return;
      }
      fn();
    }, ms / speedRef.current);
  }, []);

  const advance = useCallback(() => {
    const cursor = cursorRef.current;
    if (!run || cursor >= timeline.length) {
      setTypingActor(null);
      setComplete(true);
      setPhase('report');
      if (run) persistRun(run, metaRef.current);
      return;
    }
    const ev = timeline[cursor];
    if (ev.type === 'message') {
      setTypingActor(ev.message.actorId);
      schedule(() => {
        setTypingActor(null);
        setEvents((prev) => [...prev, ev]);
        setCurrentRound(ev.message.round);
        cursorRef.current += 1;
        schedule(advance, 260);
      }, typingMsFor(ev.id));
    } else {
      setTypingActor(null);
      setEvents((prev) => [...prev, ev]);
      if (ev.type === 'divider') setCurrentRound(ev.round);
      cursorRef.current += 1;
      schedule(advance, ev.type === 'divider' ? 620 : 420);
    }
  }, [run, timeline, schedule]);

  const stageSeed = useCallback((s: ScenarioSeed) => {
    clearTimer();
    setSeed(s);
    setPhase('seeding');
  }, []);

  const { mutate: runOnServer } = trpc.simulation.run.useMutation();

  /** Begin the round-by-round reveal for a finished run. */
  const beginReveal = useCallback((result: SimulationRun, m: EngineMeta) => {
    cursorRef.current = 0;
    setRun(result);
    setMeta(m);
    setEvents([]);
    setTypingActor(null);
    setCurrentRound(0);
    setComplete(false);
    setPaused(false);
    setDeliberating(false);
  }, []);

  const convene = useCallback(() => {
    if (!seed) return;
    clearTimer();
    const gen = ++genRef.current;
    setRun(null);
    setMeta(null);
    setEvents([]);
    setTypingActor(null);
    setCurrentRound(0);
    setComplete(false);
    setPaused(false);
    setDeliberating(true);
    setPhase('running');

    const fallback = () => {
      // Any server/network/timeout failure — continue seamlessly on the
      // local deterministic engine; the offline chip communicates why.
      beginReveal(runSimulation(seed), {
        engine: 'deterministic',
        model: null,
        llmLayers: 0,
        offline: true,
      });
    };

    try {
      runOnServer(seed, {
        onSuccess: (data) => {
          if (genRef.current !== gen) return;
          beginReveal(data.run, { ...data.meta, offline: false });
        },
        onError: () => {
          if (genRef.current !== gen) return;
          fallback();
        },
      });
    } catch {
      // mutate() itself throwing (synchronous setup failure)
      fallback();
    }
  }, [seed, runOnServer, beginReveal]);

  // Kick off the reveal once a run is set.
  useEffect(() => {
    if (phase === 'running' && run && cursorRef.current === 0 && events.length === 0) {
      schedule(advance, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, run]);

  useEffect(() => clearTimer, []);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);
  const setSpeed = useCallback((s: SimSpeed) => setSpeedState(s), []);

  const skipRound = useCallback(() => {
    if (!run) return;
    clearTimer();
    setTypingActor(null);
    // Reveal everything up to (and including) the next divider or the end.
    let c = cursorRef.current;
    const next: TimelineEvent[] = [];
    const startRound = currentRound;
    while (c < timeline.length) {
      const ev = timeline[c];
      if (ev.type === 'divider' && next.length > 0 && ev.round > startRound) break;
      next.push(ev);
      c++;
      if (ev.type === 'divider' && ev.round > startRound) break;
    }
    if (next.length) {
      setEvents((prev) => [...prev, ...next]);
      const lastDivider = [...next].reverse().find((e) => e.type === 'divider');
      if (lastDivider && lastDivider.type === 'divider') setCurrentRound(lastDivider.round);
    }
    cursorRef.current = c;
    if (c >= timeline.length) {
      advance();
    } else {
      schedule(advance, 300);
    }
  }, [run, timeline, currentRound, advance, schedule]);

  const reset = useCallback(() => {
    clearTimer();
    genRef.current += 1;
    cursorRef.current = 0;
    setPhase('idle');
    setSeed(null);
    setRun(null);
    setMeta(null);
    setDeliberating(false);
    setEvents([]);
    setTypingActor(null);
    setCurrentRound(0);
    setPaused(false);
    setComplete(false);
  }, []);

  const restoreLastRun = useCallback((): SimulationRun | null => {
    const last = readLastRun();
    if (last) {
      clearTimer();
      genRef.current += 1;
      cursorRef.current = Number.MAX_SAFE_INTEGER;
      setSeed(last.seed);
      setRun(last);
      setMeta(readLastRunMeta());
      setDeliberating(false);
      setEvents(buildTimeline(last));
      setTypingActor(null);
      setCurrentRound(4);
      setComplete(true);
      setPhase('report');
    }
    return last;
  }, []);

  return {
    phase,
    seed,
    run,
    events,
    typingActor,
    currentRound,
    paused,
    speed,
    complete,
    meta,
    deliberating,
    stageSeed,
    convene,
    pause,
    resume,
    skipRound,
    setSpeed,
    reset,
    restoreLastRun,
  };
}
