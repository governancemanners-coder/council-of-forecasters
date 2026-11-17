import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Gavel, Landmark, Scale, ScrollText, Globe } from 'lucide-react';
import SwarmCanvas from '@/components/home/SwarmCanvas';
import HowItWorks from '@/components/home/HowItWorks';
import MagnetButton from '@/components/MagnetButton';
import RadarChart from '@/components/sim/RadarChart';
import StanceBar from '@/components/sim/StanceBar';
import PersonaAvatar from '@/components/sim/PersonaAvatar';
import AxisMeter from '@/components/sim/AxisMeter';
import StatusChip from '@/components/sim/StatusChip';
import { ACTORS, ACTOR_BY_ID, AXIS_ORDER, AXIS_NAMES, AXIS_DEFS, computeActionVector } from '@/engine';
import { MIROFISH_CREDIT } from '@/components/Footer';
import { cn } from '@/lib/utils';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ---------------------------------------------------------------- */
/* Section 1 — Hero                                                  */
/* ---------------------------------------------------------------- */

function HeroWords({ text, delay, tealWords }: { text: string; delay: number; tealWords?: string[] }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
          <motion.span
            className={cn('inline-block', tealWords?.some((t) => w.includes(t)) && 'italic text-council')}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: delay + i * 0.05, duration: 0.7, ease: EASE }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </>
  );
}

function Hero() {
  const eyebrow = 'A MIROFISH HOMAGE — SWARM INTELLIGENCE, DISTILLED TO TWELVE SEATS';
  return (
    <section className="relative flex min-h-[100dvh] min-h-[720px] items-center justify-center overflow-hidden bg-paper">
      {/* paper grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-60"
        style={{ backgroundImage: 'url(/hero-texture.png)', backgroundSize: '1200px' }}
        aria-hidden
      />
      {/* fallback ring constellation behind canvas */}
      <img
        src="/logo.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[70vmin] -translate-x-1/2 -translate-y-1/2 opacity-[0.08]"
      />
      <SwarmCanvas />

      <div className="relative z-10 mx-auto flex max-w-[900px] flex-col items-center px-6 py-28 text-center max-md:px-4">
        {/* eyebrow */}
        <p className="mono-label text-fish-blue">
          {eyebrow.split(' ').map((w, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              {w}
              {i < eyebrow.split(' ').length - 1 ? ' ' : ''}
            </motion.span>
          ))}
        </p>

        <h1 className="mt-6 font-display text-[40px] font-medium leading-[44px] tracking-[-0.02em] text-ink md:text-[64px] md:leading-[68px]">
          <HeroWords text="Run your move past the Council before you make it." delay={0.15} tealWords={['the', 'Council']} />
        </h1>

        <motion.p
          className="mt-6 max-w-[640px] text-[16px] leading-[26px] text-ink-soft"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
        >
          Council of Forecasters is a multi-agent simulation for Toronto’s housing co-operative
          sector. Propose a board decision — refinancing, intensification, a charge increase — and
          twelve sector actors deliberate in open caucus, then forecast what happens next.
        </motion.p>

        <motion.div
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5, ease: EASE }}
        >
          <MagnetButton to="/simulator">Convene the Council</MagnetButton>
          <MagnetButton to="/council" variant="ghost">
            Meet the twelve seats →
          </MagnetButton>
        </motion.div>

        <motion.div
          className="mt-7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <Link
            to="/methodology#homage"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-surface px-4 py-2 text-[13px] text-ink-soft shadow-paper-soft transition-colors hover:border-fish-blue/40"
          >
            <span className="h-2 w-2 rounded-full bg-fish-blue" />
            Inspired by the open-source MiroFish engine (AGPL-3.0) — an original reimplementation.
          </Link>
        </motion.div>
      </div>

      {/* scroll cue */}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
        <span className="mono-label text-[10px] text-gray-500">SCROLL</span>
        <div className="scroll-cue-line h-10 w-px bg-gray-500" />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Section 3 — Live teaser: the caucus floor                         */
/* ---------------------------------------------------------------- */

