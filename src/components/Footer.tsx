import { Link } from 'react-router';

const FRAMEWORK_LINKS = [
  'Co-operative Corporations Act (Ontario)',
  'Residential Tenancies Act',
  'Ontario Human Rights Code',
  'National Housing Strategy Act',
  'UN CESCR Art. 11',
];

const SITE_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/council', label: 'The Council' },
  { to: '/simulator', label: 'Simulator' },
  { to: '/report', label: 'Forecast Report' },
  { to: '/methodology', label: 'Methodology' },
];

export const MIROFISH_CREDIT =
  'Inspired by the open-source MiroFish engine (AGPL-3.0) by 666ghj — an original reimplementation. Concepts homaged, no code copied.';

/**
 * Footer — ink background, 3 columns + full-width MiroFish credit strip
 * (always visible, never hidden).
 */
export default function Footer() {
  return (
    <footer className="bg-ink text-[#E7E5DE]">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-16 max-md:px-4 md:grid-cols-3">
        {/* Col 1 — brand */}
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-block rounded-lg bg-paper/10 p-1.5">
              <img src="/logo.svg" alt="" className="h-7 w-7" />
            </span>
            <span className="font-display text-[18px] font-medium text-paper">
              Council of Forecasters
            </span>
          </div>
          <p className="mt-3 font-display text-[15px] italic text-[#E7E5DE]/80">
            Run your move past the Council before you make it.
          </p>
          <p className="mono-label mt-4 text-[10px] text-[#E7E5DE]/50">
            Toronto, Ontario — educational simulation.
          </p>
        </div>

        {/* Col 2 — the framework */}
        <div>
          <h3 className="mono-label text-[#E7E5DE]/60">The framework</h3>
          <ul className="mt-4 space-y-2 text-sm text-[#E7E5DE]/85">
            {FRAMEWORK_LINKS.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        {/* Col 3 — site links + disclaimer */}
        <div>
          <h3 className="mono-label text-[#E7E5DE]/60">The site</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {SITE_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-[#E7E5DE]/85 transition-colors hover:text-paper">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[13px] leading-5 text-[#E7E5DE]/60">
            Not legal advice. Not a prediction guarantee. A teaching tool.
          </p>
        </div>
      </div>

      {/* Credit strip — always visible, never hidden */}
      <div className="border-t border-[#E7E5DE]/15">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-3 gap-y-2 px-6 py-5 max-md:px-4">
          {/* fish-scale glyph */}
          <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden className="shrink-0">
            <path d="M1 7 Q4 2 8 4 Q11 5.5 13 7 L17 4.5 Q16.4 7 17 9.5 L13 7.8 Q10 11 6 10.4 Q2.5 9.8 1 7 Z" fill="#2563EB" />
            <path d="M14 9 Q16.5 7.5 19 8.2" stroke="#2563EB" strokeWidth="1" fill="none" opacity="0.7" />
          </svg>
          <p className="text-[13px] leading-5 text-fish-blue">{MIROFISH_CREDIT}</p>
          <a
            href="https://github.com/666ghj/MiroFish"
            target="_blank"
            rel="noreferrer"
            className="mono-label text-[10px] text-fish-blue/80 underline-offset-4 transition-colors hover:text-fish-blue hover:underline"
          >
            github.com/666ghj/MiroFish →
          </a>
        </div>
      </div>
    </footer>
  );
}
