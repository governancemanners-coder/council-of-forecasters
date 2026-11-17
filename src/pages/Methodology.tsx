import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { motion } from 'framer-motion';
import StickyToc from '@/components/methodology/StickyToc';
import type { TocItem } from '@/components/methodology/StickyToc';
import SeedSection from '@/components/methodology/SeedSection';
import StanceSection from '@/components/methodology/StanceSection';
import CascadeSection from '@/components/methodology/CascadeSection';
import VerdictSection from '@/components/methodology/VerdictSection';
import LegalLayer from '@/components/methodology/LegalLayer';
import HomageSection from '@/components/methodology/HomageSection';
import { FaqSection, LimitsSection } from '@/components/methodology/LimitsFaq';
import ClosingCta from '@/components/methodology/ClosingCta';
import { EASE } from '@/components/methodology/ease';
import { cn } from '@/lib/utils';

const TOC: TocItem[] = [
  { id: 'seed', label: '01 THE SEED' },
  { id: 'stance', label: '02 THE STANCE' },
  { id: 'cascade', label: '03 THE CASCADE' },
  { id: 'verdict', label: '04 THE VERDICT' },
  { id: 'legal', label: '05 THE LEGAL LAYER' },
  { id: 'homage', label: '06 THE MIROFISH LINEAGE' },
  { id: 'limits', label: '07 LIMITS & DISCLAIMERS' },
  { id: 'faq', label: '08 FAQ' },
];

/** H1 with per-word rise animation. */
function TitleWords({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.04, duration: 0.6, ease: EASE }}
          >
            {w}
          </motion.span>
          {i < text.split(' ').length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </>
  );
}

/**
 * Methodology / About — /methodology. The audit page: engine math, the
 * legal/UN framework, the MiroFish lineage, disclaimers, FAQ. Single reading
 * column (max 760px) with a sticky scrollspy TOC on the right (desktop).
 */
export default function Methodology() {
  const location = useLocation();

  // Honor deep links (e.g. the Navbar homage chip → /methodology#homage).
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (!el) return;
    const id = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(id);
  }, [location.hash]);

  return (
    <div className="relative bg-paper">
      {/* paper grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ backgroundImage: 'url(/hero-texture.png)', backgroundSize: '1200px' }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1280px] px-6 pb-24 pt-16 max-md:px-4 lg:grid lg:grid-cols-[minmax(0,760px)_1fr] lg:gap-16">
        {/* Reading column */}
        <div className="min-w-0">
          {/* Header */}
          <header>
            <p className="mono-label text-gray-500">METHODOLOGY & LINEAGE</p>
            <h1 className="mt-4 font-display text-[40px] font-medium leading-[44px] tracking-[-0.015em] text-ink md:text-5xl md:leading-[54px]">
              <TitleWords text="How the Council thinks." />
            </h1>
            <motion.p
              className="mt-6 max-w-[640px] text-base leading-[26px] text-ink-soft"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: EASE }}
            >
              Everything this site does is deterministic, client-side, and small enough to hold in
              your head. No server, no machine learning, no hidden weights — a preference map, a
              dot product, an influence cascade, and four statutes that don’t negotiate. Here’s the
              whole machine.
            </motion.p>
          </header>

          <div className="mt-20 space-y-0">
            <SeedSection />
            <StanceSection />
            <CascadeSection />
            <VerdictSection />
            <LegalLayer />
            <HomageSection />
            <LimitsSection />
            <FaqSection />
          </div>

          <ClosingCta />
        </div>

        {/* Sticky TOC rail — slides in from right, desktop only */}
        <motion.aside
          className={cn('hidden lg:block')}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
        >
          <StickyToc items={TOC} />
        </motion.aside>
      </div>
    </div>
  );
}
