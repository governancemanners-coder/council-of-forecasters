import { AXIS_ORDER } from '@/engine';
import { cn } from '@/lib/utils';

/**
 * Mini horizontal display of an actor's 8 weights (−3..+3) as tick marks
 * along a diverging scale, one lane per axis. Used on council cards.
 */
export default function AxisMeter({
  weights,
  className,
}: {
  weights: number[];
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-[3px]', className)} aria-label="Axis weights">
      {AXIS_ORDER.map((axis, i) => {
        const v = Math.max(-3, Math.min(3, weights[i] ?? 0));
        const pct = (Math.abs(v) / 6) * 100;
        const positive = v >= 0;
        return (
          <div key={axis} className="flex items-center gap-1.5">
            <span
              className="w-7 text-right"
              style={{
                fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                fontSize: 9,
                letterSpacing: '0.06em',
                color: '#6B7280',
              }}
            >
              {axis}
            </span>
            <div className="relative h-[3px] flex-1 rounded-full bg-paper-deep">
              <div className="absolute left-1/2 top-[-2px] h-[7px] w-px bg-gray-300" />
              {v !== 0 && (
                <div
                  className="absolute top-0 h-full rounded-full"
                  style={{
                    background: positive ? '#0F766E' : '#C2410C',
                    left: positive ? '50%' : `${50 - pct}%`,
                    width: `${pct}%`,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
