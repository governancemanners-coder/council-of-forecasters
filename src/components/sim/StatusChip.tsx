import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatusChipVariant = 'support' | 'oppose' | 'persuade' | 'veto' | 'neutral' | 'info';

const VARIANT_STYLES: Record<StatusChipVariant, string> = {
  support: 'bg-support-wash text-support border-support',
  oppose: 'bg-oppose-wash text-oppose border-oppose',
  persuade: 'bg-persuade-wash text-persuade border-persuade',
  veto: 'bg-[#FBEBEB] text-veto border-veto',
  neutral: 'bg-paper-deep text-gray-500 border-gray-300',
  info: 'bg-[#EBF2FE] text-fish-blue border-fish-blue',
};

/**
 * Pill status chip — mono label 12px uppercase, wash bg + 1px matching border.
 */
export default function StatusChip({
  variant = 'neutral',
  children,
  className,
}: {
  variant?: StatusChipVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'mono-label inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
