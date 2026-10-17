// Fonte de aleatoriedade do motor. Nada em `src/domain` usa Math.random: quem sorteia recebe um
// Rng por parâmetro, e os testes passam um com seed fixa. O app usa `systemRng` (src/lib).

/** Devolve um número em [0, 1), como Math.random. */
export type Rng = () => number;

/** Rng determinístico (mulberry32): a mesma seed reproduz a mesma sequência. */
export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
