import { motion } from 'framer-motion';
import { ACTORS, INFLUENCE_MATRIX } from '@/engine';
import { cn } from '@/lib/utils';

/**
 * 12×12 influence matrix — rows = influenced, columns = influencer.
 * Cell intensity = edge weight (0–1), teal heatmap on paper.
 * Hovering a row highlights it and the matching node edges in the
 * network diagram (shared `highlightSeat` state).
 */
export default function InfluenceMatrix({
  highlightSeat,
  onHighlight,
}: {
  highlightSeat: number | null;
  onHighlight: (seat: number | null) => void;
}) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}
          aria-label="Influence matrix — rows influenced, columns influencer"
        >
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface p-1 text-left align-bottom">
                <span className="mono-label block text-[8px] text-gray-500">
                  Influenced ↓<br />
                  Influencer →
                </span>
              </th>
              {ACTORS.map((a) => (
                <th key={a.id} className="p-1 text-center align-bottom">
                  <span
                    className={cn(
                      'mono-label inline-block text-[9px] transition-colors',
                      highlightSeat === a.seat ? 'text-council' : 'text-gray-500',
                    )}
                  >
                    {a.monogram}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACTORS.map((row, i) => {
              const isCounsel = row.isVetoChair;
              const lit = highlightSeat === row.seat;
              return (
                <tr
                  key={row.id}
                  onMouseEnter={() => onHighlight(row.seat)}
                  onMouseLeave={() => onHighlight(null)}
                  className={cn(
                    'cursor-default transition-colors',
                    lit ? 'bg-council-wash' : 'hover:bg-paper-deep',
                  )}
                >
                  <th
                    className={cn(
                      'sticky left-0 z-10 whitespace-nowrap p-1 pr-3 text-left font-normal',
                      lit ? 'bg-council-wash' : 'bg-surface',
                    )}
                  >
                    <span className="mono-label text-[9px] text-gray-500">
                      {String(row.seat).padStart(2, '0')}
                    </span>{' '}
                    <span className={cn('text-[11px]', lit ? 'text-council' : 'text-ink')}>
                      {row.shortName}
                    </span>
                  </th>
                  {isCounsel ? (
                    <td colSpan={12} className="p-1">
                      <div className="mono-label rounded-md border border-dashed border-veto/40 bg-[#FBEBEB] py-1.5 text-center text-[9px] text-veto">
                        No incoming edges — law is law (λ = 0)
                      </div>
                    </td>
                  ) : (
                    ACTORS.map((col, j) => {
                      const v = INFLUENCE_MATRIX[i][j];
                      return (
                        <motion.td
                          key={col.id}
                          className="p-[3px] text-center"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true, margin: '-40px' }}
                          transition={{ delay: j * 0.03, duration: 0.3 }}
                        >
                          {i === j ? (
                            <span className="mx-auto block h-7 w-7 rounded-md bg-paper-deep text-center leading-7 text-gray-300">
                              ·
                            </span>
                          ) : v > 0 ? (
                            <span
                              className="mx-auto block h-7 w-7 rounded-md text-[9px] leading-7"
                              style={{
                                background: `rgba(15,118,110,${0.12 + v * 0.75})`,
                                color: v >= 0.5 ? '#FFFFFF' : '#115E59',
                              }}
                              title={`${col.shortName} → ${row.shortName}: ${v.toFixed(1)}`}
                            >
                              {v.toFixed(1)}
                            </span>
                          ) : (
                            <span className="mx-auto block h-7 w-7" />
                          )}
                        </motion.td>
                      );
                    })
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
        <span className="mono-label text-[10px] text-gray-500">
          Rows = influenced · Columns = influencer · Intensity = weight
        </span>
        <span className="mono-data text-[11px] text-ink-soft">
          Strongest tie: Advocacy → Members&rsquo; Assembly <span className="text-council">0.7</span>
        </span>
      </div>
    </div>
  );
}
