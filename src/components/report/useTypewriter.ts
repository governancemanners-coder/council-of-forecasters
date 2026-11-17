import { useEffect, useState } from 'react';

/**
 * Types `text` on character-by-character once `active` is true.
 * Returns the revealed prefix and whether typing has finished.
 */
export function useTypewriter(text: string, msPerChar = 15, active = true) {
  const [count, setCount] = useState(0);

  // Reset synchronously during render when the input changes (allowed pattern).
  const key = `${text}::${active}`;
  const [prevKey, setPrevKey] = useState(key);
  if (prevKey !== key) {
    setPrevKey(key);
    setCount(0);
  }

  useEffect(() => {
    if (!active) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      const id = window.setTimeout(() => setCount(text.length), 0);
      return () => window.clearTimeout(id);
    }
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, msPerChar);
    return () => window.clearInterval(id);
  }, [text, msPerChar, active]);

  return { typed: text.slice(0, count), done: count >= text.length };
}
