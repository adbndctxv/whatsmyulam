// A tiny seeded random number generator.
//
// The app normally uses Math.random. Tests use this instead so results are
// repeatable: the same seed always gives the same sequence of numbers.
// (mulberry32 - a well-known small generator; not for security use.)
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
