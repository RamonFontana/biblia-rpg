// CARACTERIZAÇÃO: regras de Descanso Curto e Longo, extraídas de SessionRestControls sem alteração.
// Decisões: ROADMAP.md, Onda 2 (bloco B): Longo 1 por dia (hoje a cada 2 dias); o Curto recarrega
// habilidades mesmo sem cura; o 1d4 de Fé é digitado pelo Mestre (ADR 0001); Sustento.
// Termos: CONTEXT.md (Descanso Curto, Descanso Longo, Sustento).
import { getMaxPv, type VitalsLike } from './vitalsUtils';

export const MAX_SHORT_RESTS_PER_DAY = 2;

/** Teto de Fé usado ao recuperar no Descanso Longo (fixo, ignora a Fé Inicial do personagem). */
const FAITH_CAP = 100;

interface RestStats extends VitalsLike {
  current_faith?: number | null;
  faith?: number | null;
}

export function canTakeShortRest(shortRestsTaken: number): boolean {
  return shortRestsTaken < MAX_SHORT_RESTS_PER_DAY;
}

/** 1 por dia de jogo: só a partir do dia seguinte ao último Descanso Longo. */
export function canTakeLongRest(currentDay: number, lastLongRestDay: number): boolean {
  return currentDay > lastLongRestDay;
}

/** O Descanso Curto só cura e recarrega habilidades quando o Mestre informa mais de 0 PV. */
export function shouldApplyShortRestToCharacters(healedPv: number): boolean {
  return healedPv > 0;
}

/** Há Sacerdote ou Sábio entre os jogadores (compara o texto, com maiúscula, como o app faz). */
export function hasPriestInGroup(vocations: (string | null | undefined)[]): boolean {
  return vocations.some((v) => v?.includes('Sacerdote') || v?.includes('Sábio'));
}

/** Fé recuperada pelo grupo no Descanso Longo: 1d4, mais 2 com um Sacerdote presente. */
export function calculateFaithRecovery(roll1d4: number, hasPriest: boolean): number {
  return hasPriest ? roll1d4 + 2 : roll1d4;
}

/** Stats do personagem depois de um Descanso Longo: PV cheios e Fé recuperada até o teto. */
export function applyLongRestToStats<T extends RestStats>(
  stats: T,
  faithRecovered: number,
): T & { current_pv: number; current_faith: number } {
  const currentFaith = stats.current_faith ?? stats.faith ?? 0;
  return {
    ...stats,
    current_pv: getMaxPv(stats),
    current_faith: Math.min(FAITH_CAP, currentFaith + faithRecovered),
  };
}
