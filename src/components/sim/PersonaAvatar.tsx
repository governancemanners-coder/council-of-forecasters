import type { Actor } from '@/engine';
import { BLOC_COLORS } from '@/engine';
import { cn } from '@/lib/utils';

/**
 * Persona tile — rounded-12px, paper-deep bg, monogram initials in Fraunces,
 * 3px bottom accent bar in bloc color. Legal Counsel gets a veto-colored
 * corner tick. No photographic faces — the Council is archetypes, not people.
 */
export default function PersonaAvatar({
  actor,
  size = 40,
  className,
}: {
  actor: Actor;
  /** 40 (chat) or 56 (card). */
  size?: 28 | 36 | 40 | 56 | number;
  className?: string;
}) {
  const bloc = BLOC_COLORS[actor.id];
  return (
    <div
      className={cn('relative shrink-0 overflow-hidden rounded-xl bg-paper-deep', className)}
      style={{ width: size, height: size }}
      aria-label={actor.name}
      role="img"
    >
      <div
        className="flex h-full w-full items-center justify-center font-display"
        style={{
          fontSize: size * 0.34,
          fontWeight: 560,
          color: '#3F444A',
          letterSpacing: '-0.01em',
        }}
      >
        {actor.monogram}
      </div>
      {/* 3px bottom accent bar in bloc color */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: 3, background: bloc }} />
      {/* veto corner tick for the Veto Chair */}
      {actor.isVetoChair && (
        <div
          className="absolute right-0 top-0"
          style={{
            width: 0,
            height: 0,
            borderTop: `${Math.max(10, size * 0.28)}px solid #B91C1C`,
            borderLeft: `${Math.max(10, size * 0.28)}px solid transparent`,
          }}
        />
      )}
    </div>
  );
}
