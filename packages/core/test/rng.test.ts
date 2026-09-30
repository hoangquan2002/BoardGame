import { describe, expect, it } from 'vitest';
import { SeededRng, createRng } from '../src/rng.js';

describe('Rng', () => {
  it('generates reproducible sequences with identical seeds', () => {
    const rng1 = new SeededRng(12345);
    const rng2 = new SeededRng(12345);

    const seq1 = Array.from({ length: 10 }, () => rng1.next());
    const seq2 = Array.from({ length: 10 }, () => rng2.next());

    expect(seq1).toEqual(seq2);
    expect(seq1.every((v) => v >= 0 && v < 1)).toBe(true);
  });

  it('works with string seeds identically', () => {
    const rng1 = createRng('test-room-seed');
    const rng2 = createRng('test-room-seed');

    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.int(100)).toBe(rng2.int(100));
  });

  it('generates integers within [0, maxExclusive)', () => {
    const rng = new SeededRng(99);
    for (let i = 0; i < 100; i++) {
      const val = rng.int(6);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(6);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('throws error when maxExclusive <= 0 in int()', () => {
    const rng = new SeededRng(1);
    expect(() => rng.int(0)).toThrow('maxExclusive must be > 0');
    expect(() => rng.int(-5)).toThrow('maxExclusive must be > 0');
  });

  it('shuffle does not mutate original array and preserves all elements', () => {
    const rng = new SeededRng(42);
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const originalCopy = [...original];

    const shuffled = rng.shuffle(original);

    // Original must not be modified
    expect(original).toEqual(originalCopy);

    // Shuffled must have same length and same elements
    expect(shuffled).toHaveLength(original.length);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(original);
  });

  it('shuffle is deterministic for the same seed', () => {
    const original = ['A', 'B', 'C', 'D', 'E'];
    const rng1 = new SeededRng(777);
    const rng2 = new SeededRng(777);

    expect(rng1.shuffle(original)).toEqual(rng2.shuffle(original));
  });

  it('shuffle handles empty and single-element arrays', () => {
    const rng = new SeededRng(100);
    expect(rng.shuffle([])).toEqual([]);
    expect(rng.shuffle(['only'])).toEqual(['only']);
  });
});
