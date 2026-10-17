// Fé (0 a 100) e Teste de Fé. Uma só leitura da Fé Atual, um só teto, uma só fórmula do teste.
// Termos: CONTEXT.md (Fé Atual, Fé Inicial, Fé Efetiva, Item Profano, Teste de Fé, Modificador de Fé).

/** Teto da Fé para todos os personagens. A Fé Inicial (50, ou 60 para levitas) é só o começo. */
export const FAITH_MAX = 100;

export interface FaithStats {
  current_faith?: number | null;
  /** Fé Inicial gravada na criação; vale como Fé Atual enquanto não houver `current_faith`. */
  faith?: number | null;
}

/** Fé Atual: `current_faith`, ou a Fé Inicial gravada, ou 0. */
export function getCurrentFaith(stats: FaithStats | null | undefined): number {
  return stats?.current_faith ?? stats?.faith ?? 0;
}

/** Fé Atual depois de somar `delta` (negativo perde), sempre entre 0 e o teto. */
export function addFaith(stats: FaithStats | null | undefined, delta: number): number {
  return Math.min(FAITH_MAX, Math.max(0, getCurrentFaith(stats) + delta));
}

/** Fé que sobra depois de pagar o custo de uma habilidade; `null` se não há Fé suficiente. */
export function spendFaith(stats: FaithStats | null | undefined, cost: number): number | null {
  const current = getCurrentFaith(stats);
  return current >= cost ? current - cost : null;
}

export interface ItemEffectsWithFaithPenalty {
  statPenalty?: { stat?: string; value?: number } | null;
}

/**
 * Soma (negativa) das penalidades de Fé dos Itens Profanos que o personagem carrega, equipados
 * ou não. Lê `effects.statPenalty` de cada item; o passo do conteúdo (Onda 3) troca a origem.
 */
export function sumItemFaithPenalty(
  itemEffects: Array<ItemEffectsWithFaithPenalty | null | undefined>,
): number {
  let total = 0;
  for (const effects of itemEffects) {
    const penalty = effects?.statPenalty;
    if (penalty?.stat === 'faith' && typeof penalty.value === 'number') total += penalty.value;
  }
  return total;
}

/** Fé Efetiva: a Fé Atual somada às penalidades dos Itens Profanos. É a usada nos Testes de Fé. */
export function getEffectiveFaith(
  stats: FaithStats | null | undefined,
  itemFaithPenalty: number,
): number {
  return getCurrentFaith(stats) + itemFaithPenalty;
}

/**
 * Teste de Fé: o 1d100 passa se for menor ou igual à Fé Efetiva mais o Modificador de Fé do
 * Mestre (positivo é Misericórdia, negativo é Punição). A tela do jogador e o serviço que grava
 * `is_approved` usam esta função.
 */
export function isFaithTestPassed(
  rolled: number,
  faithModifier: number,
  effectiveFaith: number,
): boolean {
  return rolled <= effectiveFaith + faithModifier;
}
