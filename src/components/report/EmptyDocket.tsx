import { Link } from 'react-router';
import { motion } from 'framer-motion';
import MagnetButton from '@/components/MagnetButton';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Report empty state — no run on record. Centered 480px column with the
 * empty-docket illustration, heading, and a Convene CTA. If a previous run
 * exists in localStorage, shows the "Reopen last forecast" secondary link.
 */
export default function EmptyDocket({
  lastRunMeta,
}: {
  lastRunMeta: { categoryLabel: string; seedHash: string } | null;
}) {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center bg-paper px-6 py-24">
      <div className="flex w-full max-w-[480px] flex-col items-center text-center">
        <motion.img
          src="/empty-docket.svg"
          alt="An empty docket clipboard with a gavel resting beside it"
          className="w-full max-w-[360px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        />
        <motion.h2
          className="mt-8 font-display text-[34px] font-medium leading-10 tracking-[-0.01em] text-ink"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        >
          No forecast on record.
        </motion.h2>
        <motion.p
          className="mt-4 text-base leading-[26px] text-ink-soft"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
        >
          The Report Agent only writes after the Council sits. Run a simulation and your verdict
          will be docketed here.
        </motion.p>
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
        >
          <MagnetButton to="/simulator">Convene the Council</MagnetButton>
        </motion.div>
        {lastRunMeta && (
          <motion.p
            className="mt-6 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <Link
              to="/report?reopen=1"
              className="text-council underline-offset-4 transition-colors hover:text-council-deep hover:underline"
            >
              Reopen last forecast
            </Link>{' '}
            —{' '}
            <span className="mono-label text-[11px] text-gray-500">
              {lastRunMeta.categoryLabel} · SEED #{lastRunMeta.seedHash}
            </span>
          </motion.p>
        )}
      </div>
    </div>
  );
}
