// A Habilidade de inimigo contra personagens (Onda 5, feature 4; ADR 0007): qual efeito o app
// aplica, como ele aparece no texto e quem falhou no TR que os jogadores fizeram pelo Teste de
// sessão. A aleatoriedade é física (ADR 0001): o jogador rola, o app só confere.
// Termos: CONTEXT.md (Habilidade de inimigo, Recarga, TR, Resistência a Condição).
import { CONDITIONS } from '@/content/conditions';
import { findEnemyAbility } from '@/content/enemyAbilities';
import type { AbilityEffect, EnemyAbilityEffect } from '@/content/schemas';
import type { ConditionEntry } from '@/types/combat';
import { resolveAbilityEffect, type TargetProtection } from './abilityEffect';
import { saveAttributeLabel } from './abilitySave';
import { rollDie } from './dice';
import { getCurrentFaith, type FaithStats } from './faith';
import type { Rng } from './rng';

/** A Habilidade na ficha do inimigo: nome e texto, e o efeito (da biblioteca ou personalizado). */
export interface EnemySkillLike {
  name: string;
  description?: string;
  libraryId?: string;
  effect?: EnemyAbilityEffect;
}

export interface EnemyAbility {
  /** O id da biblioteca ou `enemy-custom` na Habilidade personalizada. */
  id: string;
  name: string;
  description: string;
  effect: EnemyAbilityEffect;
}

export const CUSTOM_ENEMY_ABILITY_ID = 'enemy-custom';

/**
 * A Habilidade que o app aplica, ou `null` se é só texto (inimigos antigos). A referência à
 * biblioteca vale mais que um efeito ao lado; uma referência desconhecida cai no texto.
 */
export function enemyAbilityOf(skill: EnemySkillLike): EnemyAbility | null {
  if (skill.libraryId) {
    const library = findEnemyAbility(skill.libraryId);
    return library
      ? {
          id: library.id,
          name: skill.name || library.name,
          description: skill.description || library.description,
          effect: library.effect,
        }
      : null;
  }
  if (skill.effect) {
    return {
      id: CUSTOM_ENEMY_ABILITY_ID,
      name: skill.name,
      description: skill.description ?? '',
      effect: skill.effect,
    };
  }
  return null;
}

/**
 * O efeito como o motor de Habilidade o lê, contra personagens (aliados do ponto de vista dos
 * jogadores). A CD fica fora: ela é gravada no uso.
 */
export function enemyEffectAsAbilityEffect(effect: EnemyAbilityEffect): AbilityEffect {
  return {
    targets: 'allies',
    ...(effect.save && { save: { attribute: effect.save.attribute } }),
    ...(effect.apply && { apply: effect.apply }),
  };
}

const USAGE_LABEL: Record<EnemyAbilityEffect['usage'], string | null> = {
  unlimited: null,
  per_combat: '1 por combate',
  recharge: 'Recarga 5-6',
};

/** O efeito em uma linha, para a ficha do inimigo e o painel do Mestre. */
export function describeEnemyEffect(effect: EnemyAbilityEffect): string {
  const parts: string[] = [];
  if (effect.save) {
    parts.push(`TR de ${saveAttributeLabel(effect.save.attribute)} CD ${effect.save.cd}`);
  }
  for (const { conditionId, rounds } of effect.apply ?? []) {
    const name = CONDITIONS[conditionId]?.name ?? conditionId;
    parts.push(`${name} (${rounds ? `${rounds} rodadas` : 'até ser removida'})`);
  }
  if (effect.faithLoss) parts.push(`perde 1d${effect.faithLoss.sides} de Fé`);
  const usage = USAGE_LABEL[effect.usage];
  if (usage) parts.push(usage);
  return parts.join(' · ');
}

/** O que o Teste de sessão de um alvo diz, mais a proteção dele contra a Condição. */
export interface EnemySaveResult {
  participantId: string;
  name: string;
  status: 'pending' | 'submitted';
  isApproved: boolean | null;
  rollValue: number | null;
  resultValue: number | null;
  appliedMode: string | null;
  protection: TargetProtection;
}

