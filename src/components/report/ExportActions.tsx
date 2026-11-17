import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { Check, ClipboardCopy, Printer, RotateCcw } from 'lucide-react';
import type { SimulationRun } from '@/engine';
import { MIROFISH_CREDIT } from '@/components/Footer';
import { buildDocketText } from '@/components/report/docketText';
import { cn } from '@/lib/utils';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** fish-scale glyph (matches Footer credit strip) */
function FishGlyph({ className }: { className?: string }) {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden className={cn('shrink-0', className)}>
      <path
        d="M1 7 Q4 2 8 4 Q11 5.5 13 7 L17 4.5 Q16.4 7 17 9.5 L13 7.8 Q10 11 6 10.4 Q2.5 9.8 1 7 Z"
        fill="#2563EB"
      />
      <path d="M14 9 Q16.5 7.5 19 8.2" stroke="#2563EB" strokeWidth="1" fill="none" opacity="0.7" />
    </svg>
  );
}

/**
 * Section 7 — Export & next moves: copy the docket, print/save PDF, run a
 * new seed. Below: the verbatim MiroFish credit + the report disclaimer.
 */
export default function ExportActions({ run }: { run: SimulationRun }) {
  const [copied, setCopied] = useState(false);

  const copyDocket = async () => {
    const text = buildDocketText(run);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API unavailable (permissions/non-secure context) — fallback.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2600);
  };

  const cards = [
    {
      key: 'copy',
      title: 'Copy the docket',
      desc: 'A plain-text, minutes-style summary — verdict, band, blocs, sequencing, conditions.',
      body: (
        <button
          type="button"
          onClick={copyDocket}
          className="inline-flex items-center gap-2 rounded-[10px] bg-council px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-council-deep"
        >
          <motion.span
            key={copied ? 'check' : 'copy'}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-flex"
          >
            {copied ? <Check size={16} /> : <ClipboardCopy size={16} />}
          </motion.span>
          {copied ? 'Docket copied' : 'Copy to clipboard'}
        </button>
      ),
      note: copied ? 'Docket copied. Paste it in your board package.' : null,
    },
    {
      key: 'print',
      title: 'Print / save PDF',
      desc: 'A clean black-on-white document — chrome dropped, gauges kept as grayscale.',
      body: (
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-[10px] border border-council px-5 py-2.5 text-sm font-semibold text-council transition-colors duration-150 hover:bg-council-wash"
        >
          <Printer size={16} />
          Print this docket
        </button>
      ),
      note: null,
    },
    {
      key: 'new',
      title: 'Run a new seed',
      desc: 'The room resets; the seats do not. Bring the Council your next move.',
      body: (
        <Link
          to="/simulator"
          className="inline-flex items-center gap-2 rounded-[10px] border border-gray-300 px-5 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:border-council hover:text-council"
        >
          <RotateCcw size={16} />
          Convene again
        </Link>
      ),
      note: null,
    },
  ];

  return (
    <section aria-label="Export and next moves" className="mt-16">
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.key}
            className="flex flex-col rounded-2xl border border-gray-200 bg-surface p-6 shadow-paper-soft"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: EASE }}
          >
            <h3 className="font-display text-xl font-medium text-ink">{card.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-[22px] text-ink-soft">{card.desc}</p>
            <div className="mt-5">{card.body}</div>
            <p
              className={cn(
                'mt-3 min-h-5 text-[13px] text-council transition-opacity duration-300',
                card.note ? 'opacity-100' : 'opacity-0',
              )}
              role="status"
            >
              {card.note ?? ' '}
            </p>
          </motion.div>
        ))}
      </div>

      {/* MiroFish credit + disclaimer */}
      <motion.div
        className="mt-10 rounded-xl border-l-[3px] border-fish-blue bg-surface p-5"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        <div className="flex items-start gap-3">
          <FishGlyph className="mt-1" />
          <div>
            <p className="text-[13px] leading-5 text-fish-blue">{MIROFISH_CREDIT}</p>
            <p className="mt-2 text-[13px] leading-5 text-gray-500">
              Educational simulation. Deterministic output of a simplified model. Not legal advice,
              not a guarantee — a rehearsal.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
