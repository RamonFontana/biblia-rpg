// O Ataque Furtivo do inimigo (CONTEXT.md: Ataque Furtivo): +1d6 de dano, uma vez por turno, com
// Vantagem ou com um aliado a 1,5 m do alvo. O app só lembra o Mestre; o 1d6 entra no "Modificar
// Vida". O estado guarda a rodada do "usei" no `ability_state` do participante: o lembrete volta no
// turno seguinte do inimigo, sem precisar de uma gravação para liberar.
export const FURTIVO_NAME = 'Ataque Furtivo';
export const FURTIVO_STATE_KEY = 'furtivo';
export const FURTIVO_REMINDER = '+1d6 disponível (Vantagem ou aliado a 1,5 m do alvo)';

export interface FurtivoState {
  /** A rodada em que o Mestre marcou "usei"; `null` se ainda não usou neste combate. */
  usedRound: number | null;
}

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Só o nome exato: o "Ataque Furtivo de Emboscada" da Sentinela é outra passiva. */
export function hasFurtivo(skills: unknown): boolean {
  return (
    Array.isArray(skills) &&
    skills.some(
      (skill) =>
        typeof skill === 'object' &&
        skill !== null &&
        typeof (skill as { name?: unknown }).name === 'string' &&
        normalize((skill as { name: string }).name) === normalize(FURTIVO_NAME),
    )
  );
}

export function furtivoStateOf(raw: unknown): FurtivoState {
  const furtivo =
    typeof raw === 'object' && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)[FURTIVO_STATE_KEY]
      : undefined;
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
  const rest =
    typeof raw === 'object' && raw !== null && !Array.isArray(raw)
      ? { ...(raw as Record<string, unknown>) }
      : {};
  return { ...rest, [FURTIVO_STATE_KEY]: { usedRound: round } satisfies FurtivoState };
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
