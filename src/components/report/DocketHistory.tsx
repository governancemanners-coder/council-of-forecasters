import { Link } from 'react-router';
import { CATEGORY_BY_ID } from '@/engine';

export interface DocketHistoryRow {
  id: number;
  seedText: string;
  categoryId: string;
  engine: 'llm' | 'deterministic';
  verdictKey: string;
  probability: number;
  createdAt: Date | string;
}

/**
 * Recent server-docket lines — shown under the empty report state so past
 * verdicts remain discoverable even when localStorage is clear.
 */
export default function DocketHistory({ rows }: { rows: DocketHistoryRow[] }) {
  if (!rows.length) return null;

  return (
    <section className="mx-auto max-w-[640px] px-6 pb-24">
      <h3 className="mono-label mb-4 text-[11px] text-gray-500">RECENT DOCKET · SERVER</h3>
      <ul className="divide-y divide-gray-200 border-y border-gray-200">
        {rows.slice(0, 8).map((row) => {
          const cat =
            CATEGORY_BY_ID[row.categoryId as keyof typeof CATEGORY_BY_ID]?.label ?? row.categoryId;
          const when = new Date(row.createdAt);
          const dateLabel = Number.isNaN(when.getTime())
            ? ''
            : when.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
          return (
            <li key={row.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-[14px] text-ink">{row.seedText}</p>
                <p className="mono-label mt-1 text-[10px] text-gray-500">
                  {cat} · {row.engine.toUpperCase()} · {dateLabel}
                </p>
              </div>
              <p className="mono-label shrink-0 text-[11px] text-council">
                {row.verdictKey.replace(/-/g, ' ').toUpperCase()} · ~{row.probability}%
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-center text-[13px] text-gray-500">
        Run a new seed from the{' '}
        <Link to="/simulator" className="text-council underline-offset-4 hover:underline">
          simulator
        </Link>{' '}
        to docket a fresh forecast.
      </p>
    </section>
  );
}
