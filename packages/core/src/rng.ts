export interface Rng {
  /**
   * Generates a pseudo-random floating-point number in [0, 1).
   */
  next(): number;

  /**
   * Generates a pseudo-random integer in [0, maxExclusive).
   * @throws Error if maxExclusive <= 0
   */
  int(maxExclusive: number): number;

  /**
   * Returns a new array with elements shuffled using the Fisher-Yates algorithm.
   * Does NOT mutate the input array.
   */
  shuffle<T>(arr: readonly T[]): T[];
}

/**
 * Seeded pseudo-random number generator using the Mulberry32 algorithm.
 */
export class SeededRng implements Rng {
  private state: number;

  constructor(seed: number | string = 1) {
    if (typeof seed === 'string') {
      let hash = 1779033703 ^ seed.length;
      for (let i = 0; i < seed.length; i++) {
        hash = Math.imul(hash ^ seed.charCodeAt(i), 3432918353);
        hash = (hash << 13) | (hash >>> 19);
      }
      this.state = hash >>> 0;
    } else {
      this.state = (seed >>> 0) || 1;
    }
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(maxExclusive: number): number {
    if (maxExclusive <= 0) {
      throw new Error(`maxExclusive must be > 0, got ${maxExclusive}`);
    }
    return Math.floor(this.next() * maxExclusive);
  }

  shuffle<T>(arr: readonly T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      const temp = copy[i]!;
      copy[i] = copy[j]!;
      copy[j] = temp;
    }
    return copy;
  }
}

export function createRng(seed?: number | string): Rng {
  return new SeededRng(seed);
}
