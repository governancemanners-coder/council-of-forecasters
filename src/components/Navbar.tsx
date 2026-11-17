import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import StepIndicator from '@/components/sim/StepIndicator';
import type { StepDef } from '@/components/sim/StepIndicator';
import { RUN_STEPS } from '@/components/sim/StepIndicator';
import { useRunSteps } from '@/components/navStepStore';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/council', label: 'Council' },
  { to: '/simulator', label: 'Simulator' },
  { to: '/report', label: 'Forecast Report' },
  { to: '/methodology', label: 'Methodology' },
];

/**
 * Navbar — 64px, surface bg, 1px gray-200 bottom border, sticky top-0 z-50
 * (normal document flow — pages do not compensate for nav height).
 * Step-indicator sub-bar variant renders on /simulator and /report.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { current, done } = useRunSteps();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const showSteps = location.pathname === '/simulator' || location.pathname === '/report';

  const stepDefs: StepDef[] = RUN_STEPS.map((s) => ({
    key: s.key,
    label: s.label,
    state:
      location.pathname === '/report'
        ? s.key === 'report'
          ? 'active'
          : 'done'
        : done.has(s.key)
          ? 'done'
          : s.key === current
            ? 'active'
            : 'locked',
  }));

  const onStepClick = (key: string) => {
    if (key === 'report') navigate('/report');
    else navigate('/simulator');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-gray-200 bg-surface transition-shadow duration-300',
        scrolled && 'shadow-paper-soft',
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-6 max-md:px-4">
        {/* Left: logo + wordmark + homage chip */}
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Council of Forecasters — home">
            <img src="/logo.svg" alt="" className="h-8 w-8" />
            <span className="hidden whitespace-nowrap font-display text-[18px] font-medium tracking-[-0.01em] text-ink sm:inline">
              Council of Forecasters
            </span>
          </Link>
          <Link
            to="/methodology#homage"
            className="mono-label hidden rounded-full border border-fish-blue/30 px-2 py-0.5 text-[10px] text-fish-blue transition-colors hover:bg-[#EBF2FE] md:inline-flex"
          >
            a MiroFish homage
          </Link>
        </div>

        {/* Center links */}
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'group relative py-1 text-sm font-medium transition-colors',
                  isActive ? 'text-ink' : 'text-gray-500 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  <span
                    className={cn(
                      'absolute bottom-0 left-0 h-[2px] w-full origin-left bg-council transition-transform duration-200',
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right: CTA + mobile hamburger */}
        <div className="flex items-center gap-3">
          <Link
            to="/simulator"
            className="hidden rounded-[10px] bg-council px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:scale-[1.02] hover:bg-council-deep sm:inline-flex"
          >
            Convene the Council
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-ink hover:bg-paper-deep lg:hidden"
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          >
            {drawerOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Step-indicator sub-bar (simulator + report) */}
      {showSteps && (
        <div className="border-t border-gray-200 bg-paper-deep">
          <div className="mx-auto flex h-11 max-w-[1280px] items-center px-6 max-md:overflow-x-auto max-md:px-4">
            <StepIndicator steps={stepDefs} onStepClick={onStepClick} />
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.nav
            className="fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col gap-1 bg-surface px-6 pt-6 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-label="Mobile"
          >
            {NAV_LINKS.map((link, i) => (
              <motion.div
                key={link.to}
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
              >
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'block border-b border-gray-200 py-4 font-display text-2xl',
                      isActive ? 'text-council' : 'text-ink',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              </motion.div>
            ))}
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="pt-6"
            >
              <Link
                to="/simulator"
                className="inline-flex rounded-[10px] bg-council px-6 py-3 text-[15px] font-semibold text-white"
              >
                Convene the Council
              </Link>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
