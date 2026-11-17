import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ChevronDown, Gavel, Pause, Play, SkipForward } from 'lucide-react';
import type { Actor, ActorId, SimPhase, SimulationRun } from '@/engine';
import { ACTORS, ACTOR_BY_ID, CATEGORY_BY_ID, roundLabel } from '@/engine';
import type { EngineMeta, SimSpeed, TimelineEvent } from '@/hooks/useSimulation';
import EngineChip from '@/components/simulator/EngineChip';
import ChatBubble from '@/components/sim/ChatBubble';
import PersonaAvatar from '@/components/sim/PersonaAvatar';
import RoundDivider from '@/components/sim/RoundDivider';
import StatusChip from '@/components/sim/StatusChip';
import TypingDots from '@/components/sim/TypingDots';
import VetoFlag from '@/components/sim/VetoFlag';
import MagnetButton from '@/components/MagnetButton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

/** Tiny inline sparkline of the 12 stances (seat order). */
function StanceSparkline({ stances, className }: { stances: number[]; className?: string }) {
  const w = 120;
  const h = 22;
  const step = w / (stances.length - 1);
  const pts = stances
    .map((s, i) => `${(i * step).toFixed(1)},${(h / 2 - (s * h) / 2.4).toFixed(1)}`)
    .join(' ');
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={cn('inline-block', className)}
      role="img"
      aria-label="Stance sparkline across the twelve seats"
    >
      <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="#D4D2CB" strokeWidth={1} strokeDasharray="3 3" />
      <polyline points={pts} fill="none" stroke="#0F766E" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

/** The seed card inserted into the feed when the Council convenes. */
function SeedCard({ run }: { run: SimulationRun }) {
  const cat = CATEGORY_BY_ID[run.seed.categoryId];
  const s = run.seed.sliders;
  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-gray-200 border-l-4 border-l-council bg-surface p-4 shadow-paper-soft"
    >
      <p className="mono-label mb-2 text-council">THE SEED — YOUR MOVE · #{run.seedHash}</p>
      <p className="font-display text-[19px] italic leading-[1.5] text-ink">“{run.seed.text}”</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusChip variant="neutral" className="border-council/40 bg-council-wash text-[10px] text-council">
          {cat.label}
        </StatusChip>
        <span className="mono-label text-[10px] tabular-nums text-gray-500">
          FIN {s.financial} · MEM {s.member} · REG {s.regulatory} · TML {s.timeline}
        </span>
      </div>
    </motion.div>
  );
}