const MOCK_CHAT: Array<{
  actorId: keyof typeof ACTOR_BY_ID | 'counsel';
  text: string;
  chip: string;
  variant: 'support' | 'oppose' | 'neutral';
}> = [
  {
    actorId: 'board',
    text: 'Before we sign anything, I want the fiduciary analysis on the table. What do we risk, and who bears it?',
    chip: 'CAUTIOUS −0.05',
    variant: 'neutral',
  },
  {
    actorId: 'advocacy',
    text: "We hear 'partnership' and we reach for the rent ledger. Show us the affordability covenant or expect a packed members' meeting.",
    chip: 'OPPOSE −0.62',
    variant: 'oppose',
  },
  {
    actorId: 'cmhc',
    text: 'With a seed-funding application attached, this starts to look financeable. Program criteria first, density second.',
    chip: 'CAUTIOUS +0.21',
    variant: 'neutral',
  },
];

const MOCK_BOARD: Array<{ id: keyof typeof ACTOR_BY_ID; value: number }> = [
  { id: 'developer', value: 0.55 },
  { id: 'cmhc', value: 0.21 },
  { id: 'chft', value: 0.08 },
  { id: 'board', value: -0.05 },
  { id: 'advocacy', value: -0.62 },
  { id: 'counsel', value: -1.0 },
];

