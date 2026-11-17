import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router';
import { ArrowRight, Scale } from 'lucide-react';
import type { Actor } from '@/engine';
import { ACTORS, ACTOR_INDEX, AXIS_NAMES, AXIS_ORDER, INFLUENCE_MATRIX } from '@/engine';
import PersonaAvatar from '@/components/sim/PersonaAvatar';
import RadarChart from '@/components/sim/RadarChart';
import StanceBar from '@/components/sim/StanceBar';
import StatusChip from '@/components/sim/StatusChip';
import TypingDots from '@/components/sim/TypingDots';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

/** Round-history sparkline (stance per revealed round). */
function RoundHistory({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const w = 120;
  const h = 26;
  const step = values.length > 1 ? w / (values.length - 1) : 0;
  const pts = values
    .map((s, i) => `${(i * step).toFixed(1)},${(h / 2 - (s * h) / 2.4).toFixed(1)}`)
    .join(' ');
  return (
    <div>
      <p className="mono-label mb-1 text-[9px] text-gray-400">ROUND HISTORY</p>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Stance by round">
        <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="#D4D2CB" strokeWidth={1} strokeDasharray="3 3" />
        {values.length > 1 ? (
          <polyline points={pts} fill="none" stroke="#0F766E" strokeWidth={1.5} strokeLinejoin="round" />
        ) : (
          <circle cx={0} cy={h / 2 - (values[0] * h) / 2.4} r={2.5} fill="#0F766E" />
        )}
        {values.map((s, i) => (
          <circle key={i} cx={i * step} cy={h / 2 - (s * h) / 2.4} r={2} fill="#0F766E" />
        ))}
      </svg>
    </div>
  );
}

interface QAEntry {
  q: string;
  a: string | null;
}

/** Canned Q&A thread — answers "type in" after a 400ms indicator. */
function QaThread({
  actor,
  inRun,
  allStances,
}: {
  actor: Actor;
  inRun: boolean;
  allStances: number[];
}) {
  const [thread, setThread] = useState<QAEntry[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setThread([]);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [actor.id]);

  const whyMoved = (): string => {
    const i = ACTOR_INDEX[actor.id];
    if (actor.lambda === 0) return 'I don’t move. λ = 0 — law is law.';
    const row = INFLUENCE_MATRIX[i];
    let top = -1;
    let w = 0;
    for (let j = 0; j < 12; j++) {
      if (row[j] > w) {
        w = row[j];
        top = j;
      }
    }
    if (top < 0) return 'No seat moves me. I read the move on its merits.';
    const dir = allStances[top] >= 0 ? 'toward support' : 'toward opposition';
    return `Because ${ACTORS[top].shortName} moved ${dir} — and where they go, I follow. (cascade λ = ${actor.lambda.toFixed(1)})`;
  };

  const ask = (q: string, answer: () => string) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setThread((t) => [...t, { q, a: null }]);
    timerRef.current = window.setTimeout(() => {
      setThread((t) => t.map((e, idx) => (idx === t.length - 1 ? { ...e, a: answer() } : e)));
    }, 400);
  };

  const questions: Array<{ label: string; answer: () => string }> = [
    { label: 'What would make you support this?', answer: () => actor.qa.support },
    { label: 'What’s your hard limit?', answer: () => actor.qa.limit },
  ];
  if (inRun) questions.push({ label: 'Why did you move this round?', answer: whyMoved });

  return (
    <div>
      <p className="mono-label mb-2 text-[10px] text-gray-500">QUESTION THIS SEAT</p>
      <div className="flex flex-col gap-1.5">
        {questions.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => ask(q.label, q.answer)}
            className="rounded-[10px] border border-council/40 px-3 py-2 text-left text-[13px] font-medium text-council transition-colors hover:bg-council-wash"
          >
            {q.label}
          </button>
        ))}
      </div>
      {thread.length > 0 && (
        <div className="mt-3 space-y-2.5 rounded-xl bg-paper p-3">
          <AnimatePresence initial={false}>
            {thread.map((entry, idx) => (
              <motion.div
                key={idx}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="mono-label text-[9px] text-gray-400">YOU ASKED</p>
                <p className="mt-0.5 text-[13px] font-medium text-ink">{entry.q}</p>
                <div className="mt-1.5">
                  {entry.a === null ? (
                    <TypingDots />
                  ) : (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-[14px] rounded-tl-[4px] border border-gray-200 bg-surface px-3 py-2"
                    >
                      <p className="font-display text-[15px] italic leading-[1.5] text-ink-soft">
                        {entry.a}
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/**
 * Agent detail drawer (420px, slides from right) — persona header with live
 * stance + round history, preference radar + weight table, constraints &
 * policy options, canned Q&A. Open from any avatar, bubble, board row, or
 * influence-graph node.
 */
export default function AgentDrawer({
  actor,
  open,
  onOpenChange,
  stance,
  roundHistory,
  inRun,
  allStances,
}: {
  actor: Actor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stance: number;
  roundHistory: number[];
  inRun: boolean;
  allStances: number[];
}) {
  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-surface sm:max-w-[420px]" aria-describedby={undefined}>
        {actor && (
          <>
            <DrawerHeader className="border-b border-gray-200">
              <div className="flex items-start gap-4">
                <PersonaAvatar actor={actor} size={56} />
                <div className="min-w-0 flex-1">
                  <DrawerTitle className="font-display text-xl font-medium leading-7 text-ink">
                    {actor.name}
                  </DrawerTitle>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusChip variant="neutral" className="text-[9px]">
                      {actor.orgLabel}
                    </StatusChip>
                    <span className="mono-label text-[9px] text-gray-400">
                      SEAT {String(actor.seat).padStart(2, '0')} · λ {actor.lambda.toFixed(1)}
                    </span>
                  </div>
                  <DrawerDescription className="mt-1.5 font-display text-[14px] italic text-gray-500">
                    {actor.persona}
                  </DrawerDescription>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div className="flex-1">
                  <p className="mono-label mb-1 text-[9px] text-gray-400">
                    {inRun ? 'CURRENT STANCE' : 'STANCE — AWAITING SEED'}
                  </p>
                  <StanceBar value={stance} />
                </div>
                <RoundHistory values={roundHistory} />
              </div>
            </DrawerHeader>

            <motion.div
              className="flex-1 space-y-6 overflow-y-auto px-5 py-5"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            >
              {/* preference map */}
              <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                <p className="mono-label mb-2 text-[10px] text-gray-500">PREFERENCE MAP</p>
                <RadarChart values={actor.weights} size={200} className="mx-auto" />
                <table className="mono-data mt-2 w-full text-[12px]">
                  <tbody>
                    {AXIS_ORDER.map((axis, i) => {
                      const w = actor.weights[i];
                      return (
                        <tr key={axis} className="border-b border-gray-200/60 last:border-0">
                          <td className="mono-label py-1 text-[10px] text-gray-500" title={AXIS_NAMES[axis]}>
                            {axis}
                          </td>
                          <td className="py-1 pr-2 text-ink-soft">{AXIS_NAMES[axis]}</td>
                          <td
                            className={cn(
                              'py-1 text-right tabular-nums',
                              w > 0 ? 'text-support' : w < 0 ? 'text-oppose' : 'text-gray-400',
                            )}
                          >
                            {w > 0 ? '+' : w < 0 ? '−' : '±'}
                            {Math.abs(w)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </motion.div>

              {/* constraints & options */}
              <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                <p className="mono-label mb-2 flex items-center gap-1.5 text-[10px] text-gray-500">
                  <Scale size={12} /> CONSTRAINTS & OPTIONS
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {actor.hardConstraints.map((c) => (
                    <StatusChip
                      key={c}
                      variant={actor.isVetoChair ? 'veto' : 'neutral'}
                      className="text-[9px] normal-case tracking-[0.02em]"
                    >
                      {c}
                    </StatusChip>
                  ))}
                </div>
                <ol className="mt-3 space-y-1">
                  {actor.policyOptions.map((opt, i) => (
                    <li key={opt} className="flex items-baseline gap-2 text-[13px] text-ink-soft">
                      <span className="mono-label text-[9px] text-gray-400">{String(i + 1).padStart(2, '0')}</span>
                      {opt}
                    </li>
                  ))}
                </ol>
              </motion.div>

              {/* canned Q&A */}
              <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                <QaThread actor={actor} inRun={inRun} allStances={allStances} />
              </motion.div>
            </motion.div>

            <div className="shrink-0 border-t border-gray-200 px-5 py-3">
              <Link
                to="/council"
                className="mono-label flex items-center gap-1.5 text-[11px] text-council hover:underline"
              >
                FULL SEAT PROFILE <ArrowRight size={12} />
              </Link>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