function SystemLine({ text, sparkline }: { text: string; sparkline?: number[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="my-4 text-center"
    >
      <p className="mono-label text-[11px] normal-case tracking-[0.04em] text-gray-500">{text}</p>
      {sparkline && <StanceSparkline stances={sparkline} className="mt-1.5" />}
    </motion.div>
  );
}

/** Compact transcript of a previous run, behind an accordion. */
function PreviousRunLog({ run, onActorClick }: { run: SimulationRun; onActorClick: (a: Actor) => void }) {
  const cat = CATEGORY_BY_ID[run.seed.categoryId];
  return (
    <Collapsible className="mb-4 rounded-xl border border-gray-200 bg-surface">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
        <span className="mono-label text-[11px] text-gray-500">
          PREVIOUS RUN — {cat.label.toUpperCase()} · SEED #{run.seedHash}
        </span>
        <ChevronDown
          size={15}
          className="shrink-0 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        {run.rounds.map((round) => (
          <div key={round.round}>
            <RoundDivider label={`ROUND 0${round.round} — ${round.name}`} className="my-3" />
            <ul className="space-y-2">
              {round.messages.map((m) =>
                m.kind === 'veto' && m.veto ? (
                  <li key={m.id}>
                    <VetoFlag veto={m.veto} animate={false} />
                  </li>
                ) : (
                  <li key={m.id} className="flex items-start gap-2">
                    {m.actorId && (
                      <button
                        type="button"
                        onClick={() => onActorClick(ACTOR_BY_ID[m.actorId as ActorId])}
                        className="mt-0.5 shrink-0"
                        aria-label={`Open ${ACTOR_BY_ID[m.actorId as ActorId].name} detail`}
                      >
                        <PersonaAvatar actor={ACTOR_BY_ID[m.actorId as ActorId]} size={24} />
                      </button>
                    )}
                    <p className="min-w-0 text-[13px] italic leading-5 text-ink-soft">
                      <span className="mono-label mr-1.5 not-italic text-[10px] text-gray-500">
                        {m.actorId ? ACTOR_BY_ID[m.actorId as ActorId].monogram : 'SYS'}
                      </span>
                      {m.text}
                    </p>
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

const SPEEDS: SimSpeed[] = [1, 2, 4];

/**
 * Pane 2 — THE CAUCUS FLOOR. Round-by-round chat feed with typing indicators,
 * gavel-stamped dividers, veto injection, playback controls, auto-scroll.
 */
export default function CaucusFloor({
  run,
  events,
  typingActor,
  currentRound,
  paused,
  speed,
  complete,
  phase,
  meta,
  deliberating,
  previousRun,
  onPause,
  onResume,
  onSkipRound,
  onSpeed,
  onActorClick,
  onNewSeed,
}: {
  run: SimulationRun | null;
  events: TimelineEvent[];
  typingActor: ActorId | null;
  currentRound: number;
  paused: boolean;
  speed: SimSpeed;
  complete: boolean;
  phase: SimPhase;
  meta: EngineMeta | null;
  deliberating: boolean;
  previousRun: SimulationRun | null;
  onPause: () => void;
  onResume: () => void;
  onSkipRound: () => void;
  onSpeed: (s: SimSpeed) => void;
  onActorClick: (a: Actor) => void;
  onNewSeed: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userUp, setUserUp] = useState(false);
  const seenCountRef = useRef(0);

  const vetoRevealed = useMemo(
    () => !!run?.veto && events.some((e) => e.type === 'message' && e.message.kind === 'veto'),
    [run, events],
  );

  const running = phase === 'running' && !complete;

  // Auto-scroll follows new messages unless the user has scrolled up >120px.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!userUp) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      seenCountRef.current = events.length;
    }
  }, [events, typingActor, userUp]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (dist > 120) {
      if (!userUp) {
        setUserUp(true);
        seenCountRef.current = events.length;
      }
    } else if (userUp) {
      setUserUp(false);
      seenCountRef.current = events.length;
    }
  };

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setUserUp(false);
    seenCountRef.current = events.length;
  };

  const newSinceScroll = events.length - seenCountRef.current;

  const verdictVariant =
    run?.forecast.band.key === 'blocked'
      ? 'veto'
      : run?.forecast.band.key === 'unlikely'
        ? 'oppose'
        : run?.forecast.band.key === 'contested'
          ? 'persuade'
          : 'support';

  return (
    <section
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-paper-deep"
      aria-label="The caucus floor"
    >
      {/* header + playback controls */}
      <header className="shrink-0 border-b border-gray-200 bg-surface px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 className="mono-label text-ink">THE CAUCUS FLOOR</h2>
            {run && !complete && currentRound > 0 && (
              <StatusChip variant="neutral" className="text-[10px]">
                {roundLabel(currentRound)}
                {paused && ' · PAUSED'}
              </StatusChip>
            )}
            {complete && (
              <StatusChip variant="support" className="text-[10px]">
                RECORD COMPLETE
              </StatusChip>
            )}
            <EngineChip meta={meta} />
          </div>
          {running && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={paused ? onResume : onPause}
                className="mono-label flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-[10px] text-ink-soft transition-colors hover:border-council hover:text-council"
              >
                {paused ? <Play size={11} /> : <Pause size={11} />}
                {paused ? 'RESUME' : 'PAUSE'}
              </button>
              <button
                type="button"
                onClick={onSkipRound}
                className="mono-label flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-[10px] text-ink-soft transition-colors hover:border-council hover:text-council"
              >
                <SkipForward size={11} /> SKIP ROUND
              </button>
              <div className="ml-1 flex overflow-hidden rounded-md border border-gray-300" role="group" aria-label="Playback speed">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSpeed(s)}
                    aria-pressed={speed === s}
                    className={cn(
                      'mono-label px-2 py-1 text-[10px] transition-colors',
                      speed === s ? 'bg-council text-white' : 'text-ink-soft hover:text-council',
                    )}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* present strip — all twelve seats fade in on convene */}
        <AnimatePresence>
          {run && (
            <motion.div
              className="mt-2.5 flex flex-wrap items-center gap-1.5"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            >
              {ACTORS.map((actor) => (
                <motion.button
                  key={actor.id}
                  type="button"
                  variants={{
                    hidden: { opacity: 0, y: -6 },
                    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
                  }}
                  onClick={() => onActorClick(actor)}
                  className="rounded-xl transition-transform hover:scale-110"
                  aria-label={`${actor.name} — present`}
                  title={actor.name}
                >
                  <PersonaAvatar actor={actor} size={28} />
                </motion.button>
              ))}
              <span className="mono-label ml-1 text-[9px] text-gray-400">TWELVE SEATS PRESENT</span>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* feed */}
      <div ref={scrollRef} onScroll={onScroll} className="relative flex-1 overflow-y-auto px-5 py-5">
        {/* pinned veto banner */}
        {vetoRevealed && run?.veto && (
          <Collapsible className="sticky top-0 z-10 mb-4 rounded-xl border-2 border-veto bg-surface">
            <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left">
              <span className="mono-label flex items-center gap-1.5 text-[10px] text-veto">
                <Gavel size={12} /> PINNED — HARD CONSTRAINT: {run.veto.statute}
              </span>
              <ChevronDown
                size={14}
                className="shrink-0 text-veto transition-transform duration-200 group-data-[state=open]:rotate-180"
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pb-3">
              <VetoFlag veto={run.veto} animate={false} className="border-0 p-2" />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* live-deliberation interstitial — server LLM call in flight */}
        {deliberating && !run && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex h-full flex-col items-center justify-center text-center"
          >
            <TypingDots />
            <h3 className="mt-6 font-display text-2xl font-medium text-ink">
              The Council is in live deliberation…
            </h3>
            <p className="mt-2 max-w-xs text-sm leading-5 text-gray-500">
              Twelve seats are drafting on the record. Free-tier models can take a minute or two —
              the floor opens the moment they file in.
            </p>
          </motion.div>
        )}

        {/* empty state */}
        {!run && !deliberating && !previousRun && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex h-full flex-col items-center justify-center text-center"
          >
            <img src="/empty-docket.svg" alt="" className="w-3/5 max-w-[300px]" />
            <h3 className="mt-6 font-display text-2xl font-medium text-ink">The floor is empty.</h3>
            <p className="mt-2 max-w-xs text-sm leading-5 text-gray-500">
              {phase === 'seeding'
                ? 'The Council is ready. Convene when you are.'
                : 'Seed your move on the left. Twelve seats are waiting.'}
            </p>
          </motion.div>
        )}

        {/* previous run transcript */}
        {!run && !deliberating && previousRun && (
          <>
            <PreviousRunLog run={previousRun} onActorClick={onActorClick} />
            <div className="py-8 text-center">
              <p className="mono-label text-[11px] text-gray-500">
                THE FLOOR IS CLEAR — SEED A NEW MOVE ON THE LEFT
              </p>
            </div>
          </>
        )}

        {/* live timeline */}
        <div className="space-y-5">
          {events.map((ev) => {
            if (ev.type === 'system') {
              const m = /^sys-end-(\d)$/.exec(ev.id);
              const spark = run && m ? run.rounds[Number(m[1]) - 1].stances : undefined;
              return <SystemLine key={ev.id} text={ev.text} sparkline={spark} />;
            }
            if (ev.type === 'seed') return run ? <SeedCard key={ev.id} run={run} /> : null;
            if (ev.type === 'divider') return <RoundDivider key={ev.id} label={ev.name} />;
            const msg = ev.message;
            if (msg.kind === 'veto' && msg.veto) {
              return <VetoFlag key={ev.id} veto={msg.veto} className="my-2" />;
            }
            if (msg.actorId) {
              return (
                <ChatBubble
                  key={ev.id}
                  actor={ACTOR_BY_ID[msg.actorId]}
                  message={msg}
                  onActorClick={onActorClick}
                />
              );
            }
            return null;
          })}

          {/* typing indicator */}
          {typingActor && (
            <motion.div
              key={`typing-${typingActor}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <PersonaAvatar actor={ACTOR_BY_ID[typingActor]} size={40} />
              <div>
                <p className="mb-1 text-[12px] font-medium text-gray-500">
                  {ACTOR_BY_ID[typingActor].shortName} is on the record…
                </p>
                <TypingDots />
              </div>
            </motion.div>
          )}
        </div>

        {/* completion card */}
        <AnimatePresence>
          {complete && run && (
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 rounded-2xl border-2 border-council bg-surface p-6 text-center shadow-paper-soft"
            >
              <h3 className="font-display text-2xl font-medium text-ink">The record is complete.</h3>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <StatusChip variant={verdictVariant}>
                  {run.forecast.band.label} · {run.forecast.band.range[0]}–{run.forecast.band.range[1]}%
                </StatusChip>
                <EngineChip meta={meta} />
              </div>
              <p className="mx-auto mt-3 max-w-md text-sm leading-5 text-gray-500">
                {run.forecast.band.word} The Report Agent has docketed the forecast.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <MagnetButton to="/report">Read the Forecast Report →</MagnetButton>
                <MagnetButton variant="ghost" onClick={onNewSeed}>
                  Run a new seed
                </MagnetButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* new-messages pill */}
      <AnimatePresence>
        {userUp && newSinceScroll > 0 && (
          <motion.button
            type="button"
            onClick={jumpToLatest}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: [0, -4, 0] }}
            exit={{ opacity: 0, y: 8 }}
            transition={{
              opacity: { duration: 0.2 },
              y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="mono-label absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-council/30 bg-council-wash px-3 py-1.5 text-[10px] text-council shadow-paper-soft"
          >
            <ArrowDown size={12} /> NEW MESSAGES
          </motion.button>
        )}
      </AnimatePresence>
    </section>
  );
}
