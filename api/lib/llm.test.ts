import { describe, expect, it } from 'vitest';
import { extractJson, llmConfigured } from './llm';

describe('extractJson', () => {
  it('parses a bare object', () => {
    expect(extractJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses fenced JSON arrays', () => {
    const raw = 'Here you go:\n```json\n[{"actorId":"board","statement":"aye"}]\n```\n';
    expect(extractJson<{ actorId: string }[]>(raw)).toEqual([
      { actorId: 'board', statement: 'aye' },
    ]);
  });

  it('throws when no JSON is present', () => {
    expect(() => extractJson('nope')).toThrow(/no JSON/);
  });
});

describe('llmConfigured', () => {
  it('returns a boolean without throwing', () => {
    expect(typeof llmConfigured()).toBe('boolean');
  });
});
