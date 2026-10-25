// Fé (0 a 100) e Teste de Fé. Uma só leitura da Fé Atual, um só teto, uma só fórmula do teste.
// Termos: CONTEXT.md (Fé Atual, Fé Inicial, Fé Efetiva, Item Profano, Teste de Fé, Modificador de Fé,
// Estado de Fé).
import { ITEMS_DB } from '@/content/items';

/** Penalidade de Fé (negativa) de cada Item Profano do conteúdo, por slug. */
const PENALTY_BY_SLUG = new Map<string, number>(
  ITEMS_DB.flatMap((item) =>
    item.statPenalty?.stat === 'faith' ? [[item.id, item.statPenalty.value] as const] : [],
  ),
);

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

/**
 * Fé que sobra depois de pagar o custo de uma habilidade, entre 0 e o teto; `null` se não há Fé
 * suficiente.
 */
export function spendFaith(stats: FaithStats | null | undefined, cost: number): number | null {
  return getCurrentFaith(stats) >= cost ? addFaith(stats, -cost) : null;
}

/**
 * Soma (negativa) das penalidades de Fé dos Itens Profanos que o personagem carrega, equipados
 * ou não. Recebe os slugs dos itens e lê a penalidade do conteúdo (ADR 0003), não da linha do
 * banco.
 */
export function sumItemFaithPenalty(itemSlugs: ReadonlyArray<string | null | undefined>): number {
  let total = 0;
  for (const slug of itemSlugs) {
    const penalty = slug ? PENALTY_BY_SLUG.get(slug) : undefined;
    if (penalty) total += penalty;
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

export type FaithStateId = 'inabalavel' | 'comum' | 'abalado' | 'vulneravel' | 'ruptura';

export interface FaithState {
  id: FaithStateId;
  label: string;
  /** O efeito mecânico do doc (`docs/regras-base.md`, 4.2), para a dica do selo. */
  effect: string;
}

/**
 * Estado de Fé: Inabalável (70–100), Comum (31–69), Abalado (11–30), Vulnerável (1–10) ou Ruptura
 * (0). Segue a Fé Atual, não a Fé Efetiva: Itens Profanos não mudam o estado.
 */
export function getFaithState(stats: FaithStats | null | undefined): FaithState {
  const faith = getCurrentFaith(stats);
  if (faith >= 70) {
    return {
      id: 'inabalavel',
      label: 'Inabalável',
      effect: 'Nenhuma penalidade. Profunda paz. Recebe Inspiração 1x/dia.',
    };
  }
  if (faith >= 31) {
    return {
      id: 'comum',
      label: 'Comum',
      effect: 'Sem penalidades, sem bônus. Estado mundano.',
    };
  }
  if (faith >= 11) {
    return {
      id: 'abalado',
      label: 'Abalado',
      effect: 'Desvantagem em testes de resistência de Sabedoria ou Carisma.',
    };
  }
  if (faith >= 1) {
    return {
      id: 'vulneravel',
      label: 'Vulnerável',
      effect:
        'Risco de surtos ou possessão ao testemunhar atrocidades ou heresias: o Mestre exige Testemunho com frequência.',
    };
  }
  return {
    id: 'ruptura',
    label: 'Ruptura',
    effect:
      'O personagem sucumbe a menos que o grupo faça um ato de consagração e jejum liderado por um Sacerdote, até o nascer do sol. Habilidades que exigem Fé falham.',
  };
}

/**
 * O d4 da Fortaleza (1d4 de Fé, `docs/regras-base.md`, 4.1): vazio ou fora de 1 a 4 é recusado. A
 * Fé depois do dado sai de `addFaith`, que respeita o teto.
 */
export function checkFortitudeDie(value: number | ''): 'empty' | 'range' | null {
  if (value === '' || isNaN(value)) return 'empty';
  if (value < 1 || value > 4) return 'range';
  return null;
}
