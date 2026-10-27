import { markInspirationUsed } from '@/data-access/characters';
import { applyAttack } from '@/data-access/combat';
import type { AttackResult } from '@/domain/attack';
import type { TestMode } from '@/domain/testMode';

export interface AttackSubmission {
  attackerParticipantId: string;
  targetParticipantId: string;
  targetAc: number;
  naturalRoll: number;
  result: AttackResult;
  /** O dano final (dados digitados mais o modificador); só vale no acerto. */
  damage: number;
  appliedMode: TestMode;
  /** Os dois d20 da Rolagem Virtual com Vantagem ou Desvantagem. */
  rolls: number[] | null;
  /** Presente quando o jogador gastou a Inspiração neste ataque: a ficha, a sessão e o dia. */
  inspiration?: { characterId: string; sessionId: string; day: number };
}

/**
 * Manda o ataque à função do banco (ADR 0005); devolve o id do registro. A Inspiração só é marcada
 * na ficha depois que o ataque foi registrado; se marcar falhar, o ataque fica (o pior caso é a
 * Inspiração continuar disponível).
 */
export async function submitAttack(attack: AttackSubmission): Promise<string> {
  const id = await applyAttack({
    attackerParticipantId: attack.attackerParticipantId,
    targetParticipantId: attack.targetParticipantId,
    naturalRoll: attack.naturalRoll,
    total: attack.result.total,
    targetAc: attack.targetAc,
    hit: attack.result.hit,
    critical: attack.result.critical,
    fumble: attack.result.fumble,
    damage: attack.result.hit ? attack.damage : 0,
    appliedMode: attack.appliedMode,
    rolls: attack.rolls,
    inspirationUsed: !!attack.inspiration,
  });

  if (attack.inspiration) {
    try {
      await markInspirationUsed(
        attack.inspiration.characterId,
        attack.inspiration.sessionId,
        attack.inspiration.day,
      );
    } catch (error) {
      console.error('Error marking the Inspiration as used:', error);
    }
  }
  return id;
}
