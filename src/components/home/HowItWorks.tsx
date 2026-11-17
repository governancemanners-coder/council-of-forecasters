import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FileText, MessagesSquare, Sprout, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    num: '01',
    key: 'SEED',
    title: 'Describe your move.',
    body: 'Type the decision your board is weighing. Pick a category, set the stakes with four sliders. This is your world seed.',
    Icon: Sprout,
  },
  {
    num: '02',
    key: 'COUNCIL',
    title: 'Twelve seats take the floor.',
    body: 'Each actor reads your move through its own preference map — fiduciary duty, funding programs, member politics, statute.',
    Icon: Users,
  },
  {
    num: '03',
    key: 'SIMULATION',
    title: 'Watch the caucus.',
    body: 'Over four rounds, stances propagate through the sector’s influence network. Allies recruit. Blockers organize. Counsel cites the Act.',
    Icon: MessagesSquare,
  },
  {
    num: '04',
    key: 'REPORT',
    title: 'Read the forecast.',
    body: 'A verdict with a probability band, your key allies and blockers, the conditions that flip the persuadable, and the order to approach them.',
    Icon: FileText,
  },
];

/**
 * Home §2 — GSAP ScrollTrigger pinned stepper. Left: sticky title + progress
 * rail; right: four step cards swapping with scroll. GSAP is isolated to this
 * component (no Framer Motion inside). Disabled under prefers-reduced-motion.
 */
export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const railFillRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const numRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [active, setActive] = useState(0);
  const [motionOK, setMotionOK] = useState(true);

  useEffect(() => {
    setMotionOK(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // NOTE: must be useLayoutEffect, not useEffect — ScrollTrigger's pin wraps
  // the section in a pin-spacer (reparents the DOM node). Layout-effect cleanup
  // (ctx.revert) runs BEFORE React removes the node on route change; a passive
  // effect would run after, and React's removeChild would crash the whole tree.
  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !sectionRef.current) return;

    // Sync ScrollTrigger with Lenis if present.
    const lenis = (window as unknown as { __lenis?: { on: (e: string, cb: () => void) => void } }).__lenis;
    if (lenis) lenis.on('scroll', ScrollTrigger.update);

    const ctx = gsap.context(() => {
      cardRefs.current.forEach((card, i) => {
        gsap.set(card, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 40, yPercent: -50 });
      });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=220%',
        pin: true,
        scrub: 0.4,
        onUpdate: (self) => {
          const p = self.progress;
          if (railFillRef.current) {
            railFillRef.current.style.transform = `scaleY(${p})`;
          }
          const idx = Math.min(3, Math.floor(p * 4));
          setActive(idx);
          cardRefs.current.forEach((card, i) => {
            if (!card) return;
            if (i === idx) {
              gsap.to(card, { opacity: 1, y: 0, yPercent: -50, duration: 0.5, overwrite: 'auto' });
            } else if (i < idx) {
              gsap.to(card, { opacity: 0, y: -20, yPercent: -50, duration: 0.4, overwrite: 'auto' });
            } else {
              gsap.to(card, { opacity: 0, y: 40, yPercent: -50, duration: 0.4, overwrite: 'auto' });
            }
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-paper" aria-label="How it works">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1280px] items-center gap-16 px-6 py-24 max-lg:flex-col max-lg:items-start max-lg:gap-10 max-md:px-4">
        {/* Left: title + progress rail */}
        <div className="flex w-full gap-6 lg:w-[40%]">
          <div className="relative w-px self-stretch bg-gray-300 max-lg:hidden">
            <div
              ref={railFillRef}
              className="absolute left-0 top-0 h-full w-px origin-top bg-council"
              style={{ transform: 'scaleY(0)' }}
            />
          </div>
          <div>
            <p className="mono-label text-gray-500">THE MIROFISH PIPELINE, COUNCIL-SCALE</p>
            <h2 className="mt-4 font-display text-[34px] font-medium leading-[40px] tracking-[-0.01em] text-ink md:text-[42px] md:leading-[48px]">
              From seed to forecast in four moves.
            </h2>
            <ol className="mt-10 space-y-4 max-lg:hidden">
              {STEPS.map((s, i) => (
                <li key={s.num} className="flex items-center gap-3">
                  <span
                    ref={(el) => {
                      numRefs.current[i] = el;
                    }}
                    className={cn(
                      'mono-label flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300',
                      i <= active
                        ? 'border-council bg-council text-surface'
                        : 'border-gray-300 text-gray-500',
                    )}
                  >
                    {s.num}
                  </span>
                  <span
                    className={cn(
                      'mono-label transition-colors duration-300',
                      i === active ? 'text-council' : 'text-gray-500',
                    )}
                  >
                    {s.key}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right: swapping step cards */}
        <div className="relative w-full lg:w-[60%]">
          <div className="relative min-h-[300px]">
            {STEPS.map((s, i) => (
              <div
                key={s.num}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={cn(
                  'rounded-2xl border border-gray-200 bg-surface p-8 shadow-paper-soft',
                  motionOK && 'lg:absolute lg:inset-x-0 lg:top-1/2',
                  i > 0 && 'max-lg:mt-4',
                  !motionOK && 'lg:mt-4',
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-council-wash text-council">
                    <s.Icon size={22} strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="mono-label text-council">
                      {s.num} {s.key}
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-medium text-ink">{s.title}</h3>
                  </div>
                </div>
                <p className="mt-5 max-w-[520px] text-[16px] leading-[26px] text-ink-soft">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
