import { markInspirationUsed } from '@/data-access/characters';
import { getCharacterResistanceSource } from '@/data-access/characters';
import { applyAttack } from '@/data-access/combat';
import { consumeAmmo } from '@/data-access/inventory';
import { resolveWeaponEffect, weaponEffectTriggers, type AttackResult } from '@/domain/attack';
import { getConditionResistanceLevels, resolveEquippedItems } from '@/domain/armorResistance';
import type { CharacterEquipment, ConditionEntry, WeaponEffect } from '@/types/combat';
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
  /** A munição que a arma gasta (funda, arco): 1 por ataque. */
  ammunition?: { characterItemId: string };
  /** Os efeitos de arma da arma usada (natural 18 ou mais no acerto) e quem é o alvo. */
  weaponEffect?: { effects: WeaponEffect[]; target: { entityId: string; entityType: string } };
}

export interface AttackOutcome {
  id: string;
  /** O efeito de arma disparou (mesmo que a Resistência a Condição o tenha anulado). */
  weaponEffectTriggered: boolean;
  /** As frases de Resistência a Condição para o Mestre. */
  messages: string[];
}

/** O nível de Resistência a Condição do alvo, por Condição; o inimigo não tem ficha nem itens. */
async function resistanceLevelsOf(entityId: string, entityType: string) {
  if (entityType === 'enemy') return {};
  const source = await getCharacterResistanceSource(entityId).catch(() => null);
  if (!source) return {};
  return getConditionResistanceLevels(
    resolveEquippedItems(source.equipment as unknown as CharacterEquipment, source.character_items),
  );
}

/**
 * Manda o ataque à função do banco (ADR 0005); devolve o id do registro. A Inspiração só é marcada
 * na ficha depois que o ataque foi registrado; se marcar falhar, o ataque fica (o pior caso é a
 * Inspiração continuar disponível).
 */
export async function submitAttack(attack: AttackSubmission): Promise<AttackOutcome> {
  const effects = attack.weaponEffect?.effects ?? [];
  const triggered = weaponEffectTriggers(attack.naturalRoll, attack.result.hit, effects);
  let weaponConditions: ConditionEntry[] = [];
  const messages: string[] = [];
  if (triggered && attack.weaponEffect) {
    const { entityId, entityType } = attack.weaponEffect.target;
    const resolved = resolveWeaponEffect(effects, await resistanceLevelsOf(entityId, entityType));
    weaponConditions = resolved.conditions;
    messages.push(...resolved.messages);
  }

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
    weaponEffectTriggered: triggered,
    weaponConditions,
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

  // Gastar a munição também é depois do registro; `consumeAmmo` registra a falha e devolve false.
  if (attack.ammunition) await consumeAmmo(attack.ammunition.characterItemId, 1);

  for (const message of messages) {
    window.dispatchEvent(new CustomEvent('combat-toast', { detail: { message } }));
  }
  return { id, weaponEffectTriggered: triggered, messages };
}
