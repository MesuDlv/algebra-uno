/**
 * Generador de números pseudoaleatorios Mulberry32.
 * Rápido, de 32 bits y 100% determinista a partir de una semilla numérica entera.
 */
export function createPRNG(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Baraja un array de manera determinista utilizando el algoritmo Fisher-Yates
 * y la función PRNG provista. No muta el array original.
 */
export function shuffleArray<T>(array: readonly T[], prng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}
