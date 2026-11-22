import StatusChip from '@/components/sim/StatusChip';
import type { EngineMeta } from '@/hooks/useSimulation';
import { cn } from '@/lib/utils';

/**
 * Run-provenance chip. Teal wash when the record came from live server-side
 * LLM deliberation; quiet gray when the deterministic engine carried the run.
 * Distinguishes offline (server unreachable) from configured-but-busy LLM.
 */
export default function EngineChip({
  meta,
  className,
}: {
  meta: EngineMeta | null;
  className?: string;
}) {
  if (!meta) return null;
  if (meta.engine === 'llm') {
    return (
      <StatusChip
        variant="neutral"
        className={cn('border-council/40 bg-council-wash text-[10px] text-council', className)}
      >
        LIVE COUNCIL — LLM deliberation · {meta.model ?? 'unknown model'} · {meta.llmLayers}/5
        layers
      </StatusChip>
    );
  }
  const reason = meta.offline
    ? 'server unreachable — local deterministic engine'
    : 'deterministic engine (no LLM key or upstream busy)';
  return (
    <StatusChip variant="neutral" className={cn('text-[10px]', className)}>
      OFFLINE MODEL — {reason}
    </StatusChip>
  );
}
