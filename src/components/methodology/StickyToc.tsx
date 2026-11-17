import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TocItem {
  id: string;
  label: string;
}

/**
 * Sticky right-rail table of contents with scrollspy — the active section
 * gets a teal dot. Desktop only (hidden below lg).
 */
export default function StickyToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Methodology contents" className="sticky top-28 hidden lg:block">
      <p className="mono-label text-[10px] text-gray-500">CONTENTS</p>
      <ul className="mt-4 space-y-2.5 border-l border-gray-200">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id} className="relative">
              <a
                href={`#${item.id}`}
                className={cn(
                  'mono-label block py-0.5 pl-4 text-[11px] transition-colors',
                  isActive ? 'text-council' : 'text-gray-500 hover:text-ink',
                )}
              >
                {item.label}
              </a>
              <span
                aria-hidden
                className={cn(
                  'absolute -left-[3px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full transition-colors duration-200',
                  isActive ? 'bg-council' : 'bg-gray-300',
                )}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
