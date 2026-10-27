// CARACTERIZAÇÃO: regras de Descanso Curto e Longo, extraídas de SessionRestControls sem alteração.
// Decisões: ROADMAP.md, Onda 2 (bloco B): o 1d4 de Fé é digitado pelo Mestre (ADR 0001); Sustento.
// Termos: CONTEXT.md (Descanso Curto, Descanso Longo, Sustento).
import { addFaith } from '@/domain/faith';
import { getMaxPv, type VitalsLike } from '@/domain/vitals';

export const MAX_SHORT_RESTS_PER_DAY = 2;

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
  return {
    ...stats,
    current_pv: getMaxPv(stats),
    current_faith: addFaith(stats, faithRecovered),
  };
}

/** Habilidades com usos gastos gravados em `skills`; o resto da ficha passa intacto. */
interface RestSkills {
  ability_uses?: Record<string, number>;
}

/**
 * O personagem no Início de Partida (regras-base 6.3): PV máximo, usos de Habilidade restaurados,
 * Dados de Vida devolvidos. O estado de morte e a Fé não mudam: a Fé persiste entre as sessões.
 */
export function restedForNewSession<T extends RestStats, S extends RestSkills>(sheet: {
  stats: T;
  skills: S | null | undefined;
}) {
  return {
    stats: { ...sheet.stats, current_pv: getMaxPv(sheet.stats) },
    skills: { ...(sheet.skills ?? ({} as S)), ability_uses: {} as Record<string, number> },
    hit_dice_spent: 0,
  };
}
