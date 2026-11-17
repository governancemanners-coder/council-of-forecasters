import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepState = 'done' | 'active' | 'locked';

export interface StepDef {
  key: string;
  label: string;
  state: StepState;
}

/**
 * The four-step run indicator: `01 SEED · 02 COUNCIL · 03 SIMULATION · 04 REPORT`
 * connected by hairlines. Done = teal check, active = teal pulsing dot (2s),
 * locked = gray. Completed steps are clickable.
 */
export default function StepIndicator({
  steps,
  onStepClick,
  variant = 'bar',
  className,
}: {
  steps: StepDef[];
  onStepClick?: (key: string) => void;
  /** 'bar' = Navbar sub-bar (compact); 'large' = Home how-it-works. */
  variant?: 'bar' | 'large';
  className?: string;
}) {
  const large = variant === 'large';
  return (
    <ol className={cn('flex items-center', large ? 'gap-4' : 'gap-2', className)}>
      {steps.map((step, i) => {
        const clickable = step.state === 'done' && !!onStepClick;
        return (
          <li key={step.key} className="flex items-center">
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  'mx-2 h-px bg-gray-300',
                  large ? 'w-10' : 'w-6',
                )}
              />
            )}
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(step.key)}
              className={cn(
                'mono-label flex items-center gap-2 rounded-full px-2 py-1 transition-colors',
                step.state === 'active' && 'text-council',
                step.state === 'done' && 'text-ink hover:text-council',
                step.state === 'locked' && 'cursor-default text-gray-400',
                clickable && 'cursor-pointer',
                large && 'text-sm',
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center rounded-full border',
                  large ? 'h-7 w-7' : 'h-5 w-5',
                  step.state === 'done' && 'border-council bg-council text-surface',
                  step.state === 'active' && 'border-council',
                  step.state === 'locked' && 'border-gray-300',
                )}
              >
                {step.state === 'done' ? (
                  <Check size={large ? 14 : 10} strokeWidth={3} />
                ) : (
                  <span
                    className={cn(
                      'rounded-full',
                      large ? 'h-2 w-2' : 'h-1.5 w-1.5',
                      step.state === 'active' ? 'animate-pulse bg-council' : 'bg-gray-300',
                    )}
                    style={step.state === 'active' ? { animationDuration: '2s' } : undefined}
                  />
                )}
              </span>
              {step.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Canonical step definitions for the run pipeline. */
export const RUN_STEPS = [
  { key: 'seed', label: '01 SEED' },
  { key: 'council', label: '02 COUNCIL' },
  { key: 'simulation', label: '03 SIMULATION' },
  { key: 'report', label: '04 REPORT' },
] as const;
