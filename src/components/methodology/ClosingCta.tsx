import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router';
import MagnetButton from '@/components/MagnetButton';
import { EASE } from '@/components/methodology/ease';

/**
 * Toronto skyline divider — the continuous-line SVG inlined and drawn
 * (stroke-dashoffset, 1.2s) when it enters view. Sits at 50% opacity.
 */
function TorontoLine() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/toronto-line.svg')
      .then((r) => r.text())
      .then((text) => {
        if (alive) setSvg(text.replace('<svg ', '<svg style="width:100%;height:auto" '));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ref.current || !svg) return;
    ref.current.querySelectorAll('path').forEach((p) => {
      p.setAttribute('pathLength', '1');
      p.style.strokeDasharray = '1';
      p.style.transition = 'stroke-dashoffset 1.2s ease-in-out';
      p.style.strokeDashoffset = inView ? '0' : '1';
    });
  }, [svg, inView]);

  if (!svg) {
    return <img src="/toronto-line.svg" alt="" aria-hidden className="w-full opacity-50" />;
  }
  return (
    <div
      ref={ref}
      className="w-full opacity-50"
      aria-hidden
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/** Closing CTA — "Read the machine. Then run it." */
export default function ClosingCta() {
  return (
    <div className="mt-24">
      <TorontoLine />
      <motion.section
        className="flex flex-col items-center py-24 text-center"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <h2 className="font-display text-[34px] font-medium leading-10 tracking-[-0.01em] text-ink">
          Read the machine. Then run it.
        </h2>
        <div className="mt-8">
          <MagnetButton to="/simulator">Convene the Council</MagnetButton>
        </div>
        <Link
          to="/council"
          className="mt-5 text-sm font-medium text-council underline-offset-4 transition-colors hover:text-council-deep hover:underline"
        >
          Meet the twelve seats
        </Link>
      </motion.section>
    </div>
  );
}
