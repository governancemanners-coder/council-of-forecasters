import { useMemo } from 'react';
import type { SimulationRun } from '@/engine';
import type { EngineMeta } from '@/hooks/useSimulation';
import { readLastRun, readLastRunMeta } from '@/hooks/useSimulation';
import { trpc } from '@/providers/trpc';
import EmptyDocket from '@/components/report/EmptyDocket';
import VerdictBanner from '@/components/report/VerdictBanner';
import BlocColumns from '@/components/report/BlocColumns';
import SequencingTimeline from '@/components/report/SequencingTimeline';
import ConditionsRegister from '@/components/report/ConditionsRegister';
import ConstraintChecklist from '@/components/report/ConstraintChecklist';
import InteractionLog from '@/components/report/InteractionLog';
import ExportActions from '@/components/report/ExportActions';

/**
 * Forecast Report — /report. The Report Agent's document. Reads the last run
 * from the shared persistence contract (`cof:lastRun` via readLastRun);
 * without a run it shows the empty docket state.
 */
function docketRestoreDate(createdAt: Date | string): string {
  const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Report() {
  // Read once per mount; a fresh mount happens on every navigation here.
  const localRun = useMemo<SimulationRun | null>(() => readLastRun(), []);
  const localMeta = useMemo<EngineMeta | null>(() => readLastRunMeta(), []);

  // No local record — ask the server docket for the most recent persisted run.
  const latest = trpc.simulation.latest.useQuery(undefined, {
    enabled: !localRun,
    retry: 1,
    staleTime: 60_000,
  });

  const restored = !localRun && latest.data ? latest.data : null;
  const run = localRun ?? restored?.run ?? null;
  const meta: EngineMeta | null = localRun
    ? localMeta
    : restored
      ? { ...restored.meta, offline: false }
      : null;

  if (!run) {
    if (!localRun && latest.isPending) {
      return (
        <div className="flex min-h-[70dvh] items-center justify-center bg-paper px-6 py-24">
          <p className="mono-label text-[11px] text-gray-500">CHECKING THE SERVER DOCKET…</p>
        </div>
      );
    }
    return <EmptyDocket lastRunMeta={null} />;
  }

  return (
    <div className="bg-paper">
      {/* Print stylesheet — drops chrome, keeps the document black-on-white */}
      <style>{`
        @media print {
          header, footer { display: none !important; }
          body { background: #FFFFFF !important; }
          * { box-shadow: none !important; animation: none !important; transition: none !important; }
        }
      `}</style>
      <div className="mx-auto max-w-[860px] px-6 pb-24 pt-12 max-md:px-4">
        {restored && (
          <p className="mono-label mb-4 text-[11px] text-gray-500">
            RESTORED FROM THE SERVER DOCKET · {docketRestoreDate(restored.createdAt)}
          </p>
        )}
        <VerdictBanner run={run} meta={meta} />
        <BlocColumns forecast={run.forecast} />
        <SequencingTimeline stops={run.forecast.sequencing} />
        <ConditionsRegister run={run} />
        <ConstraintChecklist checks={run.checklist} />
        <InteractionLog run={run} />
        <ExportActions run={run} />
      </div>
    </div>
  );
}