export interface EnemySaveOutcome {
  participantId: string;
  name: string;
  /** O jogador respondeu o TR. Sem resposta, o alvo fica sem efeito (o Mestre cancelou ou esperou). */
  answered: boolean;
  natural: number | null;
  total: number | null;
  failed: boolean;
  mode: string;
  conditions: ConditionEntry[];
  messages: string[];
}

/**
 * Quem falhou no TR e o que chega a cada um. Com TR, só quem respondeu e foi reprovado recebe a
 * Condição (depois da imunidade e da Resistência a Condição); sem resposta o alvo não sofre nada.
 * Sem TR na Habilidade, a Condição entra em todos.
 */
export function resolveEnemyAbilityResults(
  effect: EnemyAbilityEffect,
  results: EnemySaveResult[],
): EnemySaveOutcome[] {
  const abilityEffect = enemyEffectAsAbilityEffect(effect);
  return results.map((result) => {
    const answered = result.status === 'submitted';
    const failed = effect.save ? answered && result.isApproved === false : true;
    const applied =
      failed && abilityEffect.apply
        ? resolveAbilityEffect(abilityEffect, result.protection)
        : { conditions: [], messages: [] };
    return {
      participantId: result.participantId,
      name: result.name,
      answered,
      natural: answered ? result.rollValue : null,
      total: answered ? result.resultValue : null,
      failed: effect.save ? failed : false,
      mode: result.appliedMode ?? 'normal',
      conditions: applied.conditions,
      messages: applied.messages,
    };
  });
}

/** O estado de uso de uma Habilidade de inimigo, gravado no participante do combate. */
export type EnemyAbilityUseState = 'used' | 'recharging';

/** O estado de uso de todas as Habilidades de um inimigo, por chave. */
export type EnemyAbilityStateMap = Record<string, EnemyAbilityUseState>;

/** A chave do estado de uso: o id da biblioteca, ou o nome na personalizada (duas não colidem). */
export function abilityStateKey(ability: Pick<EnemyAbility, 'id' | 'name'>): string {
  return ability.id === CUSTOM_ENEMY_ABILITY_ID ? `${ability.id}:${ability.name}` : ability.id;
}

/** O que o uso deixa no participante: 1 por combate fica usada, Recarga fica em recarga. */
export function stateAfterUse(usage: EnemyAbilityEffect['usage']): EnemyAbilityUseState | null {
  if (usage === 'per_combat') return 'used';
  if (usage === 'recharge') return 'recharging';
  return null;
}

/** Se a Habilidade pode ser usada agora e, se não, por quê. */
export function enemyAbilityStatus(
  key: string,
  state: EnemyAbilityStateMap | null | undefined,
): { ready: boolean; reason: string } {
  const current = state?.[key];
  if (current === 'used') return { ready: false, reason: 'Já usada neste combate' };
  if (current === 'recharging') return { ready: false, reason: 'Em Recarga (5-6)' };
  return { ready: true, reason: '' };
}

/** A Recarga volta com 5 ou 6 no d6 (CONTEXT.md, Recarga). */
export const RECHARGE_MIN = 5;

export function rechargeSucceeds(d6: number): boolean {
  return d6 >= RECHARGE_MIN;
}

/** O d6 da Recarga pela Rolagem Virtual; o dado físico é digitado pelo Mestre. */
export function rollRecharge(rng: Rng): number {
  return rollDie(6, rng);
}

/** O dado de Fé (1d4 ou 1d6) pela Rolagem Virtual. */
export function rollEnemyFaithDie(sides: 4 | 6, rng: Rng): number {
  return rollDie(sides, rng);
}

/** Valida o dado de Fé digitado: vazio, ou fora de 1 até as faces. */
export function checkFaithDie(value: number | '', sides: 4 | 6): 'empty' | 'range' | null {
  if (value === '') return 'empty';
  return Number.isInteger(value) && value >= 1 && value <= sides ? null : 'range';
}

/** A Fé que o personagem de fato perde: o dado, limitado ao que ele tem (o piso é 0). */
export function faithLostBy(stats: FaithStats | null | undefined, roll: number): number {
  return Math.min(roll, getCurrentFaith(stats));
}
