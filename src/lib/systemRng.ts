// O Rng do app: Math.random. O motor (src/domain) nunca o importa; quem chama o motor injeta
// este, e os testes injetam um com seed (createSeededRng).
import type { Rng } from '@/domain/rng';

export const systemRng: Rng = Math.random;
