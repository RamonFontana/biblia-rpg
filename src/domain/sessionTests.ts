// CARACTERIZAÇÃO: regras da dificuldade e da perda de Fé dos Testes de sessão, extraídas de
// MasterTestDialog e sessionTestService sem alteração de comportamento.
// Decisões: ROADMAP.md, Onda 2 (bloco B): a perda de 1d6 só ocorre em Tentação, Testemunho e
// Pedido Egoísta (hoje toda falha de Teste de Fé perde); Modificador de Fé no lugar de dificuldade.
// Termos: CONTEXT.md (Modificador de Fé, Misericórdia, Punição, Teste de Fé, Clamor, Tentação,
// Testemunho, Pedido Egoísta).
import { rollDie } from './dice';
import type { Rng } from './rng';

/** Os usos do Teste de Fé (docs/regras-base.md, 4.4). */
export const FAITH_USES = ['clamor', 'tentacao', 'testemunho'] as const;
export type FaithUse = (typeof FAITH_USES)[number];

export const FAITH_USE_LABELS: Record<FaithUse, string> = {
  clamor: 'Clamor',
  tentacao: 'Tentação',
  testemunho: 'Testemunho',
};

/**
 * Se a falha de um Teste de Fé custa 1d6 de Fé: a Tentação e o Testemunho sempre; o Clamor só com
 * Pedido Egoísta (sem ele a falha é silêncio divino). Um Teste antigo, sem uso gravado, custa.
 */
export function failureCostsFaith(use: FaithUse | null, selfishRequest: boolean): boolean {
  return use === 'clamor' ? selfishRequest : true;
}

export type FaithModifierType = 'mercy' | 'punishment';

/**
 * Valor gravado em `difficulty`. Para o Teste de Fé guarda o Modificador de Fé com sinal:
 * Misericórdia positivo, Punição negativo. Nos outros testes é a CD, sem alteração.
 */
export function toStoredDifficulty(
  testType: string,
  difficulty: number,
  faithModifierType: FaithModifierType,
): number {
  if (testType === 'Fé') {
    return faithModifierType === 'punishment' ? -Math.abs(difficulty) : Math.abs(difficulty);
  }
  return difficulty;
}

/** Teste comum (não Fé): passa quando o total alcança a CD. */
export function isRegularTestApproved(resultValue: number, difficulty: number): boolean {
  return resultValue >= difficulty;
}

/**
 * Fé perdida numa falha de Teste de Fé: o valor digitado pelo jogador (penalidade) ou, sem ele,
 * um 1d6 sorteado pelo app. Não deixa a Fé abaixo de 0.
 */
export function calculateFaithAfterFailure(
  currentFaith: number,
  faithPenalty: number | undefined,
  rng: Rng,
): { faithLoss: number; newFaith: number } {
  const faithLoss = faithPenalty !== undefined ? faithPenalty : rollDie(6, rng);
  return { faithLoss, newFaith: Math.max(0, currentFaith - faithLoss) };
}

/** Faces do dado do Teste: d100 no Teste de Fé, d20 nos demais. */
export function getTestDieSides(testType: string): number {
  return testType === 'Fé' ? 100 : 20;
}

/** Rolagem Virtual do Teste (opcional; os dados da mesa são físicos, ADR 0001). */
export function rollTestDie(testType: string, rng: Rng): number {
  return rollDie(getTestDieSides(testType), rng);
}

/**
 * O que o jogador envia: no Teste de Fé, o dado como saiu; nos demais, o dado somado ao
 * modificador do atributo e ao bônus de proficiência.
 */
export function calculateSubmittedTotal(
  testType: string,
  rolled: number,
  modifiers: { attrMod: number; profBonus: number },
): number {
  return testType === 'Fé' ? rolled : rolled + modifiers.attrMod + modifiers.profBonus;
}

/** O valor enviado (já com bônus) cabe de 0 a 100. */
export function isSubmittableResult(value: number): boolean {
  return value >= 0 && value <= 100;
}

/** O d6 da punição de Fé: vazio ou fora de 1 a 6 é recusado. */
export function checkFaithPenaltyDie(value: number | ''): 'empty' | 'range' | null {
  if (value === '' || isNaN(value)) return 'empty';
  if (value < 1 || value > 6) return 'range';
  return null;
}
