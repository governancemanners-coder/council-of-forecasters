import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { SimulationRun } from '@/engine';
import { CATEGORY_BY_ID, seedHash } from '@/engine';
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
import DocketHistory from '@/components/report/DocketHistory';

/**
 * Forecast Report — /report. The Report Agent's document. Reads the last run
 * from the shared persistence contract (`cof:lastRun` via readLastRun);
 * without a run it shows the empty docket state (with server history).
 */
function docketRestoreDate(createdAt: Date | string): string {
  const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Report() {
  const [params] = useSearchParams();
  const reopen = params.get('reopen') === '1';

  // Read once per mount; a fresh mount happens on every navigation here.
  const localRun = useMemo<SimulationRun | null>(() => readLastRun(), []);
  const localMeta = useMemo<EngineMeta | null>(() => readLastRunMeta(), []);

  // Prefer local record. `?reopen=1` also forces the local restore path.
  const preferLocal = Boolean(localRun) || reopen;

  // No local record — ask the server docket for the most recent persisted run.
  const latest = trpc.simulation.latest.useQuery(undefined, {
    enabled: !preferLocal,
    retry: 1,
    staleTime: 60_000,
  });

  const history = trpc.simulation.history.useQuery(undefined, {
    enabled: !preferLocal && !latest.data,
    retry: 1,
    staleTime: 60_000,
  });

  const restored = !preferLocal && latest.data ? latest.data : null;
  const run = (preferLocal ? localRun : null) ?? restored?.run ?? null;
  const meta: EngineMeta | null = preferLocal
    ? localMeta
    : restored
      ? { ...restored.meta, offline: false }
      : null;

  const emptyMeta =
    !run && localRun
      ? {
          categoryLabel: CATEGORY_BY_ID[localRun.seed.categoryId]?.label ?? localRun.seed.categoryId,
          seedHash: seedHash(localRun.seed.text),
        }
      : null;

  if (!run) {
    if (!preferLocal && latest.isPending) {
      return (
        <div className="flex min-h-[70dvh] items-center justify-center bg-paper px-6 py-24">
          <p className="mono-label text-[11px] text-gray-500">CHECKING THE SERVER DOCKET…</p>
        </div>
      );
    }
    return (
      <div className="bg-paper">
        <EmptyDocket lastRunMeta={emptyMeta} />
        <DocketHistory rows={history.data ?? []} />
      </div>
    );
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
