import { motion } from 'framer-motion';
import type { Actor, ChatMessage } from '@/engine';
import { deltaChip } from '@/engine';
import PersonaAvatar from './PersonaAvatar';
import StatusChip from './StatusChip';
import { cn } from '@/lib/utils';

/**
 * Caucus chat bubble — avatar left, name + org chip above, bubble `surface`
 * with 1px gray-200 border, voice line in Fraunces italic 18px, stance delta
 * chip below ("moved +0.12 toward support").
 */
export default function ChatBubble({
  actor,
  message,
  animate = true,
  onActorClick,
  className,
}: {
  actor: Actor;
  message: Pick<ChatMessage, 'text' | 'bucket' | 'delta' | 'tag'>;
  animate?: boolean;
  onActorClick?: (actor: Actor) => void;
  className?: string;
}) {
  const bucket = message.bucket ?? 'cautious';
  const chipVariant =
    bucket === 'support' ? 'support' : bucket === 'oppose' ? 'oppose' : 'neutral';

  return (
    <motion.div
      className={cn('flex gap-3', className)}
      initial={animate ? { y: 16, opacity: 0 } : false}
      animate={animate ? { y: 0, opacity: 1 } : undefined}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        type="button"
        onClick={() => onActorClick?.(actor)}
        className="mt-1 shrink-0 cursor-pointer rounded-xl transition-transform hover:scale-[1.03]"
        aria-label={`Open ${actor.name} detail`}
      >
        <PersonaAvatar actor={actor} size={40} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onActorClick?.(actor)}
            className="text-sm font-semibold text-ink hover:underline"
          >
            {actor.name}
          </button>
          <span className="mono-label rounded-full border border-gray-200 bg-paper-deep px-2 py-0.5 text-[10px] text-gray-500">
            {actor.orgLabel}
          </span>
          {message.tag && (
            <span className="mono-label rounded-full border border-council/40 bg-council-wash px-2 py-0.5 text-[10px] text-council">
              {message.tag}
            </span>
          )}
        </div>
        <div className="rounded-[18px] rounded-tl-[4px] border border-gray-200 bg-surface px-4 py-3 shadow-paper-soft">
          <p className="font-display text-[18px] italic leading-[1.55] text-ink">
            {message.text}
          </p>
        </div>
        <div className="mt-1.5">
          <StatusChip variant={chipVariant} className="text-[10px]">
            {deltaChip(bucket, message.delta)}
          </StatusChip>
        </div>
      </div>
    </motion.div>
  );
}
