// Vantagem e Desvantagem nos Testes de sessão: a modalidade final, o dado que vale e a Rolagem
// Virtual de dois dados. Os dados da mesa são físicos (ADR 0001): o app lembra qual dado usar.
// Termos: CONTEXT.md (Vantagem, Desvantagem, Estado de Fé, Inspiração, Fortaleza).
import { rollDice } from './dice';
import type { FaithStateId } from './faith';
import type { Rng } from './rng';
import { getTestDieSides } from './sessionTests';

export type TestMode = 'normal' | 'vantagem' | 'desvantagem';
/** A marca do Mestre num alvo do pedido; nenhuma é Normal. */
export type MasterMark = 'vantagem' | 'desvantagem' | null;

export interface TestModeInput {
  testType: string;
  masterMark: MasterMark;
  /** Um item equipado atrapalha a furtividade. */
  hasStealthDisadvantage: boolean;
  /** O Estado de Fé do personagem (pela Fé Atual). */
  faithState: FaithStateId;
  inspirationUsed: boolean;
}

export interface ResolvedTestMode {
  mode: TestMode;
  /** De onde vem cada Vantagem e cada Desvantagem, para a tela dizer o porquê. */
  advantages: string[];
  disadvantages: string[];
}

const SPIRITUAL_SAVES = ['Resistência (Sabedoria)', 'Resistência (Carisma)'];

/**
 * A modalidade do Teste: Vantagem (marca do Mestre, Inspiração) e Desvantagem (marca do Mestre,
 * armadura que atrapalha a furtividade no Teste de Destreza, Abalado nos TRs de Sabedoria e
 * Carisma). Fontes do mesmo lado não empilham, e Vantagem e Desvantagem juntas se anulam.
 */
export function resolveTestMode(input: TestModeInput): ResolvedTestMode {
  const advantages: string[] = [];
  const disadvantages: string[] = [];

  if (input.masterMark === 'vantagem') advantages.push('Mestre');
  if (input.inspirationUsed) advantages.push('Inspiração');

  if (input.masterMark === 'desvantagem') disadvantages.push('Mestre');
  if (input.hasStealthDisadvantage && input.testType === 'Destreza') {
    disadvantages.push('Armadura pesada (furtividade)');
  }
  if (input.faithState === 'abalado' && SPIRITUAL_SAVES.includes(input.testType)) {
    disadvantages.push('Abalado (Fé)');
  }

  const hasAdvantage = advantages.length > 0;
  const hasDisadvantage = disadvantages.length > 0;
  const mode: TestMode =
    hasAdvantage === hasDisadvantage ? 'normal' : hasAdvantage ? 'vantagem' : 'desvantagem';
  return { mode, advantages, disadvantages };
}

/**
 * Se o dado que vale é o maior. No d20 a Vantagem fica com o maior; o Teste de Fé passa com o dado
 * menor ou igual à Fé, então lá a Vantagem fica com o menor (e a Desvantagem com o maior).
 */
function countsHigher(mode: Exclude<TestMode, 'normal'>, testType: string): boolean {
  return (mode === 'vantagem') !== (testType === 'Fé');
}

/** O dado que vale entre os rolados. */
export function pickCountingDie(mode: TestMode, testType: string, dice: number[]): number {
  if (mode === 'normal') return dice[0];
  return countsHigher(mode, testType) ? Math.max(...dice) : Math.min(...dice);
}

/** Rolagem Virtual: um dado no Teste normal, dois com Vantagem ou Desvantagem. */
export function rollTestDice(testType: string, mode: TestMode, rng: Rng): number[] {
  return rollDice(mode === 'normal' ? 1 : 2, getTestDieSides(testType), rng);
}

/** O lembrete para quem rola dados físicos; `null` no Teste normal. */
export function physicalDieReminder(testType: string, mode: TestMode): string | null {
  if (mode === 'normal') return null;
  const die = testType === 'Fé' ? 'd100' : 'd20';
  return `Role dois ${die} e use o ${countsHigher(mode, testType) ? 'maior' : 'menor'}.`;
}
