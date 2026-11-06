// O Ataque Furtivo do inimigo (CONTEXT.md: Ataque Furtivo): +1d6 de dano, uma vez por turno, com
// Vantagem ou com um aliado a 1,5 m do alvo. O app só lembra o Mestre; o 1d6 entra no "Modificar
// Vida". O estado guarda a rodada do "usei" no `ability_state` do participante: o lembrete volta no
// turno seguinte do inimigo, sem precisar de uma gravação para liberar.
import { hasSkillNamed, stateRecord } from './abilityState';

const FURTIVO_NAME = 'Ataque Furtivo';
const FURTIVO_STATE_KEY = 'furtivo';
export const FURTIVO_REMINDER = '+1d6 disponível (Vantagem ou aliado a 1,5 m do alvo)';

export interface FurtivoState {
  /** A rodada em que o Mestre marcou "usei"; `null` se ainda não usou neste combate. */
  usedRound: number | null;
}

/** Só o nome exato: o "Ataque Furtivo de Emboscada" da Sentinela é outra passiva. */
export function hasFurtivo(skills: unknown): boolean {
  return hasSkillNamed(skills, FURTIVO_NAME);
}

export function furtivoStateOf(raw: unknown): FurtivoState {
  const furtivo = stateRecord(raw)[FURTIVO_STATE_KEY];
  const usedRound =
    typeof furtivo === 'object' && furtivo !== null
      ? (furtivo as Record<string, unknown>).usedRound
      : undefined;
  return {
    usedRound: typeof usedRound === 'number' && Number.isInteger(usedRound) ? usedRound : null,
  };
}

/** O `ability_state` com o uso do Furtivo na rodada; o resto (Habilidades, Fúria) fica como está. */
export function withFurtivoUsed(raw: unknown, round: number): Record<string, unknown> {
  return { ...stateRecord(raw), [FURTIVO_STATE_KEY]: { usedRound: round } satisfies FurtivoState };
}

/** O lembrete no turno do inimigo vivo com a passiva; `used` trava o botão até a próxima rodada. */
export function furtivoReminder(input: {
  skills: unknown;
  hp: number;
  isCurrentTurn: boolean;
  round: number;
  state: FurtivoState;
}): { text: string; used: boolean } | null {
  if (!input.isCurrentTurn || input.hp <= 0 || !hasFurtivo(input.skills)) return null;
  return { text: FURTIVO_REMINDER, used: input.state.usedRound === input.round };
}