function CaucusTeaser() {
  return (
    <section className="bg-paper-deep py-24 md:py-32" aria-label="The caucus floor">
      <div className="mx-auto max-w-[1280px] px-6 max-md:px-4">
        <motion.div
          initial={{ y: 32, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <p className="mono-label text-council">LIVE FROM THE FLOOR</p>
          <h2 className="mt-4 max-w-[620px] font-display text-[34px] font-medium leading-[40px] tracking-[-0.01em] text-ink">
            Twelve voices. One transcript.
          </h2>
          <p className="mt-4 max-w-[640px] text-[16px] leading-[26px] text-ink-soft">
            Every run produces a deliberation you can read like minutes — every seat speaks in its
            own voice, reacts to your move and to each other, and shows its work.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          {/* mock chat feed */}
          <div className="rounded-2xl border border-gray-200 bg-paper p-5 lg:col-span-7">
            <div className="space-y-6">
              {MOCK_CHAT.slice(0, 1).map((m) => {
                const actor = ACTOR_BY_ID[m.actorId];
                return (
                  <motion.div
                    key={m.actorId}
                    className="flex gap-3"
                    initial={{ y: 16, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <PersonaAvatar actor={actor} size={40} />
                    <div className="min-w-0">
                      <div className="mb-1 text-sm font-semibold text-ink">{actor.name}</div>
                      <div className="rounded-[18px] rounded-tl-[4px] border border-gray-200 bg-surface px-4 py-3">
                        <p className="font-display text-[16px] italic leading-[1.55] text-ink">{m.text}</p>
                      </div>
                      <StatusChip variant={m.variant} className="mt-1.5 text-[10px]">{m.chip}</StatusChip>
                    </div>
                  </motion.div>
                );
              })}

              {/* veto flag */}
              <motion.div
                className="rounded-xl border-2 border-veto bg-surface p-4"
                initial={{ scale: 1.12, y: 8, opacity: 0 }}
                whileInView={{ scale: 1, y: 0, opacity: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.3, ease: 'easeIn', delay: 0.18 }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-veto text-surface">
                    <Gavel size={15} strokeWidth={2.2} />
                  </span>
                  <span className="mono-label text-veto">
                    HARD CONSTRAINT — CO-OPERATIVE CORPORATIONS ACT
                  </span>
                </div>
                <p className="mt-2 font-display text-[15px] italic leading-6 text-ink-soft">
                  “An air-rights sale altering member occupancy rights requires a members’ special
                  resolution. Skipping it caps this forecast at Blocked.”
                </p>
                <p className="mono-label mt-3 border-t border-[#F0D2D2] pt-2 text-veto">
                  FORECAST CEILING: BLOCKED UNTIL CURED
                </p>
              </motion.div>

              {MOCK_CHAT.slice(1).map((m, i) => {
                const actor = ACTOR_BY_ID[m.actorId];
                return (
                  <motion.div
                    key={m.actorId}
                    className="flex gap-3"
                    initial={{ y: 16, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.4, ease: EASE, delay: 0.18 * (i + 2) }}
                  >
                    <PersonaAvatar actor={actor} size={40} />
                    <div className="min-w-0">
                      <div className="mb-1 text-sm font-semibold text-ink">{actor.name}</div>
                      <div className="rounded-[18px] rounded-tl-[4px] border border-gray-200 bg-surface px-4 py-3">
                        <p className="font-display text-[16px] italic leading-[1.55] text-ink">{m.text}</p>
                      </div>
                      <StatusChip variant={m.variant} className="mt-1.5 text-[10px]">{m.chip}</StatusChip>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* mini stance board */}
          <div className="rounded-2xl border border-gray-200 bg-surface p-6 shadow-paper-soft lg:col-span-5">
            <p className="mono-label text-gray-500">STANCE BOARD — SAMPLE RUN</p>
            <div className="mt-5 space-y-4">
              {MOCK_BOARD.map((row, i) => {
                const actor = ACTOR_BY_ID[row.id];
                return (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                    className="flex items-center gap-3"
                  >
                    <PersonaAvatar actor={actor} size={28} />
                    <span className="w-32 truncate text-[13px] font-medium text-ink max-sm:w-24">
                      {actor.shortName}
                    </span>
                    <StanceBar value={row.value} className="flex-1" />
                  </motion.div>
                );
              })}
            </div>
            <Link
              to="/simulator"
              className="mono-label mt-6 inline-flex items-center gap-1.5 text-council hover:underline"
            >
              Full board in the Simulator <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Section 4 — Council preview marquee                               */
/* ---------------------------------------------------------------- */

function ActorMiniCard({ actorId }: { actorId: keyof typeof ACTOR_BY_ID }) {
  const actor = ACTOR_BY_ID[actorId];
  return (
    <div className="w-[300px] shrink-0 rounded-2xl border border-gray-200 bg-surface p-5 shadow-paper-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <PersonaAvatar actor={actor} size={40} />
        <div className="min-w-0">
          <h3 className="truncate font-display text-[18px] font-medium leading-6 text-ink">
            {actor.shortName}
          </h3>
          <span className="mono-label text-[9px] text-gray-500">{actor.orgLabel}</span>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 font-display text-[13px] italic leading-5 text-ink-soft">
        {actor.persona}
      </p>
      <AxisMeter weights={actor.weights} className="mt-4" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {(
          [
            ['INFLUENCE', actor.influence],
            ['SALIENCE', actor.salience],
          ] as const
        ).map(([label, v]) => (
          <div key={label}>
            <div className="mono-label flex justify-between text-[9px] text-gray-500">
              <span>{label}</span>
              <span className="tabular-nums">{v.toFixed(1)}</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-council" style={{ width: `${v * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CouncilPreview() {
  const rowA = ACTORS.slice(0, 6);
  const rowB = ACTORS.slice(6, 12);
  return (
    <section className="relative overflow-hidden bg-surface py-24 md:py-32" aria-label="The Council">
      {/* watermark */}
      <motion.img
        src="/council-chamber.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-1/2 w-[720px] max-w-none opacity-[0.06]"
        initial={{ y: '-40%' }}
        whileInView={{ y: '-60%' }}
        viewport={{ once: false }}
        transition={{ duration: 1.6, ease: 'linear' }}
      />
      <div className="relative mx-auto max-w-[1280px] px-6 max-md:px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mono-label text-gray-500">THE COUNCIL OF FORECASTERS</p>
            <h2 className="mt-4 font-display text-[34px] font-medium leading-[40px] tracking-[-0.01em] text-ink">
              Twelve seats. Every interest at the table.
            </h2>
          </div>
          <Link
            to="/council"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-council hover:underline"
          >
            Explore each seat — preference maps, vetoes, and voices <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <motion.div
        className="marquee-pause relative mt-12 space-y-5"
        initial={{ y: 24, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        {[rowA, rowB].map((row, ri) => (
          <div key={ri} className="overflow-hidden">
            <div className={cn('flex w-max gap-5 pr-5', ri === 0 ? 'marquee-track' : 'marquee-track-reverse')}>
              {[...row, ...row].map((actor, i) => (
                <ActorMiniCard key={`${actor.id}-${i}`} actorId={actor.id} />
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Section 5 — The eight axes                                        */
/* ---------------------------------------------------------------- */

function AxesSection() {
  const [hovered, setHovered] = useState<string | null>(null);
  // Default polygon: sample action — "Retrofit program with CMHC seed funding"
  const sample = computeActionVector('retrofit', { financial: 70, member: 40, regulatory: 20, timeline: 55 });
  const radarValues = sample.map((v) => v * 3) as number[]; // scale to the −3..+3 display range

  return (
    <section className="bg-paper-deep py-24 md:py-32" aria-label="The eight axes">
      <div className="mx-auto grid max-w-[1280px] gap-14 px-6 max-md:px-4 lg:grid-cols-2">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="mono-label text-gray-500">THE PREFERENCE SPACE</p>
          <h2 className="mt-4 font-display text-[34px] font-medium leading-[40px] tracking-[-0.01em] text-ink">
            Every move lands somewhere on eight axes.
          </h2>
          <p className="mt-4 max-w-[560px] text-[16px] leading-[26px] text-ink-soft">
            The engine reads your action as a vector across eight policy dimensions. Each seat on
            the Council weighs those dimensions differently — a retrofit grant thrills CMHC and
            barely moves your Ward Councillor.
          </p>
          <ul className="mt-8 space-y-1.5">
            {AXIS_ORDER.map((axis, i) => (
              <motion.li
                key={axis}
                initial={{ x: -24, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
              >
                <button
                  type="button"
                  onMouseEnter={() => setHovered(axis)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(axis)}
                  onBlur={() => setHovered(null)}
                  className={cn(
                    'flex w-full items-baseline gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                    hovered === axis ? 'bg-council-wash' : 'hover:bg-surface',
                  )}
                >
                  <span className={cn('mono-label w-10 shrink-0', hovered === axis ? 'text-council' : 'text-gray-500')}>
                    {axis}
                  </span>
                  <span className="text-sm font-semibold text-ink">{AXIS_NAMES[axis]}</span>
                  <span className="text-sm text-ink-soft">— {AXIS_DEFS[axis]}</span>
                </button>
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.div
          className="flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <RadarChart
            values={radarValues}
            size={360}
            highlightAxis={hovered}
            onAxisHover={setHovered}
            className="max-w-full"
          />
          <p className="mono-label mt-4 text-center text-[10px] text-gray-500">
            SAMPLE ACTION — RETROFIT PROGRAM WITH CMHC SEED FUNDING
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Section 6 — The legal layer                                       */
/* ---------------------------------------------------------------- */

const STATUTES = [
  {
    name: 'Co-operative Corporations Act (Ont.)',
    scope: 'Co-op incorporation, governance, member meetings.',
    trigger: 'Skipping a required special resolution.',
    Icon: ScrollText,
  },
  {
    name: 'Residential Tenancies Act',
    scope: 'Co-op eviction carve-outs post-2014.',
    trigger: 'Arrears enforcement bypassing LTB process.',
    Icon: Landmark,
  },
  {
    name: 'Ontario Human Rights Code',
    scope: 'Accommodation duty in housing.',
    trigger: 'Occupancy rules with differential impact.',
    Icon: Scale,
  },
  {
    name: 'National Housing Strategy Act',
    scope: 'Federal right-to-housing framework.',
    trigger: 'Net loss of affordable units.',
    Icon: BookOpen,
  },
  {
    name: 'UN CESCR Art. 11 / Special Rapporteur guidance',
    scope: 'Right to adequate housing.',
    trigger: 'Displacement without alternatives.',
    Icon: Globe,
  },
];

function LegalLayer() {
  return (
    <section className="bg-surface py-24 md:py-32" aria-label="The legal layer">
      {/* skyline divider */}
      <img
        src="/toronto-line.svg"
        alt=""
        aria-hidden
        className="mx-auto mb-20 w-[40%] min-w-[300px] opacity-50"
      />
      <div className="mx-auto max-w-[1280px] px-6 max-md:px-4">
        <div className="mx-auto max-w-[680px] text-center">
          <p className="mono-label text-veto">HARD GATES — LAW IS LAW</p>
          <h2 className="mt-4 font-display text-[34px] font-medium leading-[40px] tracking-[-0.01em] text-ink">
            Five frameworks can stop a move cold.
          </h2>
          <p className="mt-4 text-[16px] leading-[26px] text-ink-soft">
            The Council doesn’t just have opinions — it has vetoes. Any action crossing one of these
            frameworks triggers a hard constraint flag, and the forecast is capped until the move is
            brought inside the law.
          </p>
        </div>

        {/* veto thread */}
        <motion.div
          className="mx-auto mt-12 h-px max-w-[1080px] origin-left bg-veto/60"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />

        <div className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 max-lg:flex-col max-lg:overflow-visible lg:grid lg:grid-cols-5 lg:overflow-visible">
          {STATUTES.map((s, i) => (
            <motion.div
              key={s.name}
              className="min-w-[240px] snap-center rounded-2xl border border-gray-200 bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-veto/40 lg:min-w-0"
              initial={{ scale: 1.12, y: 8, opacity: 0 }}
              whileInView={{ scale: 1, y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.3, ease: 'easeIn', delay: i * 0.12 }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FBEBEB] text-veto">
                <s.Icon size={19} strokeWidth={1.8} />
              </span>
              <h3 className="mt-4 font-display text-[17px] font-medium leading-6 text-ink">{s.name}</h3>
              <p className="mt-2 text-[13px] leading-5 text-ink-soft">{s.scope}</p>
              <p className="mono-label mt-3 text-[9px] leading-4 text-veto/80">
                TRIGGER: {s.trigger}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Section 7 — MiroFish homage                                       */
/* ---------------------------------------------------------------- */

function HomageSection() {
  return (
    <section className="bg-paper py-24 md:py-32" aria-label="MiroFish homage">
      <div className="mx-auto max-w-[1280px] px-6 max-md:px-4">
        <div className="relative rounded-3xl p-8 md:p-14">
          {/* fish-blue hairline frame, drawn in on view */}
          {(
            [
              'absolute left-0 top-0 h-px w-full origin-left bg-fish-blue/50',
              'absolute right-0 top-0 h-full w-px origin-top bg-fish-blue/50',
              'absolute bottom-0 right-0 h-px w-full origin-right bg-fish-blue/50',
              'absolute bottom-0 left-0 h-full w-px origin-bottom bg-fish-blue/50',
            ] as const
          ).map((cls, i) => (
            <motion.span
              key={i}
              aria-hidden
              className={cls}
              initial={{ scaleX: i % 2 === 0 ? 0 : 1, scaleY: i % 2 === 1 ? 0 : 1 }}
              whileInView={{ scaleX: 1, scaleY: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: i * 0.4, ease: 'easeInOut' }}
            />
          ))}

          <div className="grid items-center gap-12 lg:grid-cols-12">
            <motion.div
              className="lg:col-span-7"
              initial={{ y: 24, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <p className="mono-label text-fish-blue">STANDING ON A SWARM</p>
              <h2 className="mt-4 font-display text-[34px] font-medium leading-[40px] tracking-[-0.01em] text-ink">
                A homage to MiroFish — deliberately smaller.
              </h2>
              <p className="mt-4 max-w-[600px] text-[16px] leading-[26px] text-ink-soft">
                MiroFish — the open-source swarm-intelligence engine by 666ghj, AGPL-3.0 — predicts
                outcomes by letting hundreds of persona agents loose on a ‘world seed.’ It is a
                remarkable piece of open software, and this project exists because of it.
              </p>

              <div className="mt-8 grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="mono-label text-ink">WHAT WE BORROWED (WITH CREDIT)</h3>
                  <p className="mt-3 text-sm leading-6 text-ink-soft">
                    The world seed, persona agents with preference structures, multi-round stance
                    propagation, a Report Agent, deep interaction with individual agents, and the
                    step-by-step run UI.
                  </p>
                </div>
                <div>
                  <h3 className="mono-label text-ink">WHAT WE CHANGED</h3>
                  <p className="mt-3 text-sm leading-6 text-ink-soft">
                    Hundreds of agents → exactly twelve, hand-assigned to real sector roles;
                    general-purpose → Toronto housing co-ops; added a hard legal/UN constraint
                    layer; deterministic client-side engine you can audit.
                  </p>
                </div>
              </div>

              <p className="mt-8 border-l-2 border-fish-blue pl-4 text-[14px] leading-6 text-fish-blue">
                {MIROFISH_CREDIT}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <MagnetButton href="https://github.com/666ghj/MiroFish" variant="fish">
                  MiroFish on GitHub →
                </MagnetButton>
                <MagnetButton to="/methodology" variant="ghost">
                  How our engine works →
                </MagnetButton>
              </div>
            </motion.div>

            <motion.div
              className="lg:col-span-5"
              initial={{ scale: 0.96, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <motion.img
                src="/mirofish-homage.png"
                alt="A school of geometric fish forming an upward forecasting curve that resolves into twelve dots — the MiroFish swarm distilled into a council."
                className="w-full rounded-2xl border border-gray-200"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Section 8 — Final CTA                                             */
/* ---------------------------------------------------------------- */

function RingMark() {
  const cx = 90;
  const cy = 90;
  const r = 62;
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return (
          <circle
            key={i}
            cx={cx + r * Math.cos(a)}
            cy={cy + r * Math.sin(a)}
            r={i === 2 ? 9 : 7}
            fill={i === 2 ? '#14b8a6' : '#FAF9F6'}
            style={{ animation: `ring-pulse 3.6s ease-in-out ${i * 0.3}s infinite` }}
          />
        );
      })}
    </svg>
  );
}

function FinalCta() {
  return (
    <section className="flex min-h-[320px] flex-col items-center justify-center bg-ink px-6 py-20 text-center max-md:px-4">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
      >
        <RingMark />
      </motion.div>
      <h2 className="mt-6 font-display text-[34px] font-medium leading-[40px] tracking-[-0.01em] text-paper md:text-[42px] md:leading-[48px]">
        {'The floor is open.'.split(' ').map((w, i) => (
          <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: 28, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.04, duration: 0.6, ease: EASE }}
            >
              {w}
            </motion.span>
            <span>&nbsp;</span>
          </span>
        ))}
      </h2>
      <motion.p
        className="mt-4 max-w-[520px] text-[16px] leading-[26px] text-gray-300"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Seed a move. Watch the sector react. Walk into your next board meeting already knowing the room.
      </motion.p>
      <motion.div
        className="mt-8 flex flex-wrap items-center justify-center gap-4"
        initial={{ scale: 0.94, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ delay: 0.3, duration: 0.4, ease: EASE }}
      >
        <MagnetButton to="/simulator">Convene the Council</MagnetButton>
        <Link
          to="/methodology"
          className="text-sm font-medium text-gray-300 underline-offset-4 transition-colors hover:text-paper hover:underline"
        >
          Read the methodology first
        </Link>
      </motion.div>
      <p className="mono-label mt-10 max-w-[520px] text-[10px] leading-5 text-gray-500">
        Educational simulation. Not legal advice. Forecasts are deterministic outputs of a simplified model.
      </p>
    </section>
  );
}

/* ---------------------------------------------------------------- */

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <CaucusTeaser />
      <CouncilPreview />
      <AxesSection />
      <LegalLayer />
      <HomageSection />
      <FinalCta />
    </>
  );
}
