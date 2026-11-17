import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

/**
 * Primary CTA — 1.03 hover scale + 120ms bg shift, ripple on click.
 */
export default function MagnetButton({
  to,
  href,
  onClick,
  children,
  variant = 'solid',
  disabled = false,
  className,
}: {
  to?: string;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: 'solid' | 'outline' | 'ghost' | 'fish';
  disabled?: boolean;
  className?: string;
}) {
  const styles = cn(
    'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-[10px] px-6 py-3 text-[15px] font-semibold transition-colors [transition-duration:120ms]',
    variant === 'solid' && 'bg-council text-white hover:bg-council-deep',
    variant === 'outline' && 'border border-council text-council hover:bg-council-wash',
    variant === 'ghost' && 'text-council underline-offset-4 hover:underline',
    variant === 'fish' && 'border border-fish-blue text-fish-blue hover:bg-[#EBF2FE]',
    disabled && 'cursor-not-allowed opacity-50',
    className,
  );

  const inner = (
    <motion.span
      className="inline-flex items-center gap-2"
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.span>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={styles}>
        {inner}
      </Link>
    );
  }
  if (href && !disabled) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={styles}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={styles}>
      {inner}
    </button>
  );
}
