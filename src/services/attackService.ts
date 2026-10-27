import { applyAttack } from '@/data-access/combat';
import type { AttackResult } from '@/domain/attack';

export interface AttackSubmission {
  attackerParticipantId: string;
  targetParticipantId: string;
  targetAc: number;
  naturalRoll: number;
  result: AttackResult;
  /** O dano final (dados digitados mais o modificador); só vale no acerto. */
  damage: number;
}

/** Manda o ataque à função do banco (ADR 0005); devolve o id do registro. */
export function submitAttack(attack: AttackSubmission): Promise<string> {
  return applyAttack({
    attackerParticipantId: attack.attackerParticipantId,
    targetParticipantId: attack.targetParticipantId,
    naturalRoll: attack.naturalRoll,
    total: attack.result.total,
    targetAc: attack.targetAc,
    hit: attack.result.hit,
    critical: attack.result.critical,
    fumble: attack.result.fumble,
    damage: attack.result.hit ? attack.damage : 0,
  });
}
